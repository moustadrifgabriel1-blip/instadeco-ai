-- Heartbeat du moteur SEO (seo-engine sur le VPS Hetzner).
--
-- Pourquoi : cause de mort n°2 du pre-mortem = « un moteur automatise meurt en
-- silence ». Les rapports du moteur sont gitignores (repo public) et restent sur
-- le VPS, donc rien ne permet de savoir depuis le repo ou un dashboard si les
-- crons tournent encore. Cette table rend le heartbeat VISIBLE et interrogeable :
-- chaque job (gsc_daily, drift_check, rank_tracker, ctr_optimizer) upsert sa
-- derniere execution via /api/cron/seo-heartbeat. Un job dont ran_at date de
-- plus de N jours est repute mort.
--
-- Une ligne par job (upsert sur la PK). Pas d'historique : on ne garde que la
-- derniere execution, c'est un heartbeat, pas un journal.

create table if not exists public.seo_engine_heartbeats (
  job        text primary key,
  status     text not null check (status in ('ok', 'error')),
  ran_at     timestamptz not null default now(),
  detail     jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.seo_engine_heartbeats is
  'Heartbeat du moteur SEO VPS : derniere execution par job. Ecrit par /api/cron/seo-heartbeat (Bearer CRON_SECRET). Table service-role only (RLS sans policy = deny par defaut).';

-- Table service-role uniquement : ecrite par la route cron (service role, bypass
-- RLS) et lue par les crons/agents. RLS active SANS policy => anon/authenticated
-- sont refuses par defaut (posture sure, coherente avec rate_limits/trial_usage).
alter table public.seo_engine_heartbeats enable row level security;
