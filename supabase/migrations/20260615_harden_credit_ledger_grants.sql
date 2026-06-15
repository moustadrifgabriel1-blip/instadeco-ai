-- ============================================
-- DURCISSEMENT CRITIQUE : fonctions crédit réservées au service_role
-- ============================================
-- FAILLE (introduite par 20260615_atomic_credit_ledger.sql) :
--   add_credits_with_ledger() et deduct_credits_with_ledger() (SECURITY DEFINER)
--   sont exécutables par anon ET authenticated via /rest/v1/rpc/<fn>.
--   La clé anon étant PUBLIQUE (client-side), N'IMPORTE QUI pouvait s'auto-créditer
--   à l'infini :  POST /rest/v1/rpc/add_credits_with_ledger
--                 { user_id_input, amount_input: 999999, type_input: 'bonus', ... }
--   → exploit "argent gratuit" direct. CRITIQUE.
--
-- CAUSE : la migration d'origine ne faisait que `REVOKE ALL ... FROM PUBLIC`.
--   Or les DEFAULT PRIVILEGES de Supabase accordent EXECUTE *explicitement* aux
--   rôles anon et authenticated à la création de toute fonction du schéma public.
--   `REVOKE FROM PUBLIC` ne retire pas ces grants explicites (même piège que
--   20260614_harden_cleanup_rate_limits_grants.sql).
--
-- CORRECTIF : retirer explicitement EXECUTE à anon et authenticated.
--   service_role conserve EXECUTE (le repo SupabaseCreditRepository appelle ces
--   fonctions via le client admin / service role) → ZÉRO régression côté code.
--   Idempotent (REVOKE d'un grant absent = no-op sans erreur). Non destructif
--   (aucun DROP de table/colonne/fonction).

REVOKE EXECUTE ON FUNCTION public.add_credits_with_ledger(uuid, integer, text, text, text, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.add_credits_with_ledger(uuid, integer, text, text, text, uuid) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.deduct_credits_with_ledger(uuid, integer, text, text, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.deduct_credits_with_ledger(uuid, integer, text, text, uuid) FROM authenticated;

-- Filet de sécurité : réaffirmer service_role (le seul rôle légitime).
GRANT EXECUTE ON FUNCTION public.add_credits_with_ledger(uuid, integer, text, text, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.deduct_credits_with_ledger(uuid, integer, text, text, uuid) TO service_role;
