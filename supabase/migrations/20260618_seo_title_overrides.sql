-- Boucle d'auto-optimisation CTR : overrides de title/description par chemin de page.
-- Rempli par le job VPS `ctr_optimizer` (via l'endpoint /api/cron/ctr-optimize) pour les
-- pages en page 1 de Google mais a 0 clic. Lu par generateMetadata des pages concernees.
-- Titles template-deterministes bases sur la requete GSC reelle (honnetes, Google-safe).

create table if not exists public.seo_title_overrides (
  path text primary key,
  title text not null,
  meta_description text,
  source_query text,
  clicks integer not null default 0,
  impressions integer not null default 0,
  position numeric,
  updated_at timestamptz not null default now()
);

comment on table public.seo_title_overrides is
  'Overrides SEO title/description par chemin, generes par la boucle CTR (job VPS ctr_optimizer). Application sur pages page1/0clic uniquement.';

alter table public.seo_title_overrides enable row level security;

-- Lecture publique : ce sont des metadonnees publiques, lues cote serveur par generateMetadata.
drop policy if exists "Public read seo_title_overrides" on public.seo_title_overrides;
create policy "Public read seo_title_overrides"
  on public.seo_title_overrides for select using (true);

-- Aucune policy insert/update/delete : ecriture reservee au service_role (qui bypass RLS),
-- via l'endpoint /api/cron/ctr-optimize protege par Bearer CRON_SECRET. Deny par defaut pour le reste.
