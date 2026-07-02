-- Migration: suivi de la demande d'avis post-generation (cron email-nurturing).
-- Un seul email de demande d'avis par utilisateur, a vie : la colonne sert de
-- garde d'idempotence (NULL = jamais sollicite).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS rating_request_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.rating_request_sent_at IS
  'Date d''envoi de l''email de demande d''avis (cron email-nurturing). NULL = jamais envoye. Un seul envoi par utilisateur.';
