-- Paiements Wave Checkout : chaque boutique encaisse sur son propre compte Wave Business.
-- A exécuter une fois dans Supabase > SQL Editor (après rls.sql).

-- 1. Clés Wave de chaque boutique, chiffrées par le serveur (AES-256-GCM, WAVE_SECRETS_KEY).
--    RLS activée sans aucune policy : seule la clé service_role (serveur) y a accès.
create table if not exists public.shop_wave_settings (
  shop_id uuid primary key references public.shops(id) on delete cascade,
  api_key_enc text not null,
  webhook_secret_enc text not null,
  api_key_last4 text not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.shop_wave_settings enable row level security;
revoke all on public.shop_wave_settings from anon, authenticated;

-- 2. Suivi du paiement Wave sur la commande (paid_via = 'wave' quand Wave confirme).
alter table public.orders
  add column if not exists wave_checkout_id text,
  add column if not exists wave_transaction_id text;

create index if not exists orders_wave_checkout_id_idx on public.orders (wave_checkout_id);
