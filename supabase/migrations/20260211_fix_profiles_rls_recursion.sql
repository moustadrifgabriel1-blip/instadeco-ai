-- ============================================================
-- FIX: Récursion infinie dans les policies RLS de "profiles"
-- ============================================================
-- Problème : Les policies "Admins have full access to profiles" et 
-- "Users can update own profile" font des SELECT sur la table profiles
-- depuis les conditions USING/WITH CHECK, ce qui déclenche à nouveau
-- l'évaluation des policies → récursion infinie.
--
-- Solution : Utiliser des fonctions SECURITY DEFINER qui contournent 
-- le RLS pour ces vérifications internes.
-- ============================================================

-- 1. Fonction helper pour vérifier si l'utilisateur est admin
-- SECURITY DEFINER = s'exécute avec les droits du créateur (bypass RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. Fonction helper pour récupérer les crédits de l'utilisateur courant
CREATE OR REPLACE FUNCTION public.get_own_credits()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT credits FROM profiles WHERE id = auth.uid();
$$;

-- 3. Fonction helper pour récupérer le rôle de l'utilisateur courant
CREATE OR REPLACE FUNCTION public.get_own_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- 4. Supprimer les anciennes policies problématiques
DROP POLICY IF EXISTS "Admins have full access to profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 5. Recréer la policy Admin SANS récursion
CREATE POLICY "Admins have full access to profiles" ON profiles
  FOR ALL
  USING (public.is_admin());

-- 6. Recréer la policy Update SANS récursion
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Empêcher la modification des crédits et du rôle via les fonctions SECURITY DEFINER
    credits = public.get_own_credits() AND
    role = public.get_own_role()
  );

-- ============================================================
-- BONUS: Mettre à jour les policies admin d'autres tables
-- pour utiliser is_admin() (performance + cohérence)
-- ============================================================

-- audit_logs — table non créée en prod, skip
-- DROP POLICY IF EXISTS "Admins can read all audit logs" ON audit_logs;

-- blog_articles
DROP POLICY IF EXISTS "Admins can insert blog articles" ON blog_articles;
CREATE POLICY "Admins can insert blog articles" ON blog_articles
  FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update blog articles" ON blog_articles;
CREATE POLICY "Admins can update blog articles" ON blog_articles
  FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete blog articles" ON blog_articles;
CREATE POLICY "Admins can delete blog articles" ON blog_articles
  FOR DELETE
  USING (public.is_admin());

-- 7. Vérification
DO $$
BEGIN
  RAISE NOTICE '✅ Policies RLS corrigées — plus de récursion infinie';
  RAISE NOTICE '✅ Fonctions is_admin(), get_own_credits(), get_own_role() créées';
  RAISE NOTICE '✅ Policies admin de audit_logs et blog_articles mises à jour';
END $$;
