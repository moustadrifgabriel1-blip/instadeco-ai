-- ============================================
-- Migration: RGPD - Consentement marketing
-- Date: 2026-02-11
-- Description: Ajoute les colonnes de consentement marketing
--              et de désinscription pour la conformité RGPD
-- ============================================

-- Ajouter consent_marketing à profiles (default true pour les existants)
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS consent_marketing BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS consent_marketing_date TIMESTAMPTZ;

-- Ajouter unsubscribed à leads
ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS unsubscribed BOOLEAN DEFAULT false;

-- Commenter les colonnes pour documentation
COMMENT ON COLUMN profiles.consent_marketing IS 'RGPD: consentement aux emails marketing (opt-in à l''inscription)';
COMMENT ON COLUMN profiles.consent_marketing_date IS 'RGPD: date du consentement marketing';
COMMENT ON COLUMN leads.unsubscribed IS 'RGPD: lead désinscrit des emails marketing';
