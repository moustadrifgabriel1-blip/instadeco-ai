-- ============================================
-- BLOG MULTILINGUE
-- Ajoute la langue de l'article et rend le slug unique PAR langue.
-- Avant : les articles n'existaient qu'en 'fr' mais étaient servis sous /en et /de
-- (duplicate content). On stocke désormais la langue de rédaction.
-- ============================================

-- 1. Colonne language (fr | en | de), défaut 'fr' pour rétro-compatibilité.
ALTER TABLE blog_articles
    ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'fr'
    CHECK (language IN ('fr', 'en', 'de'));

COMMENT ON COLUMN blog_articles.language IS 'Langue de rédaction de l''article (fr, en, de)';

-- 2. Unicité du slug PAR langue (au lieu de globale).
--    Un même slug peut exister en fr, en et de (traductions d'un même sujet).

-- 2.a Retirer l'ancienne contrainte/index d'unicité globale sur slug.
--     Selon l'historique, l'unicité a pu être créée soit comme contrainte
--     (UNIQUE inline → contrainte nommée auto), soit comme index. On couvre les deux cas.
DO $$
DECLARE
    conname TEXT;
BEGIN
    -- Supprimer toute contrainte UNIQUE portant uniquement sur (slug)
    FOR conname IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_attribute att
            ON att.attrelid = con.conrelid
           AND att.attnum = ANY (con.conkey)
        WHERE rel.relname = 'blog_articles'
          AND con.contype = 'u'
        GROUP BY con.conname, con.conkey
        HAVING array_length(con.conkey, 1) = 1
           AND bool_and(att.attname = 'slug')
    LOOP
        EXECUTE format('ALTER TABLE blog_articles DROP CONSTRAINT %I', conname);
    END LOOP;
END $$;

-- Supprimer un éventuel index unique global sur slug seul (hors index composite ci-dessous).
DROP INDEX IF EXISTS blog_articles_slug_key;
DROP INDEX IF EXISTS idx_blog_articles_slug_unique;

-- 2.b Nouvelle unicité composite (slug, language).
CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_articles_slug_language_unique
    ON blog_articles (slug, language);

-- 3. Index de listing par langue + date (requêtes des pages blog localisées).
CREATE INDEX IF NOT EXISTS idx_blog_articles_language_published
    ON blog_articles (language, published_at DESC);

-- Index dédié pour le filtrage published + langue + date (pages blog).
CREATE INDEX IF NOT EXISTS idx_blog_articles_status_language_published
    ON blog_articles (status, language, published_at DESC)
    WHERE status = 'published';
