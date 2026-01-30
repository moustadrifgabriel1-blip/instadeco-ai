-- Migration: Table app_settings pour stocker les configurations
-- Date: 2026-01-30

-- Table pour stocker les paramètres de l'application
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);

-- RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Seul le service role peut lire/écrire (pas d'accès utilisateur)
CREATE POLICY "Service role only" ON app_settings
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Commentaire
COMMENT ON TABLE app_settings IS 'Paramètres internes de l application (milestones, configs, etc.)';
