import 'server-only';

import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { headers } from 'next/headers';
import { createAdminClient } from '@/utils/supabase/admin';

// Wave Checkout : chaque boutique encaisse sur son propre compte Wave Business.
// Doc : https://docs.wave.com/checkout et https://docs.wave.com/webhook

const WAVE_API = 'https://api.wave.com/v1';
const SIGNATURE_MAX_AGE_SECONDS = 5 * 60;

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

type WaveSettingsRow = {
  shop_id: string;
  api_key_enc: string;
  webhook_secret_enc: string;
  api_key_last4: string;
  enabled: boolean;
};

// URL publique du site : Wave exige des URL https pour le retour et le webhook.
export async function getAppOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured?.startsWith('https://')) return configured.replace(/\/$/, '');
  const h = await headers();
  return `${h.get('x-forwarded-proto') || 'https'}://${h.get('x-forwarded-host') || h.get('host')}`;
}

// --- Chiffrement des clés (AES-256-GCM) ---

function secretsKey(): Buffer {
  const raw = process.env.WAVE_SECRETS_KEY;
  if (!raw) throw new Error('WAVE_SECRETS_KEY manquante.');
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) throw new Error('WAVE_SECRETS_KEY doit faire 32 octets en base64.');
  return key;
}

function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', secretsKey(), iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString('base64')).join('.');
}

function decrypt(payload: string): string {
  const [iv, tag, data] = payload.split('.').map((p) => Buffer.from(p, 'base64'));
  const decipher = createDecipheriv('aes-256-gcm', secretsKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

// --- Réglages Wave d'une boutique ---

async function getSettingsRow(shopId: string): Promise<WaveSettingsRow | null> {
  const { data, error } = await createAdminClient()
    .from('shop_wave_settings')
    .select('shop_id, api_key_enc, webhook_secret_enc, api_key_last4, enabled')
    .eq('shop_id', shopId)
    .maybeSingle();
  if (error) {
    console.error('getWaveSettings error:', error);
    return null;
  }
  return data as WaveSettingsRow | null;
}

// Ce que l'interface peut afficher : jamais les clés elles-mêmes.
export async function getWaveStatus(shopId: string): Promise<{ connected: boolean; apiKeyLast4: string | null }> {
  const row = await getSettingsRow(shopId);
  return { connected: !!row?.enabled, apiKeyLast4: row?.api_key_last4 ?? null };
}

export async function isWaveEnabled(shopId: string): Promise<boolean> {
  return (await getWaveStatus(shopId)).connected;
}

export async function saveWaveSettings(shopId: string, apiKey: string, webhookSecret: string) {
  const { error } = await createAdminClient()
    .from('shop_wave_settings')
    .upsert({
      shop_id: shopId,
      api_key_enc: encrypt(apiKey),
      webhook_secret_enc: encrypt(webhookSecret),
      api_key_last4: apiKey.slice(-4),
      enabled: true,
      updated_at: new Date().toISOString(),
    });
  if (error) throw error;
}

export async function deleteWaveSettings(shopId: string) {
  const { error } = await createAdminClient().from('shop_wave_settings').delete().eq('shop_id', shopId);
  if (error) throw error;
}

// --- API Wave ---

async function waveFetch<T>(apiKey: string, path: string, init?: RequestInit): Promise<T> {
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
    throw new WaveApiError(res.status, body);
  }
  return (await res.json()) as T;
}

export class WaveApiError extends Error {
  constructor(public status: number, body: string) {
    super(`Wave API ${status}: ${body.slice(0, 300)}`);
  }
}

// Vérifie qu'une clé est acceptée par Wave avant de l'enregistrer.
export async function checkWaveApiKey(apiKey: string): Promise<boolean> {
  try {
    await waveFetch(apiKey, '/checkout/sessions/search?client_reference=setlou-test');
    return true;
  } catch (error) {
    if (error instanceof WaveApiError && (error.status === 401 || error.status === 403)) return false;
    // Autre erreur (réseau, 404...) : on ne bloque pas l'enregistrement.
    console.error('checkWaveApiKey:', error);
    return true;
  }
}

export async function createWaveCheckout(
  shopId: string,
  params: { amountXof: number; orderId: string; successUrl: string; errorUrl: string }
): Promise<WaveCheckoutSession> {
  const row = await getSettingsRow(shopId);
  if (!row?.enabled) throw new Error('Wave non connecté pour cette boutique.');
  return waveFetch<WaveCheckoutSession>(decrypt(row.api_key_enc), '/checkout/sessions', {
    method: 'POST',
    body: JSON.stringify({
      amount: String(Math.round(params.amountXof)),
      currency: 'XOF',
      client_reference: params.orderId,
      success_url: params.successUrl,
      error_url: params.errorUrl,
    }),
  });
}

export async function getWaveCheckout(shopId: string, checkoutId: string): Promise<WaveCheckoutSession | null> {
  const row = await getSettingsRow(shopId);
  if (!row?.enabled) return null;
  return waveFetch<WaveCheckoutSession>(decrypt(row.api_key_enc), `/checkout/sessions/${encodeURIComponent(checkoutId)}`);
}

// --- Webhook ---

// En-tête « Wave-Signature: t=<timestamp>,v1=<hex>[,v1=<hex>] »,
// signature = HMAC-SHA256(secret, timestamp + corps brut).
export async function verifyWaveWebhook(shopId: string, rawBody: string, signatureHeader: string | null): Promise<boolean> {
  if (!signatureHeader) return false;
  const row = await getSettingsRow(shopId);
  if (!row) return false;

  const parts = signatureHeader.split(',').map((p) => p.trim().split('='));
  const timestamp = parts.find(([k]) => k === 't')?.[1];
  const signatures = parts.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!timestamp || signatures.length === 0) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > SIGNATURE_MAX_AGE_SECONDS) return false;

  const expected = createHmac('sha256', decrypt(row.webhook_secret_enc))
    .update(timestamp + rawBody)
    .digest();
  return signatures.some((sig) => {
    const given = Buffer.from(sig, 'hex');
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

// Marque la commande payée si la session Wave est réglée pour le bon montant.
// Idempotent : ne touche qu'une commande encore en attente.
export async function applyWaveCheckout(shopId: string, session: WaveCheckoutSession): Promise<boolean> {
  if (session.payment_status !== 'succeeded' || !session.client_reference) return false;

  const adminClient = createAdminClient();
  const { data: order, error } = await adminClient
    .from('orders')
    .select('id, total_xof, status')
    .eq('id', session.client_reference)
    .eq('shop_id', shopId)
    .maybeSingle();
  if (error || !order) {
    console.error('applyWaveCheckout: commande introuvable', session.client_reference, error);
    return false;
  }

  if (session.currency !== 'XOF' || Number(session.amount) !== order.total_xof) {
    console.error('applyWaveCheckout: montant différent', session.id, session.amount, order.total_xof);
    return false;
  }

  const { error: updateError } = await adminClient
    .from('orders')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      paid_via: 'wave',
      provider: 'wave',
      wave_checkout_id: session.id,
      wave_transaction_id: session.transaction_id,
    })
    .eq('id', order.id)
    .in('status', ['pending', 'verifying', 'expired']);
  if (updateError) {
    console.error('applyWaveCheckout update error:', updateError);
    return false;
  }
  return true;
}
