-- pSEO : pages programmatiques longue traîne (pièce x style x contrainte).
-- Stratégie Google-safe : contenu unique par page (LLM), publication au
-- compte-gouttes (drip-feed), lecture publique limitée aux pages publiées.
-- Idempotent.

create table if not exists public.pseo_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  locale text not null default 'fr',
  room text not null,                 -- ex: salon
  style text not null,                -- ex: industriel
  "constraint" text not null,         -- ex: petite surface
  h1_title text not null,
  meta_description text,
  unique_seo_text text not null,      -- paragraphe unique généré par LLM
  anti_ai_score integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pseo_pages_status on public.pseo_pages (status);
create index if not exists idx_pseo_pages_status_published_at on public.pseo_pages (status, published_at);
create unique index if not exists idx_pseo_pages_combo on public.pseo_pages (locale, room, style, "constraint");

-- RLS : lecture publique des seules pages publiées ; écriture réservée au
-- service_role (scripts/crons). anon/authenticated ne peuvent pas écrire.
alter table public.pseo_pages enable row level security;

drop policy if exists "pseo published are readable" on public.pseo_pages;
create policy "pseo published are readable"
  on public.pseo_pages for select
  using (status = 'published');
