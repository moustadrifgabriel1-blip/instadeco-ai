-- ============================================
-- TABLE: blog_articles
-- Migration pour le système SEO Automation
-- ============================================

-- Créer la table blog_articles
CREATE TABLE IF NOT EXISTS blog_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Contenu
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    meta_description TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- Statut et métadonnées
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    word_count INTEGER DEFAULT 0,
    reading_time_minutes INTEGER DEFAULT 1,
    anti_ai_score INTEGER DEFAULT 0 CHECK (anti_ai_score >= 0 AND anti_ai_score <= 100),
    
    -- Source et session
    session_type TEXT CHECK (session_type IN ('morning', 'afternoon', 'evening')),
    source TEXT DEFAULT 'automation',
    
    -- Timestamps
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEX pour performance
-- ============================================

-- Index sur le slug (recherche par URL)
CREATE INDEX IF NOT EXISTS idx_blog_articles_slug ON blog_articles(slug);

-- Index sur le statut (filtrage par statut)
CREATE INDEX IF NOT EXISTS idx_blog_articles_status ON blog_articles(status);

-- Index sur la date de publication (tri chronologique)
CREATE INDEX IF NOT EXISTS idx_blog_articles_published_at ON blog_articles(published_at DESC);

-- Index sur les tags (recherche par tag) - GIN pour arrays
CREATE INDEX IF NOT EXISTS idx_blog_articles_tags ON blog_articles USING GIN(tags);

-- Index composite pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_blog_articles_status_published 
    ON blog_articles(status, published_at DESC) 
    WHERE status = 'published';

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS
ALTER TABLE blog_articles ENABLE ROW LEVEL SECURITY;

-- Policy: Lecture publique des articles publiés
CREATE POLICY "Blog articles are viewable by everyone" 
    ON blog_articles 
    FOR SELECT 
    USING (status = 'published');

-- Policy: Insertion uniquement via service_role (Functions/API)
CREATE POLICY "Blog articles can be inserted by service role" 
    ON blog_articles 
    FOR INSERT 
    WITH CHECK (true);

-- Policy: Update uniquement via service_role
CREATE POLICY "Blog articles can be updated by service role" 
    ON blog_articles 
    FOR UPDATE 
    USING (true);

-- Policy: Delete uniquement via service_role
CREATE POLICY "Blog articles can be deleted by service role" 
    ON blog_articles 
    FOR DELETE 
    USING (true);

-- ============================================
-- FONCTION: Mise à jour automatique de updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_blog_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_blog_articles_updated_at ON blog_articles;
CREATE TRIGGER trigger_blog_articles_updated_at
    BEFORE UPDATE ON blog_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_blog_articles_updated_at();

-- ============================================
-- FONCTION: Recherche full-text
-- ============================================

-- Ajouter une colonne pour la recherche full-text
ALTER TABLE blog_articles 
ADD COLUMN IF NOT EXISTS search_vector tsvector 
GENERATED ALWAYS AS (
    setweight(to_tsvector('french', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(meta_description, '')), 'B') ||
    setweight(to_tsvector('french', coalesce(content, '')), 'C')
) STORED;

-- Index GIN pour la recherche full-text
CREATE INDEX IF NOT EXISTS idx_blog_articles_search 
    ON blog_articles USING GIN(search_vector);

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON TABLE blog_articles IS 'Articles de blog générés automatiquement pour le SEO';
COMMENT ON COLUMN blog_articles.slug IS 'URL-friendly identifier unique';
COMMENT ON COLUMN blog_articles.anti_ai_score IS 'Score de naturalité (0-100, 100 = très humain)';
COMMENT ON COLUMN blog_articles.session_type IS 'Session de génération: morning, afternoon, evening';
COMMENT ON COLUMN blog_articles.search_vector IS 'Vecteur de recherche full-text (généré automatiquement)';
