-- Limite anti-abus pour les codes SMS (inscription / connexion par téléphone).
-- À lancer une fois dans l'éditeur SQL de Supabase.
-- Chaque demande de code est notée ici ; le serveur refuse au-delà de
-- 3 codes par numéro et 10 codes par adresse IP sur une heure.

create table if not exists public.sms_code_requests (
  id bigint generated always as identity primary key,
  phone text not null,
  ip text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists sms_code_requests_phone_idx on public.sms_code_requests (phone, created_at desc);
create index if not exists sms_code_requests_ip_idx on public.sms_code_requests (ip, created_at desc);

-- RLS activée sans aucune policy : seule la clé service (serveur) peut lire et écrire.
alter table public.sms_code_requests enable row level security;
