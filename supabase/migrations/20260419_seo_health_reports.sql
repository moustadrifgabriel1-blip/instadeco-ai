-- ============================================================
-- Migration : historique des rapports SEO Health Check
-- Créée le : 2026-04-19
-- ============================================================
-- Table optionnelle : le cron seo-health-check fonctionne même
-- si cette table n'existe pas (insertion en best-effort).
-- ============================================================

create table if not exists public.seo_health_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  score integer not null check (score >= 0 and score <= 100),
  verdict text not null check (verdict in ('excellent', 'good', 'warning', 'critical')),
  passed integer not null default 0,
  warnings integer not null default 0,
  failures integer not null default 0,
  report jsonb not null
);

create index if not exists idx_seo_health_reports_created_at
  on public.seo_health_reports (created_at desc);

create index if not exists idx_seo_health_reports_score
  on public.seo_health_reports (score);

-- RLS : seul le service_role peut lire/écrire (utilisé par le cron)
alter table public.seo_health_reports enable row level security;

drop policy if exists "seo_health_reports_service_role_all" on public.seo_health_reports;
create policy "seo_health_reports_service_role_all"
  on public.seo_health_reports
  for all
  to service_role
  using (true)
  with check (true);

-- Lecture admin optionnelle : décommenter si tu veux exposer à un admin authentifié
-- drop policy if exists "seo_health_reports_admin_read" on public.seo_health_reports;
-- create policy "seo_health_reports_admin_read"
--   on public.seo_health_reports
--   for select
--   to authenticated
--   using (
--     exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
--   );

comment on table public.seo_health_reports is 'Historique des rapports de santé SEO bi-mensuels (cron /api/cron/seo-health-check).';
comment on column public.seo_health_reports.score is 'Score global /100 (100 = parfait).';
comment on column public.seo_health_reports.verdict is 'excellent (≥90) | good (≥75) | warning (≥55) | critical (<55).';
comment on column public.seo_health_reports.report is 'Rapport JSON complet incluant tous les checks et leurs détails.';
