-- ============================================
-- FIX: Sécuriser les policies blog_articles
-- Date: 31 janvier 2026
-- ============================================

-- Supprimer les anciennes policies trop permissives
DROP POLICY IF EXISTS "Blog articles can be inserted by service role" ON blog_articles;
DROP POLICY IF EXISTS "Blog articles can be updated by service role" ON blog_articles;
DROP POLICY IF EXISTS "Blog articles can be deleted by service role" ON blog_articles;

-- Nouvelles policies : Admin seulement pour INSERT/UPDATE/DELETE
CREATE POLICY "Admins can insert blog articles" ON blog_articles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update blog articles" ON blog_articles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete blog articles" ON blog_articles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- La policy de lecture publique reste inchangée
-- "Blog articles are viewable by everyone" WHERE status = 'published'

COMMENT ON TABLE blog_articles IS 'Articles de blog - Lecture publique, écriture admin seulement';
