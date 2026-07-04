-- Ajoute une colonne `metadata` (JSONB) à la table `leads`.
--
-- Contexte : le repository (SupabaseLeadRepository.create) insère `metadata`
-- quand il est fourni, et plusieurs points de capture l'envoient déjà (le quiz
-- envoie { style }, les outils gratuits envoient profil/pièce/économie). Sans
-- cette colonne, l'INSERT échoue ("Could not find the 'metadata' column"),
-- donc la capture d'email tombait en 500. Cette colonne stocke la segmentation
-- de façon souple (profil du lead, source détaillée) pour le nurturing.
--
-- Idempotent.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS metadata JSONB;
