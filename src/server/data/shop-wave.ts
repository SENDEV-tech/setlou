import 'server-only';

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { createAdminClient } from '@/utils/supabase/admin';
import {
  getAppOrigin,
  verifyWaveSignature,
  waveRequest,
  WaveApiError,
  type WaveCheckoutSession,
  type WaveEvent,
} from '@/server/data/wave';
import { notifyOrderPaid } from '@/server/data/push';

// Paiement des commandes avec le compte Wave Business du vendeur.
// L'argent va directement sur le compte du vendeur : Setlou ne fait que créer la session
// de paiement avec la clé du vendeur et marquer la commande payée quand Wave confirme.
// Tables : supabase/wave_vendeurs.sql.

// --- Chiffrement des clés (AES-256-GCM) ---

function encryptionKey(): Buffer {
  const secret = process.env.PAYMENT_KEYS_SECRET;
  if (!secret || secret.length < 16) throw new Error('PAYMENT_KEYS_SECRET manquante.');
  return createHash('sha256').update(secret).digest();
}

export function isShopWaveAvailable(): boolean {
  const secret = process.env.PAYMENT_KEYS_SECRET;
  return !!secret && secret.length >= 16;
}

function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), data.toString('base64url')].join(':');
}

function decrypt(value: string): string {
  const [version, iv, tag, data] = value.split(':');
  if (version !== 'v1' || !iv || !tag || !data) throw new Error('Clé chiffrée illisible.');
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
}

// --- Compte Wave de la boutique ---

type ShopWaveRow = {
  shop_id: string;
  api_key_encrypted: string;
  api_key_last4: string;
  webhook_secret_encrypted: string | null;
  webhook_token: string;
  updated_at: string;
};

export type ShopWaveStatus = {
  available: boolean;
  connected: boolean;
  apiKeyLast4: string | null;
  hasWebhookSecret: boolean;
  webhookUrl: string | null;
};

async function getShopWaveRow(shopId: string): Promise<ShopWaveRow | null> {
  const { data, error } = await createAdminClient()
    .from('shop_wave_accounts')
    .select('shop_id, api_key_encrypted, api_key_last4, webhook_secret_encrypted, webhook_token, updated_at')
    .eq('shop_id', shopId)
    .maybeSingle();
  if (error) throw error;
  return (data as ShopWaveRow | null) ?? null;
}

async function webhookUrlFor(token: string): Promise<string> {
  return `${await getAppOrigin()}/api/wave/boutique/${token}`;
}

// Ne jette pas : si la table n'existe pas encore (wave_vendeurs.sql pas exécuté), Wave est juste indisponible.
export async function getShopWaveStatus(shopId: string): Promise<ShopWaveStatus> {
  let available = isShopWaveAvailable();
  let row: ShopWaveRow | null = null;
  if (available) {
    try {
      row = await getShopWaveRow(shopId);
    } catch (error) {
      console.error('Wave vendeur : lecture du compte', error);
      available = false;
    }
  }
  return {
    available,
    connected: !!row,
    apiKeyLast4: row?.api_key_last4 ?? null,
    hasWebhookSecret: !!row?.webhook_secret_encrypted,
    webhookUrl: row ? await webhookUrlFor(row.webhook_token) : null,
  };
}

export async function isShopWaveConnected(shopId: string): Promise<boolean> {
  if (!isShopWaveAvailable()) return false;
  try {
    return !!(await getShopWaveRow(shopId));
  } catch (error) {
    console.error('Wave vendeur : lecture du compte', error);
    return false;
  }
}

// Vérifie la clé auprès de Wave avant de l'enregistrer (recherche d'une référence inexistante).
async function checkApiKey(apiKey: string): Promise<string | null> {
  try {
    await waveRequest(apiKey, '/checkout/sessions/search?client_reference=setlou-verification');
    return null;
  } catch (error) {
    if (error instanceof WaveApiError && (error.status === 401 || error.status === 403)) {
      return "Wave refuse cette clé. Vérifiez qu'elle est copiée en entier et qu'elle a accès à l'API Checkout.";
    }
    console.error('Wave vendeur : vérification de la clé', error);
    return 'Impossible de joindre Wave pour vérifier la clé. Réessayez dans un instant.';
  }
}

// Enregistre ou met à jour la clé API (obligatoire au premier enregistrement)
// et le secret du webhook. Champs vides = valeur actuelle conservée.
export async function saveShopWaveAccount(
  shopId: string,
  input: { apiKey?: string; webhookSecret?: string }
): Promise<{ ok: true; status: ShopWaveStatus } | { ok: false; field?: 'apiKey' | 'webhookSecret'; error: string }> {
  const existing = await getShopWaveRow(shopId);
  if (!existing && !input.apiKey) {
    return { ok: false, field: 'apiKey', error: 'Collez la clé API de votre compte Wave Business.' };
  }

  const update: Partial<ShopWaveRow> & { updated_at: string } = { updated_at: new Date().toISOString() };
  if (input.apiKey) {
    const problem = await checkApiKey(input.apiKey);
    if (problem) return { ok: false, field: 'apiKey', error: problem };
    update.api_key_encrypted = encrypt(input.apiKey);
    update.api_key_last4 = input.apiKey.slice(-4);
  }
  if (input.webhookSecret) {
    update.webhook_secret_encrypted = encrypt(input.webhookSecret);
  }

  const adminClient = createAdminClient();
  const { error } = existing
    ? await adminClient.from('shop_wave_accounts').update(update).eq('shop_id', shopId)
    : await adminClient.from('shop_wave_accounts').insert({
        ...update,
        shop_id: shopId,
        webhook_token: randomBytes(24).toString('base64url'),
      });
  if (error) throw error;

  return { ok: true, status: await getShopWaveStatus(shopId) };
}

export async function deleteShopWaveAccount(shopId: string): Promise<void> {
  const { error } = await createAdminClient().from('shop_wave_accounts').delete().eq('shop_id', shopId);
  if (error) throw error;
}

// --- Paiement d'une commande ---

type PayableOrder = { id: string; shop_id: string; status: string; total_xof: number; reference: string; token_hash: string };

async function getOrderForPayment(token: string): Promise<PayableOrder | null> {
  const { data, error } = await createAdminClient()
    .from('orders')
    .select('id, shop_id, status, total_xof, reference, token_hash')
    .eq('token_hash', token)
    .maybeSingle();
  if (error) throw error;
  return (data as PayableOrder | null) ?? null;
}

// client_reference = "order:<orderId>:<nonce>"
function orderIdFromReference(ref: string | null): string | null {
  const [kind, orderId] = (ref ?? '').split(':');
  return kind === 'order' && orderId ? orderId : null;
}

// Crée la session Wave avec la clé du vendeur et renvoie l'URL où envoyer le client.
export async function createOrderCheckout(token: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const order = await getOrderForPayment(token);
  if (!order) return { ok: false, error: 'Commande introuvable.' };
  if (order.status === 'paid') return { ok: false, error: 'Cette commande est déjà payée.' };
  if (order.status !== 'pending' && order.status !== 'verifying') {
    return { ok: false, error: "Cette commande n'est plus payable." };
  }

  const account = isShopWaveAvailable() ? await getShopWaveRow(order.shop_id) : null;
  if (!account) return { ok: false, error: "Cette boutique n'accepte pas encore le paiement Wave en ligne." };

  const origin = await getAppOrigin();
  const reference = `order:${order.id}:${randomBytes(8).toString('hex')}`;
  const payUrl = `${origin}/pay/${encodeURIComponent(order.token_hash)}`;
  try {
    const session = await waveRequest<WaveCheckoutSession>(decrypt(account.api_key_encrypted), '/checkout/sessions', {
      method: 'POST',
      body: JSON.stringify({
        amount: String(order.total_xof),
        currency: 'XOF',
        client_reference: reference,
        success_url: `${payUrl}/wave?ref=${encodeURIComponent(reference)}`,
        error_url: `${payUrl}?wave=erreur`,
      }),
    });
    return { ok: true, url: session.wave_launch_url };
  } catch (error) {
    console.error('Wave vendeur : création de la session', order.id, error);
    return { ok: false, error: 'Wave est indisponible pour le moment. Réessayez ou payez par transfert.' };
  }
}

// Valide la commande pour une session Wave réglée. Idempotent : un paiement ne compte qu'une fois.
async function applyOrderPayment(shopId: string, session: WaveCheckoutSession): Promise<boolean> {
  if (session.payment_status !== 'succeeded') return false;
  const orderId = orderIdFromReference(session.client_reference);
  if (!orderId) return false;

  const adminClient = createAdminClient();
  const { data: order, error: orderError } = await adminClient
    .from('orders')
    .select('id, shop_id, status, total_xof, reference, snapshot')
    .eq('id', orderId)
    .eq('shop_id', shopId)
    .maybeSingle();
  if (orderError || !order) {
    console.error('Wave vendeur : commande introuvable', orderId, orderError);
    return false;
  }
  if (session.currency !== 'XOF' || Number(session.amount) !== order.total_xof) {
    console.error('Wave vendeur : montant inattendu', session.id, session.amount, order.total_xof);
    return false;
  }

  const { data: inserted, error: insertError } = await adminClient
    .from('order_payments')
    .upsert(
      {
        id: session.id,
        order_id: order.id,
        shop_id: shopId,
        amount_xof: order.total_xof,
        provider: 'wave',
        transaction_id: session.transaction_id,
      },
      { onConflict: 'id', ignoreDuplicates: true }
    )
    .select('id');
  if (insertError) {
    console.error('Wave vendeur : enregistrement du paiement', insertError);
    return false;
  }
  if (!inserted?.length) return true; // déjà pris en compte

  const { data: updated, error } = await adminClient
    .from('orders')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', order.id)
    .in('status', ['pending', 'verifying'])
    .select('id');
  if (error) {
    console.error('Wave vendeur : mise à jour de la commande', error);
    return false;
  }
  if (!updated?.length && order.status !== 'paid') {
    // Paiement reçu sur une commande annulée ou expirée : on le garde dans order_payments.
    console.error('Wave vendeur : paiement reçu sur une commande', order.status, order.id);
  }

  try {
    await notifyOrderPaid({
      id: order.id,
      shop_id: shopId,
      reference: order.reference,
      total_xof: order.total_xof,
      snapshot: order.snapshot as { name?: string } | null,
      status: order.status,
    });
  } catch (pushError) {
    console.error('Wave vendeur : notification', pushError);
  }
  return true;
}

// Retour du client depuis Wave : on vérifie la session sans attendre le webhook.
export async function confirmOrderCheckout(token: string, reference: string): Promise<boolean> {
  const order = await getOrderForPayment(token);
  if (!order || orderIdFromReference(reference) !== order.id) return false;
  if (order.status === 'paid') return true;

  const account = isShopWaveAvailable() ? await getShopWaveRow(order.shop_id) : null;
  if (!account) return false;

  const result = await waveRequest<{ result: WaveCheckoutSession[] }>(
    decrypt(account.api_key_encrypted),
    `/checkout/sessions/search?client_reference=${encodeURIComponent(reference)}`
  );
  const session = result.result.find((s) => s.payment_status === 'succeeded');
  return session ? applyOrderPayment(order.shop_id, session) : false;
}

// Webhook déclaré par le vendeur dans son portail Wave Business.
export async function handleShopWebhook(
  webhookToken: string,
  rawBody: string,
  signatureHeader: string | null
): Promise<'ok' | 'unknown' | 'invalid'> {
  if (!isShopWaveAvailable()) return 'unknown';
  const { data, error } = await createAdminClient()
    .from('shop_wave_accounts')
    .select('shop_id, webhook_secret_encrypted')
    .eq('webhook_token', webhookToken)
    .maybeSingle();
  if (error || !data) return 'unknown';
  if (!data.webhook_secret_encrypted) return 'invalid';
  if (!verifyWaveSignature(rawBody, signatureHeader, decrypt(data.webhook_secret_encrypted))) return 'invalid';

  let event: WaveEvent;
  try {
    event = JSON.parse(rawBody) as WaveEvent;
  } catch {
    return 'invalid';
  }
  if (event.type === 'checkout.session.completed') {
    await applyOrderPayment(data.shop_id, event.data);
  }
  return 'ok';
}
