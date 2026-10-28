import 'server-only';

import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { headers } from 'next/headers';
import { createAdminClient } from '@/utils/supabase/admin';

// Abonnements Setlou payés avec Wave Checkout, encaissés sur le compte Wave Business de Setlou.
// Doc : https://docs.wave.com/checkout et https://docs.wave.com/webhook

const WAVE_API = 'https://api.wave.com/v1';
const SIGNATURE_MAX_AGE_SECONDS = 5 * 60;
export const WAVE_PERIOD_DAYS = 30;

export const WAVE_PLANS = {
  starter: { priceXof: 4900, monthlyLimit: 100, maxAssistants: 1 },
  pro: { priceXof: 9900, monthlyLimit: null, maxAssistants: 5 },
  entreprise: { priceXof: 19900, monthlyLimit: null, maxAssistants: null },
} as const;

export type WavePlan = keyof typeof WAVE_PLANS;

export function isWavePlan(value: unknown): value is WavePlan {
  return typeof value === 'string' && value in WAVE_PLANS;
}

export type WaveCheckoutSession = {
  id: string;
  amount: string;
  currency: string;
  checkout_status: 'open' | 'complete' | 'expired' | 'failed';
  payment_status: 'processing' | 'cancelled' | 'succeeded' | 'failed';
  client_reference: string | null;
  transaction_id: string | null;
  wave_launch_url: string;
};

export type WaveEvent = {
  id: string;
  type: string;
  data: WaveCheckoutSession;
};

// URL publique du site : Wave exige des URL https pour le retour.
export async function getAppOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured?.startsWith('https://')) return configured.replace(/\/$/, '');
  const h = await headers();
  return `${h.get('x-forwarded-proto') || 'https'}://${h.get('x-forwarded-host') || h.get('host')}`;
}

async function waveFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey = process.env.WAVE_API_KEY;
  if (!apiKey) throw new Error('WAVE_API_KEY manquante.');
  const res = await fetch(`${WAVE_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Wave API ${res.status}: ${body.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

// client_reference = "<shopId>:<plan>:<nonce>" ; le nonce permet de retrouver
// la session au retour du client (Wave n'ajoute pas son id à l'URL de succès).
function parseReference(ref: string | null): { shopId: string; plan: WavePlan } | null {
  const [shopId, plan] = (ref ?? '').split(':');
  if (!shopId || !isWavePlan(plan)) return null;
  return { shopId, plan };
}

export async function createSubscriptionCheckout(shopId: string, plan: WavePlan): Promise<string> {
  const origin = await getAppOrigin();
  const reference = `${shopId}:${plan}:${randomBytes(8).toString('hex')}`;
  const session = await waveFetch<WaveCheckoutSession>('/checkout/sessions', {
    method: 'POST',
    body: JSON.stringify({
      amount: String(WAVE_PLANS[plan].priceXof),
      currency: 'XOF',
      client_reference: reference,
      success_url: `${origin}/api/wave/success?ref=${encodeURIComponent(reference)}`,
      error_url: `${origin}/abonnement?wave=erreur`,
    }),
  });
  return session.wave_launch_url;
}

export async function findCheckoutByReference(reference: string): Promise<WaveCheckoutSession | null> {
  const result = await waveFetch<{ result: WaveCheckoutSession[] }>(
    `/checkout/sessions/search?client_reference=${encodeURIComponent(reference)}`
  );
  return result.result.find((s) => s.payment_status === 'succeeded') ?? result.result[0] ?? null;
}

// En-tête « Wave-Signature: t=<timestamp>,v1=<hex>[,v1=<hex>] »,
// signature = HMAC-SHA256(secret, timestamp + corps brut).
export function verifyWaveWebhook(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.WAVE_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  const parts = signatureHeader.split(',').map((p) => p.trim().split('='));
  const timestamp = parts.find(([k]) => k === 't')?.[1];
  const signatures = parts.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!timestamp || signatures.length === 0) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > SIGNATURE_MAX_AGE_SECONDS) return false;

  const expected = createHmac('sha256', secret).update(timestamp + rawBody).digest();
  return signatures.some((sig) => {
    const given = Buffer.from(sig, 'hex');
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

// Active ou prolonge l'abonnement de 30 jours pour une session Wave réglée.
// Idempotent : un même paiement (id de session) ne compte qu'une fois.
export async function applySubscriptionPayment(session: WaveCheckoutSession): Promise<boolean> {
  if (session.payment_status !== 'succeeded') return false;
  const ref = parseReference(session.client_reference);
  if (!ref) return false;

  const plan = WAVE_PLANS[ref.plan];
  if (session.currency !== 'XOF' || Number(session.amount) !== plan.priceXof) {
    console.error('Wave abonnement : montant inattendu', session.id, session.amount, ref.plan);
    return false;
  }

  const adminClient = createAdminClient();
  const { data: inserted, error: insertError } = await adminClient
    .from('subscription_payments')
    .upsert(
      {
        id: session.id,
        shop_id: ref.shopId,
        plan: ref.plan,
        amount_xof: plan.priceXof,
        provider: 'wave',
        transaction_id: session.transaction_id,
      },
      { onConflict: 'id', ignoreDuplicates: true }
    )
    .select('id');
  if (insertError) {
    console.error('Wave abonnement : enregistrement du paiement', insertError);
    return false;
  }
  if (!inserted?.length) return true; // déjà pris en compte

  const { data: shop } = await adminClient.from('shops').select('paid_until').eq('id', ref.shopId).single();
  const start = Math.max(Date.now(), shop?.paid_until ? new Date(shop.paid_until).getTime() : 0);
  const paidUntil = new Date(start + WAVE_PERIOD_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await adminClient
    .from('shops')
    .update({
      subscription_status: 'active',
      subscription_plan: ref.plan,
      subscription_provider: 'wave',
      paid_until: paidUntil,
      monthly_orders_limit: plan.monthlyLimit,
      max_assistants: plan.maxAssistants,
    })
    .eq('id', ref.shopId);
  if (error) {
    console.error('Wave abonnement : mise à jour de la boutique', error);
    return false;
  }
  return true;
}

// Abonnement Wave arrivé à échéance : la boutique repasse en impayé.
export async function expireWaveSubscription(shopId: string) {
  await createAdminClient()
    .from('shops')
    .update({ subscription_status: 'past_due' })
    .eq('id', shopId)
    .eq('subscription_provider', 'wave');
}
