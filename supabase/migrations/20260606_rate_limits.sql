-- ============================================================
-- Migration: Distributed rate limiting (sec-05)
-- Date: 2026-06-06
-- Description: Table + RPC atomique pour un rate-limiting partagé
--              entre instances serverless (Vercel multi-instance).
--              Remplace la Map mémoire process-local de
--              lib/security/rate-limiter.ts (compteur non partagé).
--
-- NE PAS appliquer manuellement sans relecture. Appliquer via Supabase
-- (dashboard SQL editor ou supabase db push).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Table rate_limits
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key          TEXT        PRIMARY KEY,
  count        INT         NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL
);

-- Index pour le nettoyage des fenêtres expirées
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires_at
  ON public.rate_limits (expires_at);

-- RLS : aucune lecture/écriture publique. Seul le service_role
-- (qui bypass RLS) et la fonction SECURITY DEFINER accèdent à la table.
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 2. RPC atomique increment_rate_limit
--    Retourne { allowed, remaining, retry_after, reset_at }
--    - allowed     : booléen, requête autorisée ou non
--    - remaining   : requêtes restantes dans la fenêtre
--    - retry_after : secondes avant reset (0 si autorisé)
--    - reset_at    : epoch ms de fin de fenêtre
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_rate_limit(
  p_key            TEXT,
  p_max            INT,
  p_window_seconds INT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now        TIMESTAMPTZ := NOW();
  v_count      INT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Upsert atomique : insère une nouvelle fenêtre, ou incrémente
  -- la fenêtre courante. Si la fenêtre existante est expirée, on la
  -- réinitialise (count = 1, nouvelle expiration).
  INSERT INTO public.rate_limits (key, count, window_start, expires_at)
  VALUES (p_key, 1, v_now, v_now + make_interval(secs => p_window_seconds))
  ON CONFLICT (key) DO UPDATE
    SET
      count = CASE
                WHEN public.rate_limits.expires_at < v_now THEN 1
                ELSE public.rate_limits.count + 1
              END,
      window_start = CASE
                       WHEN public.rate_limits.expires_at < v_now THEN v_now
                       ELSE public.rate_limits.window_start
                     END,
      expires_at = CASE
                     WHEN public.rate_limits.expires_at < v_now
                       THEN v_now + make_interval(secs => p_window_seconds)
                     ELSE public.rate_limits.expires_at
                   END
  RETURNING count, expires_at INTO v_count, v_expires_at;

  IF v_count > p_max THEN
    RETURN json_build_object(
      'allowed',     false,
      'remaining',   0,
      'retry_after', GREATEST(CEIL(EXTRACT(EPOCH FROM (v_expires_at - v_now)))::INT, 1),
      'reset_at',    (EXTRACT(EPOCH FROM v_expires_at) * 1000)::BIGINT
    );
  END IF;

  RETURN json_build_object(
    'allowed',     true,
    'remaining',   p_max - v_count,
    'retry_after', 0,
    'reset_at',    (EXTRACT(EPOCH FROM v_expires_at) * 1000)::BIGINT
  );
END;
$$;

-- Verrouiller l'exécution : seul service_role appelle cette RPC
-- (côté serveur via SUPABASE_SERVICE_ROLE_KEY). Pas d'accès anon/authenticated.
REVOKE ALL ON FUNCTION public.increment_rate_limit(TEXT, INT, INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_rate_limit(TEXT, INT, INT) FROM anon;
REVOKE ALL ON FUNCTION public.increment_rate_limit(TEXT, INT, INT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.increment_rate_limit(TEXT, INT, INT) TO service_role;

-- ------------------------------------------------------------
-- 3. Nettoyage optionnel des entrées expirées (best-effort)
--    À appeler depuis un cron si besoin ; sinon les fenêtres
--    expirées sont réinitialisées à la volée par l'upsert.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM public.rate_limits WHERE expires_at < NOW() - INTERVAL '1 hour';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_rate_limits() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_rate_limits() TO service_role;
