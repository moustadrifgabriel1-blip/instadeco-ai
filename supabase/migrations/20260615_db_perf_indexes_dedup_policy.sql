-- ============================================
-- PERF DB : index sur FK non couvertes + suppression d'une policy doublon
-- ============================================
-- Source : advisors performance Supabase (unindexed_foreign_keys,
-- multiple_permissive_policies). Non destructif côté données.

-- 1) Index sur les clés étrangères non indexées.
--    Sans index, un DELETE sur la table parente (generations, profiles) force un
--    seq scan de la table enfant pour vérifier la FK → lent à l'échelle.
CREATE INDEX IF NOT EXISTS idx_credit_transactions_generation_id
  ON public.credit_transactions (generation_id);

CREATE INDEX IF NOT EXISTS idx_profiles_referred_by
  ON public.profiles (referred_by);

-- 2) Dédup de la policy SELECT sur profiles.
--    'Users can view own profile' est STRICTEMENT identique à
--    'Users can read own profile' (cmd=SELECT, roles=public, USING auth.uid()=id).
--    Deux policies permissives identiques = surcoût d'évaluation (advisor
--    multiple_permissive_policies) sans bénéfice. On retire le doublon ;
--    la policy jumelle identique demeure → AUCUN changement d'accès.
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
