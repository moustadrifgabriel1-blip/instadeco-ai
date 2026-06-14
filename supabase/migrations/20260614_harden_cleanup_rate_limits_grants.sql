-- ============================================
-- DURCISSEMENT : cleanup_rate_limits() réservée au service_role
-- ============================================
-- Contexte : l'advisor sécurité Supabase signale que public.cleanup_rate_limits()
-- (SECURITY DEFINER) est appelable par anon ET authenticated via
-- /rest/v1/rpc/cleanup_rate_limits. N'importe qui peut donc vider la table de
-- rate-limiting → contournement du rate-limiting distribué (cf. règle sécurité CLAUDE.md).
--
-- Pourquoi le REVOKE initial n'a pas suffi : la migration 20260606_rate_limits.sql
-- faisait `REVOKE ALL ... FROM PUBLIC`, mais les DEFAULT PRIVILEGES de Supabase
-- accordent EXECUTE *explicitement* aux rôles anon et authenticated à la création
-- de toute fonction du schéma public. `REVOKE FROM PUBLIC` ne retire pas ces grants
-- explicites → la fonction restait ouverte.
--
-- Correctif : retirer explicitement les grants anon/authenticated. service_role
-- (utilisé côté serveur pour le nettoyage) conserve EXECUTE. Idempotent (REVOKE d'un
-- grant absent est un no-op sans erreur).
-- Aucune régression : aucun code client (anon/authenticated) n'appelle cette fonction.

REVOKE ALL     ON FUNCTION public.cleanup_rate_limits() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits() FROM anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits() FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.cleanup_rate_limits() TO service_role;

-- NOTE (non corrigé volontairement) : les advisors flaguent aussi get_own_credits(),
-- get_own_role() et is_admin() comme exécutables par anon/authenticated. Ces fonctions
-- sont REQUISES par des policies RLS (profiles, blog_articles) — révoquer EXECUTE
-- casserait l'évaluation RLS pour les opérations légitimes (update de profil, admin blog).
-- Et leur exposition est inoffensive : elles ne renvoient que les données de l'appelant
-- (auth.uid()), jamais celles d'autrui. On les laisse donc intentionnellement ouvertes.
