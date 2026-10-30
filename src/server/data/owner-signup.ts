import "server-only";

import { createAdminClient } from "@/utils/supabase/admin";
import { TRIAL_DAYS } from "@/server/data/wave";

/**
 * Crée la boutique et le profil propriétaire d'un nouveau compte.
 * Utilisé par l'inscription email et l'inscription par téléphone.
 * Clé service_role : la RLS interdit ces insertions depuis le navigateur, et
 * aucune session n'existe encore si l'email doit être confirmé.
 */
export async function createOwnerShop(input: {
  userId: string;
  shopName: string;
  fullName: string;
  whatsapp: string;
  username: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const adminClient = createAdminClient();
  const { data: shopData, error: shopError } = await adminClient
    .from("shops")
    .insert({
      owner_id: input.userId,
      name: input.shopName,
      slug: input.shopName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      whatsapp_number: input.whatsapp,
      subscription_plan: 'starter',
      // Essai gratuit sans moyen de paiement ; ensuite Wave ou carte.
      subscription_status: 'trialing',
      subscription_provider: 'trial',
      paid_until: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      monthly_orders_limit: 100,
      max_assistants: 1,
    })
    .select()
    .single();

  if (shopError) {
    return { ok: false, error: "Erreur lors de la création de la boutique." };
  }

  const { error: profileError } = await adminClient
    .from("profiles")
    .insert({
      id: input.userId,
      shop_id: shopData.id,
      role: "owner",
      full_name: input.fullName,
      username: input.username,
      whatsapp_number: input.whatsapp,
      is_active: true,
      must_change_password: false,
    });

  if (profileError) {
    await adminClient.from("shops").delete().eq("id", shopData.id);
    return { ok: false, error: "Erreur lors de la création du profil." };
  }

  return { ok: true };
}

/** Vrai si ce compte a déjà sa boutique (profil existant). */
export async function hasOwnerProfile(userId: string): Promise<boolean> {
  const adminClient = createAdminClient();
  const { data } = await adminClient.from("profiles").select("id").eq("id", userId).maybeSingle();
  return !!data;
}
