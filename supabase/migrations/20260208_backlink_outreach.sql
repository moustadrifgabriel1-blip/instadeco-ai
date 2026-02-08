-- Migration: Système de backlink outreach automatisé
-- Date: 2026-02-08

-- Table des prospects de backlinks
CREATE TABLE IF NOT EXISTS backlink_prospects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Informations du site
  site_name TEXT NOT NULL,
  site_url TEXT NOT NULL UNIQUE,
  contact_email TEXT,
  contact_name TEXT,
  
  -- Catégorisation
  category TEXT NOT NULL DEFAULT 'blog_deco',
  -- blog_deco, blog_archi, annuaire, presse, influenceur, partenaire, forum
  
  domain_authority INTEGER, -- DA estimé (0-100)
  language TEXT DEFAULT 'fr', -- fr, en, de, nl
  country TEXT DEFAULT 'FR', -- FR, CH, BE
  
  -- Statut du pipeline
  status TEXT NOT NULL DEFAULT 'prospect',
  -- prospect → contacted → responded → negotiating → published → rejected → expired
  
  -- Outreach
  pitch_generated TEXT,        -- Pitch personnalisé auto-généré
  article_draft TEXT,          -- Brouillon d'article invité auto-généré
  article_topic TEXT,          -- Sujet proposé
  outreach_sent_at TIMESTAMPTZ,
  follow_up_sent_at TIMESTAMPTZ,
  response_received_at TIMESTAMPTZ,
  
  -- Résultat
  backlink_url TEXT,           -- URL de la page avec notre lien
  backlink_anchor TEXT,        -- Texte d'ancrage
  backlink_type TEXT,          -- dofollow, nofollow, ugc, sponsored
  published_at TIMESTAMPTZ,
  
  -- Méta  
  notes TEXT,
  priority INTEGER DEFAULT 5, -- 1 (haute) à 10 (basse)
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des annuaires pour soumission automatique
CREATE TABLE IF NOT EXISTS directory_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  directory_name TEXT NOT NULL,
  directory_url TEXT NOT NULL,
  submission_url TEXT,         -- URL du formulaire de soumission
  category TEXT,               -- Catégorie dans l'annuaire
  
  status TEXT NOT NULL DEFAULT 'pending',
  -- pending → submitted → approved → rejected → expired
  
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  listing_url TEXT,            -- URL de notre listing
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_backlink_prospects_status ON backlink_prospects(status);
CREATE INDEX IF NOT EXISTS idx_backlink_prospects_priority ON backlink_prospects(priority);
CREATE INDEX IF NOT EXISTS idx_backlink_prospects_category ON backlink_prospects(category);
CREATE INDEX IF NOT EXISTS idx_directory_submissions_status ON directory_submissions(status);

-- Fonction de mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_backlink_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_backlink_updated_at
  BEFORE UPDATE ON backlink_prospects
  FOR EACH ROW
  EXECUTE FUNCTION update_backlink_updated_at();
