-- Suivi des publications sociales auto (anti-doublon).
-- Une génération ne doit être postée qu'une fois par plateforme.
-- Table service-role only (le cron y accède via la clé service ; RLS deny par défaut).

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references public.generations(id) on delete cascade,
  platform text not null check (platform in ('instagram', 'facebook', 'pinterest', 'tiktok')),
  external_id text,
  status text not null default 'posted' check (status in ('posted', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  unique (generation_id, platform)
);

create index if not exists idx_social_posts_generation on public.social_posts(generation_id);

-- RLS activé sans policy = accès service-role uniquement (deny par défaut côté anon/auth).
alter table public.social_posts enable row level security;
