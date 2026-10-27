import 'server-only';
import webpush from 'web-push';
import { formatXOF } from '@/lib/money';

export type PushSubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

let vapidReady: boolean | null = null;

// Les clés VAPID se génèrent une fois avec `npx web-push generate-vapid-keys`.
function ensureVapid() {
  if (vapidReady !== null) return vapidReady;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    console.warn('Push désactivé : NEXT_PUBLIC_VAPID_PUBLIC_KEY ou VAPID_PRIVATE_KEY manquant.');
    vapidReady = false;
    return vapidReady;
  }
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:contact@setlou.com', publicKey, privateKey);
  vapidReady = true;
  return vapidReady;
}

async function getAdminClient() {
  const { createAdminClient } = await import('@/utils/supabase/admin');
  return createAdminClient();
}

export async function savePushSubscription(userId: string, shopId: string, sub: PushSubscriptionInput, userAgent: string | null) {
  const adminClient = await getAdminClient();
  // Un même navigateur peut changer de compte : l'endpoint suit le dernier utilisateur connecté.
  const { error } = await adminClient.from('push_subscriptions').upsert({
    user_id: userId,
    shop_id: shopId,
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
    user_agent: userAgent,
  }, { onConflict: 'endpoint' });
  if (error) throw error;
}

export async function deletePushSubscription(userId: string, endpoint: string) {
  const adminClient = await getAdminClient();
  const { error } = await adminClient.from('push_subscriptions').delete().eq('user_id', userId).eq('endpoint', endpoint);
  if (error) throw error;
}

type PushPayload = { title: string; body: string; url: string; tag?: string };

async function sendToShop(shopId: string, payload: PushPayload, onlyUserId?: string) {
  if (!ensureVapid()) return 0;
  const adminClient = await getAdminClient();
  let query = adminClient.from('push_subscriptions').select('id, endpoint, p256dh, auth').eq('shop_id', shopId);
  if (onlyUserId) query = query.eq('user_id', onlyUserId);
  const { data: subs, error } = await query;
  if (error) throw error;
  if (!subs?.length) return 0;

  const body = JSON.stringify(payload);
  const expired: string[] = [];
  let sent = 0;
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, { TTL: 60 * 60 * 24, urgency: 'high' });
      sent++;
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      // 404/410 : l'appareil s'est désabonné, on le retire.
      if (status === 404 || status === 410) expired.push(s.id);
      else console.error('web-push error:', status, err);
    }
  }));

  if (expired.length) {
    await adminClient.from('push_subscriptions').delete().in('id', expired);
  }
  return sent;
}

export async function notifyNewShopOrder(order: { id: string, shop_id: string, reference: string, total_xof: number, snapshot: { name?: string } | null }) {
  const name = order.snapshot?.name || 'Un client';
  await sendToShop(order.shop_id, {
    title: `Nouvelle commande ${order.reference}`,
    body: `${name} · ${formatXOF(order.total_xof)}`,
    url: '/commandes',
    tag: `order-${order.id}`,
  });
}

export async function sendTestPush(userId: string, shopId: string) {
  return sendToShop(shopId, {
    title: 'Notifications activées',
    body: 'Vous serez prévenu à chaque commande sur votre boutique.',
    url: '/commandes',
    tag: 'setlou-test',
  }, userId);
}
