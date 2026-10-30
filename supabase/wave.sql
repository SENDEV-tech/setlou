-- Abonnements Setlou payés avec Wave Checkout (en complément de Stripe).
-- Un paiement Wave = 30 jours d'accès, renouvelable à la main.
-- A exécuter une fois dans Supabase > SQL Editor.

-- 1. Fin de la période payée (essai ou Wave) et origine de l'abonnement :
--    'trial' (essai gratuit de 20 jours à l'inscription), 'wave' ou 'stripe'.
alter table public.shops
  add column if not exists subscription_provider text,
  add column if not exists paid_until timestamptz;

-- 2. Historique des paiements Wave. La clé primaire (id de session Wave)
--    garantit qu'un même paiement ne prolonge l'abonnement qu'une seule fois.
create table if not exists public.subscription_payments (
  id text primary key,
  shop_id uuid not null references public.shops(id) on delete cascade,
  plan text not null,
  amount_xof integer not null,
  provider text not null default 'wave',
  transaction_id text,
  paid_at timestamptz not null default now()
);

create index if not exists subscription_payments_shop_id_idx on public.subscription_payments (shop_id);

-- Le serveur écrit avec la clé service_role ; le propriétaire peut lire ses paiements.
alter table public.subscription_payments enable row level security;
revoke insert, update, delete, truncate on public.subscription_payments from anon, authenticated;

drop policy if exists "subscription_payments_select_member" on public.subscription_payments;
create policy "subscription_payments_select_member" on public.subscription_payments
  for select to authenticated using (shop_id = public.current_shop_id());

-- 3. Boutiques inscrites sans abonnement (le paiement par carte échouait) :
--    on leur ouvre l'essai gratuit de 20 jours à partir d'aujourd'hui.
update public.shops
   set subscription_status = 'trialing',
       subscription_provider = 'trial',
       paid_until = now() + interval '20 days'
 where subscription_status is null
   and stripe_subscription_id is null;
