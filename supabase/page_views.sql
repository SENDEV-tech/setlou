-- Table des visites pour la page /admin.
-- À lancer une fois dans l'éditeur SQL de Supabase.
-- Aucune IP ni cookie n'est stocké : visitor_hash est un hachage qui change chaque jour.

create table if not exists public.page_views (
  id bigint generated always as identity primary key,
  path text not null,
  referrer text,
  visitor_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists page_views_created_at_idx on public.page_views (created_at desc);

-- RLS activée sans aucune policy : seule la clé service (serveur) peut lire et écrire.
alter table public.page_views enable row level security;
