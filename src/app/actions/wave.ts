"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/server/data/supabase-store";
import {
  checkWaveApiKey,
  createWaveCheckout,
  deleteWaveSettings,
  getAppOrigin,
  isWaveEnabled,
  saveWaveSettings,
} from "@/server/data/wave";
import { createAdminClient } from "@/utils/supabase/admin";

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

const waveSettingsSchema = z.object({
  apiKey: z.string().trim().min(20, "Clé API Wave invalide."),
  webhookSecret: z.string().trim().min(10, "Secret de webhook invalide."),
});

async function requireOwnerShopId(): Promise<string> {
  const profile = await getCurrentProfile();
  if (profile.role !== "owner") throw new Error("Seul le propriétaire peut gérer les paiements.");
  return profile.shop_id as string;
}

export async function saveWaveSettingsAction(formData: FormData): Promise<ActionResult<null>> {
  const parsed = waveSettingsSchema.safeParse({
    apiKey: formData.get("apiKey"),
    webhookSecret: formData.get("webhookSecret"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Champs invalides.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  try {
    const shopId = await requireOwnerShopId();
    if (!(await checkWaveApiKey(parsed.data.apiKey))) {
      return { ok: false, error: "Wave refuse cette clé API. Vérifiez qu'elle a l'accès Checkout.", fieldErrors: { apiKey: ["Clé refusée par Wave."] } };
    }
    await saveWaveSettings(shopId, parsed.data.apiKey, parsed.data.webhookSecret);
    revalidatePath("/parametres");
    return { ok: true, data: null };
  } catch (error) {
    console.error("saveWaveSettingsAction:", error);
    return { ok: false, error: error instanceof Error ? error.message : "Erreur lors de l'enregistrement." };
  }
}

export async function disconnectWaveAction(): Promise<ActionResult<null>> {
  try {
    const shopId = await requireOwnerShopId();
    await deleteWaveSettings(shopId);
    revalidatePath("/parametres");
    return { ok: true, data: null };
  } catch (error) {
    console.error("disconnectWaveAction:", error);
    return { ok: false, error: error instanceof Error ? error.message : "Erreur lors de la déconnexion." };
  }
}

const tokenSchema = z.string().trim().min(8).max(64);

// Page publique /pay/[token] : crée une session Wave et renvoie l'URL de paiement.
export async function startWavePaymentAction(token: string): Promise<ActionResult<{ launchUrl: string }>> {
  const parsed = tokenSchema.safeParse(token);
  if (!parsed.success) return { ok: false, error: "Lien de paiement invalide." };

  try {
    const adminClient = createAdminClient();
    const { data: order, error } = await adminClient
      .from("orders")
      .select("id, shop_id, total_xof, status, token_hash")
      .eq("token_hash", parsed.data)
      .maybeSingle();
    if (error || !order) return { ok: false, error: "Commande introuvable." };
    if (!["pending", "verifying", "expired"].includes(order.status)) {
      return { ok: false, error: "Cette commande ne peut plus être payée." };
    }
    if (!(await isWaveEnabled(order.shop_id))) {
      return { ok: false, error: "Le paiement Wave n'est pas activé pour cette boutique." };
    }

    const origin = await getAppOrigin();
    const payUrl = `${origin}/pay/${order.token_hash}`;
    const session = await createWaveCheckout(order.shop_id, {
      amountXof: order.total_xof,
      orderId: order.id,
      successUrl: `${payUrl}?wave=succes`,
      errorUrl: `${payUrl}?wave=erreur`,
    });

    await adminClient.from("orders").update({ wave_checkout_id: session.id }).eq("id", order.id);
    return { ok: true, data: { launchUrl: session.wave_launch_url } };
  } catch (error) {
    console.error("startWavePaymentAction:", error);
    return { ok: false, error: "Wave est indisponible pour le moment. Réessayez ou payez par transfert." };
  }
}
