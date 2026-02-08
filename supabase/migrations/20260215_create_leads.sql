-- Migration: Créer la table leads pour la capture d'emails
-- Date: 2026-02-15

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  source TEXT DEFAULT 'lead_capture',
  converted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index sur email pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads (email);

-- Index sur source pour analytics
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads (source);

-- RLS : Seul le service role peut accéder
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Aucune policy pour les utilisateurs anon/authenticated : 
-- l'insertion se fait via supabaseAdmin (service role)

-- Fonction trigger pour updated_at
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();
