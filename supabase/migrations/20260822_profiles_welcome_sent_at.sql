-- Email de bienvenue idempotent.
-- Avant : envoye uniquement dans /auth/callback si le compte avait moins de
-- 60 s. Avec la confirmation par email (l'utilisateur clique plus tard), la
-- fenetre etait presque toujours depassee : l'email de bienvenue, qui pousse
-- vers le premier rendu, ne partait quasiment jamais.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS welcome_sent_at TIMESTAMPTZ;
COMMENT ON COLUMN public.profiles.welcome_sent_at IS 'Date d''envoi de l''email de bienvenue (null = jamais).';
