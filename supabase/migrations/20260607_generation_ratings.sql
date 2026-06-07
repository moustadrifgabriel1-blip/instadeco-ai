-- Migration: table generation_ratings
-- Permet de mesurer la qualité perçue des générations d'images (note 1-5 + feedback texte).
-- NE PAS appliquer automatiquement : à exécuter manuellement côté Supabase.

-- ============ TABLE ============
create table if not exists public.generation_ratings (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references public.generations(id) on delete cascade,
  user_id uuid not null,
  rating smallint not null check (rating between 1 and 5),
  feedback_text text,
  created_at timestamptz not null default now()
);

-- Idempotence : une seule note par (génération, utilisateur). Permet l'upsert.
create unique index if not exists generation_ratings_generation_user_uniq
  on public.generation_ratings (generation_id, user_id);

-- Index sur generation_id pour l'agrégation des notes par génération.
create index if not exists generation_ratings_generation_id_idx
  on public.generation_ratings (generation_id);

-- ============ RLS ============
alter table public.generation_ratings enable row level security;

-- Un utilisateur ne peut voir QUE ses propres notes.
drop policy if exists "generation_ratings_select_own" on public.generation_ratings;
create policy "generation_ratings_select_own"
  on public.generation_ratings
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Un utilisateur ne peut insérer QUE ses propres notes.
drop policy if exists "generation_ratings_insert_own" on public.generation_ratings;
create policy "generation_ratings_insert_own"
  on public.generation_ratings
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Un utilisateur ne peut mettre à jour QUE ses propres notes (re-notation).
drop policy if exists "generation_ratings_update_own" on public.generation_ratings;
create policy "generation_ratings_update_own"
  on public.generation_ratings
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- service_role : accès complet (l'API serveur passe par la Service Role Key).
drop policy if exists "generation_ratings_service_role_all" on public.generation_ratings;
create policy "generation_ratings_service_role_all"
  on public.generation_ratings
  for all
  to service_role
  using (true)
  with check (true);
