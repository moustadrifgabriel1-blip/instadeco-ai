-- Perf RLS : évite la ré-évaluation par ligne de auth.uid() / auth.role()
--
-- Constat (advisor Supabase `auth_rls_initplan`, 16 policies) : un appel nu à
-- auth.uid() dans une policy est ré-évalué POUR CHAQUE LIGNE scannée. Enveloppé
-- dans un sous-select, Postgres le traite comme un InitPlan calculé une seule
-- fois par requête. Sémantique strictement identique, seul le plan change.
--
-- ALTER POLICY est atomique : à aucun instant la table ne se retrouve sans
-- policy, contrairement à un DROP + CREATE. Aucune règle d'accès n'est élargie
-- ni restreinte ici.
--
-- Idempotent : ré-appliquer la migration réécrit la même expression.

-- profiles
ALTER POLICY "Users can read own profile" ON public.profiles
  USING ((select auth.uid()) = id);

ALTER POLICY "Users can insert own profile" ON public.profiles
  WITH CHECK ((select auth.uid()) = id);

ALTER POLICY "Users can update own profile" ON public.profiles
  USING ((select auth.uid()) = id)
  WITH CHECK (
    ((select auth.uid()) = id)
    AND (credits = get_own_credits())
    AND (role = get_own_role())
  );

-- projects
ALTER POLICY "Users can read own projects" ON public.projects
  USING ((select auth.uid()) = user_id);

ALTER POLICY "Users can create own projects" ON public.projects
  WITH CHECK ((select auth.uid()) = user_id);

ALTER POLICY "Users can update own projects" ON public.projects
  USING ((select auth.uid()) = user_id);

ALTER POLICY "Users can delete own projects" ON public.projects
  USING ((select auth.uid()) = user_id);

-- generations
ALTER POLICY "Users can read own generations" ON public.generations
  USING ((select auth.uid()) = user_id);

-- credit_transactions
ALTER POLICY "Users can read own transactions" ON public.credit_transactions
  USING ((select auth.uid()) = user_id);

-- referrals
ALTER POLICY "Users can view own referrals" ON public.referrals
  USING (
    ((select auth.uid()) = referrer_id)
    OR ((select auth.uid()) = referred_id)
  );

-- generation_ratings
ALTER POLICY "generation_ratings_select_own" ON public.generation_ratings
  USING ((select auth.uid()) = user_id);

ALTER POLICY "generation_ratings_insert_own" ON public.generation_ratings
  WITH CHECK ((select auth.uid()) = user_id);

ALTER POLICY "generation_ratings_update_own" ON public.generation_ratings
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Tables service-role-only : auth.role() subit la même ré-évaluation par ligne.
ALTER POLICY "Service role manages leads" ON public.leads
  USING ((select auth.role()) = 'service_role');

ALTER POLICY "service_role_only_backlinks" ON public.backlink_prospects
  USING ((select auth.role()) = 'service_role');

ALTER POLICY "service_role_only_directories" ON public.directory_submissions
  USING ((select auth.role()) = 'service_role');

-- Index manquant sur la FK organizations.owner_id (advisor unindexed_foreign_keys).
-- Sans lui, toute suppression/mise à jour d'un profil propriétaire déclenche un
-- seq scan de organizations pour valider la contrainte.
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id
  ON public.organizations (owner_id);
