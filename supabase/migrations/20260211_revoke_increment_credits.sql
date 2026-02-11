/**
 * Migration: Révoquer l'accès à increment_credits pour les utilisateurs authentifiés
 * 
 * SÉCURITÉ CRITIQUE: La fonction increment_credits était callable directement
 * par tout utilisateur authentifié via supabase.rpc(), permettant l'ajout
 * illimité de crédits gratuits.
 * 
 * Seul le service_role (backend) doit pouvoir appeler increment_credits.
 * deduct_credits reste accessible via le backend uniquement (les appels RPC
 * passent par les API routes qui vérifient l'auth + la logique métier).
 */

-- Révoquer increment_credits pour les utilisateurs authentifiés
-- Seul le service_role pourra l'appeler désormais
REVOKE EXECUTE ON FUNCTION increment_credits(UUID, INTEGER) FROM authenticated;

-- Révoquer aussi deduct_credits par sécurité — 
-- Les déductions passent par le backend (service_role) via les API routes
REVOKE EXECUTE ON FUNCTION deduct_credits(UUID, INTEGER) FROM authenticated;

-- Ajouter RLS sur les tables backlink qui en manquent
ALTER TABLE IF EXISTS backlink_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS directory_submissions ENABLE ROW LEVEL SECURITY;

-- Policies restrictives : seul le service_role peut accéder à ces tables admin
DO $$
BEGIN
  -- backlink_prospects
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'backlink_prospects' AND policyname = 'service_role_only_backlinks'
  ) THEN
    CREATE POLICY service_role_only_backlinks ON backlink_prospects
      FOR ALL USING (auth.role() = 'service_role');
  END IF;

  -- directory_submissions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'directory_submissions' AND policyname = 'service_role_only_directories'
  ) THEN
    CREATE POLICY service_role_only_directories ON directory_submissions
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;
