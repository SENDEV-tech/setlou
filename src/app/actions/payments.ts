"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/server/data/supabase-store";
import {
  createOrderCheckout,
  deleteShopWaveAccount,
  saveShopWaveAccount,
  type ShopWaveStatus,
} from "@/server/data/shop-wave";

type FieldErrors = Partial<Record<"apiKey" | "webhookSecret", string[]>>;
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string; fieldErrors?: FieldErrors };

const optionalSecret = z
  .string()
  .trim()
  .max(500, "Valeur trop longue.")
  .refine((v) => !/\s/.test(v), "Ne doit pas contenir d'espace.")
  .optional()
  .transform((v) => v || undefined);

const waveAccountSchema = z.object({
  apiKey: optionalSecret.refine((v) => !v || v.length >= 20, "Clé API trop courte : copiez-la en entier."),
  webhookSecret: optionalSecret,
});

async function requireOwnerShopId(): Promise<string | null> {
  const profile = await getCurrentProfile();
  return profile.role === "owner" ? (profile.shop_id as string) : null;
}

export async function saveWaveAccountAction(input: { apiKey?: string; webhookSecret?: string }): Promise<ActionResult<ShopWaveStatus>> {
  const parsed = waveAccountSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Vérifiez les champs.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  try {
    const shopId = await requireOwnerShopId();
    if (!shopId) return { ok: false, error: "Seul le propriétaire de la boutique peut connecter Wave." };

    const result = await saveShopWaveAccount(shopId, parsed.data);
    if (!result.ok) {
      return { ok: false, error: result.error, fieldErrors: result.field ? { [result.field]: [result.error] } : undefined };
    }
    revalidatePath("/parametres");
    return { ok: true, data: result.status };
  } catch (error) {
    console.error("saveWaveAccountAction:", error);
    return { ok: false, error: "Erreur lors de l'enregistrement du compte Wave." };
  }
}

export async function disconnectWaveAccountAction(): Promise<ActionResult<null>> {
  try {
    const shopId = await requireOwnerShopId();
    if (!shopId) return { ok: false, error: "Seul le propriétaire de la boutique peut déconnecter Wave." };
    await deleteShopWaveAccount(shopId);
    revalidatePath("/parametres");
    return { ok: true, data: null };
  } catch (error) {
    console.error("disconnectWaveAccountAction:", error);
    return { ok: false, error: "Erreur lors de la déconnexion du compte Wave." };
  }
}

const tokenSchema = z.string().min(1).max(255);

// Page publique /pay/[token] : le client lance le paiement Wave.
export async function startWavePaymentAction(token: string): Promise<ActionResult<{ url: string }>> {
  const parsed = tokenSchema.safeParse(token);
  if (!parsed.success) return { ok: false, error: "Lien de paiement invalide." };
  try {
    const result = await createOrderCheckout(parsed.data);
    return result.ok ? { ok: true, data: { url: result.url } } : { ok: false, error: result.error };
  } catch (error) {
    console.error("startWavePaymentAction:", error);
    return { ok: false, error: "Erreur lors du lancement du paiement Wave." };
  }
}
