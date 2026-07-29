-- Re-roll gratuit : une génération peut référencer la génération qu'elle refait.
-- Règle produit : 1 seul re-roll gratuit par génération (vérifié applicativement
-- via l'existence d'un enfant). ON DELETE SET NULL : supprimer le parent ne casse
-- jamais l'historique de l'enfant.
ALTER TABLE generations
  ADD COLUMN IF NOT EXISTS parent_generation_id UUID REFERENCES generations(id) ON DELETE SET NULL;

-- Index partiel : la quasi-totalité des lignes a un parent NULL, on n'indexe que
-- les re-rolls (lookup "cette génération a-t-elle déjà un enfant ?").
CREATE INDEX IF NOT EXISTS idx_generations_parent_generation_id
  ON generations (parent_generation_id)
  WHERE parent_generation_id IS NOT NULL;
