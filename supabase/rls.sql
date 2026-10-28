-- Sécurité : chaque boutique ne voit et ne modifie que ses propres données.
-- Remplace les policies de développement « Permettre tout » (ALL, true).
-- A exécuter une fois dans Supabase > SQL Editor (après notifications.sql).
--
-- Ce qui passe par la clé service_role (non soumise à la RLS) et continue de marcher :
-- page boutique publique et commandes clients, page /pay/[token], push, Stripe, inscription.

-- 1. Fonctions d'aide. security definer : lisent profiles sans repasser par sa
--    propre RLS (sinon récursion infinie).
create or replace function public.current_shop_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select shop_id from public.profiles where id = auth.uid() and coalesce(is_active, true);
$$;

create or replace function public.is_shop_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
     where id = auth.uid() and role = 'owner' and coalesce(is_active, true)
  );
$$;

revoke execute on function public.current_shop_id() from public, anon;
revoke execute on function public.is_shop_owner() from public, anon;
grant execute on function public.current_shop_id() to authenticated;
grant execute on function public.is_shop_owner() to authenticated;

-- 2. Suppression des policies ouvertes.
drop policy if exists "Permettre tout pour le développement" on public.shops;
drop policy if exists "Permettre tout pour le développement" on public.profiles;
drop policy if exists "Permettre tout pour le développement" on public.products;
drop policy if exists "Permettre tout pour le développement" on public.customers;
drop policy if exists "Permettre tout pour le développement" on public.orders;
drop policy if exists "Permettre tout pour le développement" on public.order_items;

alter table public.shops enable row level security;
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- 3. Boutiques : les membres lisent, seul le propriétaire modifie.
--    La création se fait à l'inscription avec la clé service_role.
drop policy if exists "shops_select_member" on public.shops;
create policy "shops_select_member" on public.shops
  for select to authenticated
  using (id = public.current_shop_id() or owner_id = auth.uid());

drop policy if exists "shops_update_owner" on public.shops;
create policy "shops_update_owner" on public.shops
  for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Les champs d'abonnement (plan, limites, Stripe) ne sont modifiables que par
-- le serveur (webhook Stripe), jamais depuis le navigateur.
revoke insert, update, delete, truncate on public.shops from anon, authenticated;
grant update (
  name, slug, whatsapp_number, logo_path, brand_color, welcome_message,
  thank_you_message, whatsapp_template, default_link_expiry_hours,
  cover_path, shop_tagline, shop_style
) on public.shops to authenticated;

-- 4. Profils : l'équipe de la boutique se voit, seul le propriétaire gère les assistants.
drop policy if exists "profiles_select_member" on public.profiles;
create policy "profiles_select_member" on public.profiles
  for select to authenticated
  using (id = auth.uid() or shop_id = public.current_shop_id());

drop policy if exists "profiles_insert_owner" on public.profiles;
create policy "profiles_insert_owner" on public.profiles
  for insert to authenticated
  with check (public.is_shop_owner() and shop_id = public.current_shop_id() and role = 'assistant');

drop policy if exists "profiles_update_owner" on public.profiles;
create policy "profiles_update_owner" on public.profiles
  for update to authenticated
  using (public.is_shop_owner() and shop_id = public.current_shop_id())
  with check (public.is_shop_owner() and shop_id = public.current_shop_id());

drop policy if exists "profiles_delete_owner" on public.profiles;
create policy "profiles_delete_owner" on public.profiles
  for delete to authenticated
  using (public.is_shop_owner() and shop_id = public.current_shop_id() and id <> auth.uid());

-- 5. Produits, clients, commandes : tous les membres de la boutique.
drop policy if exists "products_member" on public.products;
create policy "products_member" on public.products
  for all to authenticated
  using (shop_id = public.current_shop_id())
  with check (shop_id = public.current_shop_id());

drop policy if exists "customers_member" on public.customers;
create policy "customers_member" on public.customers
  for all to authenticated
  using (shop_id = public.current_shop_id())
  with check (shop_id = public.current_shop_id());

drop policy if exists "orders_member" on public.orders;
create policy "orders_member" on public.orders
  for all to authenticated
  using (shop_id = public.current_shop_id())
  with check (shop_id = public.current_shop_id());

drop policy if exists "order_items_member" on public.order_items;
create policy "order_items_member" on public.order_items
  for all to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.shop_id = public.current_shop_id()))
  with check (exists (select 1 from public.orders o where o.id = order_id and o.shop_id = public.current_shop_id()));

-- 6. Le rôle anonyme (clé publique) n'a plus aucun accès direct à ces tables.
revoke all on public.profiles, public.products, public.customers, public.orders, public.order_items from anon;
revoke select on public.shops from anon;
