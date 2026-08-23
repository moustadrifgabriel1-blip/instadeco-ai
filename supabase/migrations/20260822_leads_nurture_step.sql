-- Relance des leads par ETAPE plutot que par fenetre temporelle.
--
-- Contexte : le cron email-nurturing ne traitait que deux sources (quiz et
-- essai) via des fenetres de 24 h. Les leads des autres sources (popup
-- « 3 credits offerts » = lead_capture, outils gratuits) ne matchaient aucune
-- requete : 20 leads sur 24 n'ont jamais recu un seul email. Et une fenetre
-- ratee (cron en panne un jour) etait perdue pour toujours.
--
-- Ces deux colonnes permettent une sequence generique idempotente : on envoie
-- l'etape suivante des que le delai minimal est ecoule, quel que soit l'age
-- du lead. Un lead ancien rattrape donc la sequence au lieu d'etre oublie.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS nurture_step SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_nurtured_at TIMESTAMPTZ;

COMMENT ON COLUMN public.leads.nurture_step IS 'Derniere etape de relance envoyee (0 = aucune).';
COMMENT ON COLUMN public.leads.last_nurtured_at IS 'Date du dernier email de relance.';

CREATE INDEX IF NOT EXISTS idx_leads_nurture
  ON public.leads (nurture_step, last_nurtured_at)
  WHERE unsubscribed IS NOT TRUE;
