-- Lien boutique : commandes passées directement par les clients.
-- A exécuter une fois dans Supabase > SQL Editor (après stock.sql).

-- Version des fonctions de stock pour le serveur (clé service_role), sans
-- utilisateur connecté : la boutique est passée explicitement.
create or replace function public.reserve_shop_stock(p_shop_id uuid, p_product_id uuid, p_quantity integer)
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
     and shop_id = p_shop_id
     and archived_at is null
     and (stock_quantity is null or stock_quantity >= p_quantity)
  returning true into v_found;

  return coalesce(v_found, false);
end;
$$;

create or replace function public.release_shop_stock(p_shop_id uuid, p_product_id uuid, p_quantity integer)
returns void
language sql
security definer
set search_path = public
as $$
  update public.products
     set stock_quantity = stock_quantity + p_quantity
   where id = p_product_id
     and shop_id = p_shop_id
     and stock_quantity is not null
     and p_quantity > 0;
$$;

revoke execute on function public.reserve_shop_stock(uuid, uuid, integer) from public, anon, authenticated;
revoke execute on function public.release_shop_stock(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.reserve_shop_stock(uuid, uuid, integer) to service_role;
grant execute on function public.release_shop_stock(uuid, uuid, integer) to service_role;
