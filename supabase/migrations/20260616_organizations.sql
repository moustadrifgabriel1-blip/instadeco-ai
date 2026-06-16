-- ============================================
-- MULTI-TENANT AGENCE — organizations + organization_members
-- ============================================
-- Socle de l'offre Agence (99€, jusqu'à 3 sièges). Une organisation = 1 abonnement
-- Agence ; ses membres (≤ seats) partagent la génération illimitée.
-- RLS activée SANS policy → tables service-role-only (accès via use-cases avec le
-- client admin, qui enforce l'auth). Même posture sûre que rate_limits/trial_usage.

CREATE TABLE IF NOT EXISTS public.organizations (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id               uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name                   text NOT NULL,
  plan                   text NOT NULL DEFAULT 'agence',
  status                 text NOT NULL DEFAULT 'active',
  seats                  integer NOT NULL DEFAULT 3,
  stripe_customer_id     text,
  stripe_subscription_id text,
  renews_at              timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organizations_status_check CHECK (status = ANY (ARRAY['active','canceled','past_due']::text[])),
  CONSTRAINT organizations_seats_check  CHECK (seats >= 1)
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL = invitation en attente
  email           text NOT NULL,
  role            text NOT NULL DEFAULT 'member',
  status          text NOT NULL DEFAULT 'active',
  invited_at      timestamptz NOT NULL DEFAULT now(),
  joined_at       timestamptz,
  CONSTRAINT organization_members_role_check   CHECK (role = ANY (ARRAY['owner','member']::text[])),
  CONSTRAINT organization_members_status_check CHECK (status = ANY (ARRAY['active','pending','removed']::text[])),
  CONSTRAINT organization_members_unique_email UNIQUE (organization_id, email)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org_id  ON public.organization_members (organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members (user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_email   ON public.organization_members (email);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription ON public.organizations (stripe_subscription_id);

ALTER TABLE public.organizations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.organizations IS 'Offre Agence : 1 org = 1 abonnement, membres ≤ seats partagent la génération illimitée. Service-role-only (RLS sans policy).';
