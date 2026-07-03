-- ============================================
-- Migration: RGPD - Consentement marketing par défaut à FALSE
-- Date: 2026-07-03
-- Description: Corrige le DEFAULT true hérité de 20260211_rgpd_consent_marketing.sql.
--   Un consentement marketing NON exprimé ne doit jamais valoir opt-in : le défaut
--   correct est FALSE (opt-in explicite requis). Le formulaire de signup envoie déjà
--   le vrai choix de l'utilisateur ; ce fix protège toute ligne créée hors de ce
--   chemin (trigger DB, imports, comptes créés par un autre flux).
--
-- NB : cette migration ne TOUCHE PAS aux lignes existantes (pas de bulk UPDATE).
--   Le re-consentement de la cohorte historique `consent_marketing = true` créée
--   avant l'opt-in explicite reste une décision métier distincte, à traiter avant
--   tout envoi marketing (cf. audit sécurité 19/06 + mémoire projet).
-- ============================================

ALTER TABLE profiles
  ALTER COLUMN consent_marketing SET DEFAULT false;

COMMENT ON COLUMN profiles.consent_marketing IS 'RGPD: consentement aux emails marketing (opt-in explicite à l''inscription, défaut false)';
