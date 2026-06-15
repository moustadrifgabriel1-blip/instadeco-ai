-- ============================================
-- Migration: Idempotence des webhooks Stripe — table processed_stripe_events
-- Date: 2026-06-06 (corrigée le 2026-06-15)
-- Description:
--   Table `processed_stripe_events` servant de verrou d'idempotence :
--   chaque event.id Stripe n'est traité (crédité) qu'une seule fois, même si
--   Stripe rejoue le webhook (retries réseau, redéploiements).
--   Colonnes alignées sur SupabaseProcessedEventRepository : event_id (PK), type.
--
-- NOTE : la version initiale de ce fichier ajoutait aussi une colonne
--   `stripe_session_id` à credit_transactions + une contrainte CHECK. C'ÉTAIT
--   FAUX — la vraie colonne est `stripe_payment_intent`. L'alignement correct de
--   credit_transactions est désormais géré par 20260615_atomic_credit_ledger.sql.
--   Ce fichier ne crée plus que la table d'idempotence (seule partie jamais appliquée).
-- ============================================

CREATE TABLE IF NOT EXISTS public.processed_stripe_events (
  event_id     TEXT PRIMARY KEY,
  type         TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.processed_stripe_events IS
  'Verrou d''idempotence des webhooks Stripe : un event.id traité une seule fois.';

-- RLS activée sans policy : seul le service_role (qui bypass la RLS) y accède
-- via le webhook (SupabaseProcessedEventRepository → client admin). anon/authenticated
-- n'y ont aucun accès → pas de fuite ni de manipulation du verrou d'idempotence.
ALTER TABLE public.processed_stripe_events ENABLE ROW LEVEL SECURITY;
