-- Gestion du stock des produits.
-- A exécuter une fois dans Supabase > SQL Editor.

-- NULL = stock non suivi (anciens produits). 0 = épuisé.
alter table public.products
  add column if not exists stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  add column if not exists low_stock_threshold integer not null default 3 check (low_stock_threshold >= 0);

-- Retire p_quantity du stock de façon atomique.
-- Renvoie false si le stock est insuffisant (rien n'est modifié).
-- security definer : fonctionne aussi pour les assistants, mais seulement
-- sur les produits de la boutique de l'utilisateur connecté.
create or replace function public.decrement_product_stock(p_product_id uuid, p_quantity integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_found boolean;
begin
  if p_quantity <= 0 then
    return false;
  end if;

  update public.products
     set stock_quantity = stock_quantity - p_quantity
   where id = p_product_id
     and shop_id = (select shop_id from public.profiles where id = auth.uid())
     and (stock_quantity is null or stock_quantity >= p_quantity)
  returning true into v_found;

  return coalesce(v_found, false);
end;
$$;

-- Remet p_quantity en stock (commande annulée). Sans effet si le stock n'est pas suivi.
create or replace function public.increment_product_stock(p_product_id uuid, p_quantity integer)
returns void
language sql
security definer
set search_path = public
as $$
  update public.products
     set stock_quantity = stock_quantity + p_quantity
   where id = p_product_id
     and shop_id = (select shop_id from public.profiles where id = auth.uid())
     and stock_quantity is not null
     and p_quantity > 0;
$$;

revoke execute on function public.decrement_product_stock(uuid, integer) from public, anon;
revoke execute on function public.increment_product_stock(uuid, integer) from public, anon;
grant execute on function public.decrement_product_stock(uuid, integer) to authenticated;
grant execute on function public.increment_product_stock(uuid, integer) to authenticated;
