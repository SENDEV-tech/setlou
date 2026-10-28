-- Personnalisation de la page boutique : photo de couverture, slogan et style.
-- A exécuter une fois dans Supabase > SQL Editor.

alter table public.shops
  add column if not exists cover_path text,
  add column if not exists shop_tagline text check (shop_tagline is null or char_length(shop_tagline) <= 120),
  add column if not exists shop_style text not null default 'moderne' check (shop_style in ('moderne', 'elegant', 'colore'));
