"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { getCurrentProfile } from "@/server/data/supabase-store";
import { deletePushSubscription, savePushSubscription, sendTestPush } from "@/server/data/push";

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(512),
    auth: z.string().min(1).max(512),
  }),
});

export type PushSubscriptionPayload = z.infer<typeof subscriptionSchema>;

export async function subscribePushAction(input: PushSubscriptionPayload) {
  const parsed = subscriptionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Abonnement invalide." };
  }

  try {
    const profile = await getCurrentProfile();
    const userAgent = (await headers()).get("user-agent");
    await savePushSubscription(profile.id, profile.shop_id, parsed.data, userAgent?.slice(0, 300) ?? null);
    // Le résultat du test dit au navigateur si l'appareil peut vraiment recevoir.
    let test: { sent: number; problem: string | null } = { sent: 0, problem: "Erreur lors de l'envoi du test." };
    try {
      test = await sendTestPush(profile.id, profile.shop_id);
    } catch (error) {
      console.error("Error sending test push:", error);
    }
    return { ok: true as const, data: { testSent: test.sent > 0, problem: test.problem } };
  } catch (error) {
    console.error("Error saving push subscription:", error);
    return { ok: false as const, error: "Impossible d'activer les notifications. Réessayez." };
  }
}

export async function unsubscribePushAction(endpoint: string) {
  const parsed = z.string().url().safeParse(endpoint);
  if (!parsed.success) {
    return { ok: false as const, error: "Abonnement invalide." };
  }

  try {
    const profile = await getCurrentProfile();
    await deletePushSubscription(profile.id, parsed.data);
    return { ok: true as const, data: null };
  } catch (error) {
    console.error("Error deleting push subscription:", error);
    return { ok: false as const, error: "Impossible de désactiver les notifications." };
  }
}
