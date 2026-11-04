-- Paiement Wave direct chez chaque vendeur.
-- Chaque boutique connecte son propre compte Wave Business (clé API + secret du webhook) :
-- le client paie la commande avec Wave, l'argent arrive sur le compte du vendeur
-- et Setlou passe la commande en « payée » tout seul.
-- A exécuter une fois dans Supabase > SQL Editor.

-- 1. Compte Wave Business de la boutique. Les clés sont chiffrées par le serveur
--    (variable PAYMENT_KEYS_SECRET) : la base ne contient jamais la clé en clair.
--    webhook_token sert d'adresse du webhook de la boutique (/api/wave/boutique/<token>).
create table if not exists public.shop_wave_accounts (
  shop_id uuid primary key references public.shops(id) on delete cascade,
  api_key_encrypted text not null,
  api_key_last4 text not null,
  webhook_secret_encrypted text,
  webhook_token text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seul le serveur (clé service_role) lit et écrit ces clés.
alter table public.shop_wave_accounts enable row level security;
revoke all on public.shop_wave_accounts from anon, authenticated;

-- 2. Paiements Wave des commandes. La clé primaire (id de session Wave)
--    garantit qu'un même paiement ne valide la commande qu'une seule fois.
create table if not exists public.order_payments (
  id text primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  amount_xof integer not null,
  provider text not null default 'wave',
  transaction_id text,
  paid_at timestamptz not null default now()
);

create index if not exists order_payments_order_id_idx on public.order_payments (order_id);
create index if not exists order_payments_shop_id_idx on public.order_payments (shop_id);

alter table public.order_payments enable row level security;
revoke insert, update, delete, truncate on public.order_payments from anon, authenticated;

drop policy if exists "order_payments_select_member" on public.order_payments;
create policy "order_payments_select_member" on public.order_payments
  for select to authenticated using (shop_id = public.current_shop_id());
