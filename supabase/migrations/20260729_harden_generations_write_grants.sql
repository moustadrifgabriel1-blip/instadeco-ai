-- 🔴 FAILLE CRITIQUE (money) : `anon`/`authenticated` avaient INSERT/UPDATE sur
-- `generations`, avec les policies « Users can create/update own generations ».
-- Inoffensif tant que rien ne dépendait du contenu de la table ; devenu un robinet
-- à générations gratuites avec le re-roll (20260728_generation_reroll.sql) :
--
--   1. l'utilisateur INSERT via /rest/v1/generations une fausse ligne lui appartenant
--      avec status='completed' (coût : 0 crédit) ;
--   2. il appelle POST /api/v2/generate avec rerollOf=<id forgé> → le use-case ne
--      valide que des colonnes qu'il contrôle → génération SANS débit ;
--   3. il boucle. Variante : PATCH parent_generation_id=NULL sur son enfant pour
--      re-rouvrir le droit au re-roll indéfiniment.
--
-- Vérifié avant application : AUCUNE écriture client sur `generations` (toutes les
-- écritures passent par le service role via SupabaseGenerationRepository). La policy
-- SELECT est conservée : elle sert les lectures RLS légitimes.

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.generations FROM anon, authenticated;

DROP POLICY IF EXISTS "Users can create own generations" ON public.generations;
DROP POLICY IF EXISTS "Users can update own generations" ON public.generations;

-- Unicité du re-roll garantie par la BASE, pas par un check applicatif.
-- L'ancien index partiel non unique laissait passer une course TOCTOU : N requêtes
-- concurrentes avec le même rerollOf lisaient toutes hasReroll=0 avant le premier
-- INSERT, donc N générations gratuites pour un seul rendu payé.
DROP INDEX IF EXISTS idx_generations_parent_generation_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_generations_parent_generation_id
  ON public.generations (parent_generation_id)
  WHERE parent_generation_id IS NOT NULL;
