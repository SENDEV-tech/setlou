import 'server-only';
import { createECDH } from 'node:crypto';
import webpush from 'web-push';
import { formatXOF } from '@/lib/money';

export type PushSubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

// null : pas encore vérifié ; '' : clés prêtes ; sinon la raison du blocage.
let vapidProblem: string | null = null;

// Les clés VAPID se génèrent une fois avec `npx web-push generate-vapid-keys`.
function vapidSubject() {
  const raw = (process.env.VAPID_SUBJECT || '').trim().replace(/^mailto:\s*/i, 'mailto:');
  if (!raw) return 'mailto:contact@setlou.com';
  // web-push refuse une adresse e-mail seule : il faut « mailto: » devant.
  if (!/^(mailto:|https?:)/i.test(raw)) return `mailto:${raw}`;
  return raw;
}

// La clé publique (envoyée au navigateur) doit être celle de la clé privée,
// sinon le service push refuse chaque envoi.
function keysArePair(publicKey: string, privateKey: string) {
  const ecdh = createECDH('prime256v1');
  ecdh.setPrivateKey(Buffer.from(privateKey, 'base64url'));
  return ecdh.getPublicKey().equals(Buffer.from(publicKey, 'base64url'));
}

function ensureVapid() {
  if (vapidProblem !== null) return vapidProblem === '';
  // Un espace ou un retour à la ligne copié avec la clé la rend invalide.
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!publicKey || !privateKey) {
    vapidProblem = 'Clés VAPID absentes sur le serveur (NEXT_PUBLIC_VAPID_PUBLIC_KEY ou VAPID_PRIVATE_KEY).';
  } else {
    try {
      webpush.setVapidDetails(vapidSubject(), publicKey, privateKey);
      vapidProblem = keysArePair(publicKey, privateKey)
        ? ''
        : 'NEXT_PUBLIC_VAPID_PUBLIC_KEY et VAPID_PRIVATE_KEY ne vont pas ensemble : remettez les deux clés d\'une même génération.';
    } catch (error) {
      console.error('Clés VAPID invalides :', error);
      vapidProblem = 'Clés VAPID invalides sur le serveur.';
    }
  }
  if (vapidProblem) console.error(`Push désactivé : ${vapidProblem}`);
  return vapidProblem === '';
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

type SendResult = { sent: number; problem: string | null };

function describeFailure(status: number | undefined) {
  if (status === 403 || status === 401) return `Le service push a refusé la signature (erreur ${status}) : les clés VAPID du serveur ne sont pas celles utilisées par le navigateur.`;
  if (status === 404 || status === 410) return `Le service push a refusé cet appareil (erreur ${status}). Si cela se répète, les clés VAPID du serveur ont sans doute changé depuis le dernier déploiement.`;
  return `Erreur du service push${status ? ` (${status})` : ''}.`;
}

async function sendToShop(shopId: string, payload: PushPayload, onlyUserId?: string): Promise<SendResult> {
  if (!ensureVapid()) return { sent: 0, problem: vapidProblem };
  const adminClient = await getAdminClient();
  let query = adminClient.from('push_subscriptions').select('id, endpoint, p256dh, auth').eq('shop_id', shopId);
  if (onlyUserId) query = query.eq('user_id', onlyUserId);
  const { data: subs, error } = await query;
  if (error) throw error;
  if (!subs?.length) return { sent: 0, problem: 'Aucun appareil enregistré.' };

  const body = JSON.stringify(payload);
  const expired: string[] = [];
  let sent = 0;
  let lastStatus: number | undefined;
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, { TTL: 60 * 60 * 24, urgency: 'high' });
      sent++;
    } catch (err) {
      const { statusCode, body: detail } = err as { statusCode?: number; body?: string };
      lastStatus = statusCode;
      console.error('web-push error:', statusCode, detail);
      // 404/410 : l'appareil s'est désabonné, on le retire.
      if (statusCode === 404 || statusCode === 410) expired.push(s.id);
    }
  }));

  if (expired.length) {
    await adminClient.from('push_subscriptions').delete().in('id', expired);
  }
  return { sent, problem: sent > 0 ? null : describeFailure(lastStatus) };
}

export async function notifyNewShopOrder(order: { id: string, shop_id: string, reference: string, total_xof: number, snapshot: { name?: string } | null }) {
  const name = order.snapshot?.name || 'Un client';
  const { sent, problem } = await sendToShop(order.shop_id, {
    title: `Nouvelle commande ${order.reference}`,
    body: `${name} · ${formatXOF(order.total_xof)}`,
    url: '/commandes',
    tag: `order-${order.id}`,
  });
  console.log(`Push commande ${order.reference} : ${sent} appareil(s).${problem ? ` ${problem}` : ''}`);
}

export async function sendTestPush(userId: string, shopId: string) {
  return sendToShop(shopId, {
    title: 'Notifications activées',
    body: 'Vous serez prévenu à chaque commande sur votre boutique.',
    url: '/commandes',
    tag: 'setlou-test',
  }, userId);
}
