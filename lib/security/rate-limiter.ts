/**
 * Rate Limiter - Protection contre les attaques par force brute
 * 
 * Utilise un cache en mémoire pour limiter le nombre de requêtes par IP/utilisateur.
 * Note: En production avec plusieurs instances, utiliser Redis ou Upstash.
 */

/**
 * Dev Bypass Token — permet de contourner TOUS les rate limits.
 * À configurer dans Vercel : DEV_BYPASS_TOKEN=<token>
 * Le navigateur doit avoir le cookie `instadeco_dev` avec cette valeur.
 * 
 * Pour activer : ouvrir la console du navigateur et taper :
 *   document.cookie = "instadeco_dev=<token>;path=/;max-age=31536000;SameSite=Lax"
 */
const DEV_BYPASS_TOKEN = process.env.DEV_BYPASS_TOKEN || '';

/**
 * Vérifie si la requête contient un cookie dev bypass valide.
 * Fonctionne indépendamment de l'IP (portable, bureau, VPN, etc.).
 */
export function isDevBypass(headers: Headers): boolean {
  if (!DEV_BYPASS_TOKEN) return false;
  const cookies = headers.get('cookie') || '';
  const match = cookies.match(/instadeco_dev=([^;]+)/);
  return match?.[1] === DEV_BYPASS_TOKEN;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Cache en mémoire (pour une seule instance)
const rateLimitCache = new Map<string, RateLimitEntry>();

// Nettoyage périodique du cache (toutes les 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitCache.entries()) {
      if (entry.resetAt < now) {
        rateLimitCache.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitConfig {
  /** Nombre max de requêtes dans la fenêtre */
  maxRequests: number;
  /** Durée de la fenêtre en secondes */
  windowSeconds: number;
  /** Préfixe pour identifier le type de rate limit */
  prefix?: string;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * Vérifie si une requête est autorisée selon le rate limit.
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = config.prefix ? `${config.prefix}:${identifier}` : identifier;
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  
  const entry = rateLimitCache.get(key);
  
  // Nouvelle entrée ou fenêtre expirée
  if (!entry || entry.resetAt < now) {
    const resetAt = now + windowMs;
    rateLimitCache.set(key, { count: 1, resetAt });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetAt,
    };
  }
  
  // Fenêtre active
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }
  
  // Incrémenter le compteur
  entry.count++;
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * ============================================================
 * Rate-limiting DISTRIBUÉ (Supabase) — sec-05
 *
 * La Map mémoire ci-dessus est process-local : sur Vercel
 * serverless multi-instance, chaque instance a son propre compteur,
 * ce qui rend les limites (trial 1/IP/24h, generate 10/min)
 * contournables. `checkRateLimitDistributed` utilise une table
 * Supabase partagée (RPC atomique `increment_rate_limit`) avec
 * fallback automatique sur la Map mémoire si la DB est indisponible.
 *
 * La signature publique de `checkRateLimit` reste inchangée pour
 * ne pas casser les appelants existants.
 * ============================================================
 */

/**
 * Vérifie un rate limit via le store Supabase partagé (atomique).
 * Fallback transparent sur le cache mémoire si la table/DB est
 * indisponible (erreur réseau, RPC manquante, env non configuré).
 *
 * Retourne le même `RateLimitResult` que `checkRateLimit`.
 */
export async function checkRateLimitDistributed(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = config.prefix ? `${config.prefix}:${identifier}` : identifier;

  try {
    // Import dynamique pour éviter de charger le client admin (et ses
    // env vars) lors d'un usage purement mémoire / au build.
    const { getSupabaseAdmin } = await import('@/lib/supabase/admin-client');
    const supabase = getSupabaseAdmin();

    // Timeout court : un rate-limit ne doit JAMAIS faire hang une requête.
    // Si Supabase traîne / est injoignable (DNS, réseau), on abandonne vite
    // et on retombe sur le fallback mémoire (catch ci-dessous).
    const { data, error } = await supabase
      .rpc('increment_rate_limit', {
        p_key: key,
        p_max: config.maxRequests,
        p_window_seconds: config.windowSeconds,
      })
      .abortSignal(AbortSignal.timeout(1500));

    if (error || !data) {
      throw error ?? new Error('increment_rate_limit returned no data');
    }

    const row = data as {
      allowed: boolean;
      remaining: number;
      retry_after: number;
      reset_at: number;
    };

    return {
      success: row.allowed,
      remaining: Math.max(0, row.remaining ?? 0),
      resetAt: row.reset_at ?? Date.now() + config.windowSeconds * 1000,
      retryAfter: row.allowed ? undefined : Math.max(1, row.retry_after ?? config.windowSeconds),
    };
  } catch (err) {
    // Fallback mémoire : conservateur, ne fail jamais ouvert silencieusement
    // côté process, mais reste fonctionnel si la DB est down.
    console.warn(
      `[RateLimit] Supabase store indisponible, fallback mémoire (key=${key}):`,
      err instanceof Error ? err.message : err
    );
    return checkRateLimit(identifier, config);
  }
}

/**
 * Configurations prédéfinies pour différents endpoints
 */
export const RATE_LIMIT_CONFIGS = {
  // API de génération d'image (coûteuse)
  generate: {
    maxRequests: 10,
    windowSeconds: 60,
    prefix: 'gen',
  } as RateLimitConfig,
  
  // Création de checkout Stripe
  checkout: {
    maxRequests: 5,
    windowSeconds: 60,
    prefix: 'checkout',
  } as RateLimitConfig,
  
  // Authentification (protection brute force)
  auth: {
    maxRequests: 5,
    windowSeconds: 300, // 5 minutes
    prefix: 'auth',
  } as RateLimitConfig,
  
  // API générale
  api: {
    maxRequests: 100,
    windowSeconds: 60,
    prefix: 'api',
  } as RateLimitConfig,
  
  // Blog/CRON (limité car génère du contenu IA)
  blog: {
    maxRequests: 3,
    windowSeconds: 3600, // 1 heure
    prefix: 'blog',
  } as RateLimitConfig,
} as const;

/**
 * Extrait l'IP du client depuis les headers
 */
export function getClientIP(headers: Headers): string {
  // Vercel/Cloudflare
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  // Cloudflare
  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  // Vercel
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}
