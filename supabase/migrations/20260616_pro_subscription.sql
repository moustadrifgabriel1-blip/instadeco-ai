-- ============================================
-- ABONNEMENT PRO — colonnes d'état sur profiles
-- ============================================
-- Socle du modèle d'abonnement immobilier (Solo / Pro illimité / Agence).
-- Additif et idempotent : aucune donnée existante touchée, aucun changement de
-- comportement tant que le webhook/les use-cases ne lisent pas ces colonnes.
--
-- Modèle :
--  - stripe_customer_id / stripe_subscription_id : mapping pour retrouver l'user
--    sur les events de renouvellement (invoice.paid) et d'annulation.
--  - pro_plan   : 'solo' | 'pro' | 'agence' (NULL = pas d'abonnement).
--  - pro_status : 'active' | 'canceled' | 'past_due' (NULL = jamais abonné).
--  - pro_renews_at : fin de période courante (date de prochain renouvellement).
--  Pro/Agence = illimité (la génération ne débite pas de crédits si pro_status='active') ;
--  Solo = quota mensuel via le ledger crédits existant (rechargé sur invoice.paid).

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id     TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pro_plan               TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pro_status             TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pro_renews_at          TIMESTAMPTZ;

-- Garde-fous de valeurs (NULL autorisé = pas d'abonnement).
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pro_plan_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pro_plan_check
  CHECK (pro_plan IS NULL OR pro_plan = ANY (ARRAY['solo','pro','agence']::text[]));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pro_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pro_status_check
  CHECK (pro_status IS NULL OR pro_status = ANY (ARRAY['active','canceled','past_due']::text[]));

-- Index pour le mapping inverse sur les events Stripe de renouvellement/annulation.
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles (stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id ON public.profiles (stripe_subscription_id);

COMMENT ON COLUMN public.profiles.pro_status IS 'Abonnement Pro/immobilier : active | canceled | past_due | NULL. active = génération illimitée (Pro/Agence) sans débit crédits.';
