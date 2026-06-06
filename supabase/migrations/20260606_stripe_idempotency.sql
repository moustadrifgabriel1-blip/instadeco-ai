-- ============================================
-- Migration: Idempotence des webhooks Stripe + alignement credit_transactions
-- Date: 2026-06-06
-- Description:
--   1. Table `processed_stripe_events` servant de verrou d'idempotence :
--      chaque event.id Stripe n'est traité (crédité) qu'une seule fois,
--      même si Stripe rejoue le webhook (retries réseau, redéploiements).
--   2. Alignement de la table credit_transactions avec le code applicatif
--      (rel-04) : colonne stripe_session_id manquante + contrainte CHECK
--      sur `type` qui divergeait (code utilise 'generation', la migration
--      initiale n'autorisait que 'deduction').
-- ============================================

-- ---------------------------------------------
-- 1. Table d'idempotence des événements Stripe
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS processed_stripe_events (
  event_id     TEXT PRIMARY KEY,
  type         TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE processed_stripe_events IS
  'Verrou d''idempotence des webhooks Stripe : un event.id traité une seule fois.';

ALTER TABLE processed_stripe_events ENABLE ROW LEVEL SECURITY;
-- Aucune policy : seul le service_role (qui bypass la RLS) y accède via le webhook.

-- ---------------------------------------------
-- 2. Alignement credit_transactions (rel-04)
-- ---------------------------------------------

-- 2.a Colonne stripe_session_id utilisée par le code (SupabaseCreditRepository)
ALTER TABLE credit_transactions
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

COMMENT ON COLUMN credit_transactions.stripe_session_id IS
  'Identifiant de session Stripe Checkout à l''origine de la transaction (achat de crédits).';

-- 2.b Contrainte CHECK sur `type` : aligner avec CreditTransactionType côté code.
--     Code/entité : 'purchase' | 'generation' | 'refund' | 'bonus'.
--     On conserve 'deduction' pour la compatibilité avec d'éventuelles lignes
--     historiques insérées par les anciennes fonctions SQL.
ALTER TABLE credit_transactions
  DROP CONSTRAINT IF EXISTS credit_transactions_type_check;

ALTER TABLE credit_transactions
  ADD CONSTRAINT credit_transactions_type_check
  CHECK (type IN ('purchase', 'generation', 'deduction', 'refund', 'bonus'));
