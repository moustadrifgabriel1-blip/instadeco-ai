-- Stockage des tokens OAuth qui EXPIRENT (Pinterest : access 30 j, refresh 60 j continu).
-- Source de verite mutable (le fichier d'env ne tient pas la rotation auto du token).
-- Service-role UNIQUEMENT : RLS active sans policy = deny par defaut pour anon/auth.
-- Les tokens ne doivent JAMAIS etre lisibles publiquement ni exposes par une route.

create table if not exists public.oauth_tokens (
  provider text primary key check (provider in ('pinterest')),
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,             -- expiration de l'access_token
  refresh_token_expires_at timestamptz,        -- 60 j, informatif
  scope text,
  updated_at timestamptz not null default now()
);

alter table public.oauth_tokens enable row level security;
