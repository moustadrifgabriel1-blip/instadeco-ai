-- ============================================
-- Table trial_usage : Suivi persistant des essais gratuits
-- Anti-abus : empêche les utilisations multiples par IP/fingerprint
-- ============================================

CREATE TABLE IF NOT EXISTS trial_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,           -- IPv4 ou IPv6
  fingerprint VARCHAR(64),                    -- Fingerprint navigateur (optionnel)
  style VARCHAR(50),                          -- Style choisi
  room_type VARCHAR(50),                      -- Type de pièce
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index pour recherche rapide par IP (requête la plus fréquente)
CREATE INDEX IF NOT EXISTS idx_trial_usage_ip_created 
  ON trial_usage (ip_address, created_at DESC);

-- Index pour recherche par fingerprint
CREATE INDEX IF NOT EXISTS idx_trial_usage_fingerprint 
  ON trial_usage (fingerprint) 
  WHERE fingerprint IS NOT NULL;

-- RLS : uniquement accessible via service_role (API backend)
ALTER TABLE trial_usage ENABLE ROW LEVEL SECURITY;

-- Pas de politique RLS pour les utilisateurs anonymes/authentifiés
-- Seul le service_role_key (backend) peut lire/écrire dans cette table

-- Nettoyage automatique des entrées > 90 jours (optionnel, via un cron)
COMMENT ON TABLE trial_usage IS 'Suivi anti-abus des essais gratuits. Accessible uniquement via service_role.';
