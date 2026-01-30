/**
 * Rate Limiter - Protection contre les attaques par force brute
 * 
 * Utilise un cache en mémoire pour limiter le nombre de requêtes par IP/utilisateur.
 * Note: En production avec plusieurs instances, utiliser Redis ou Upstash.
 */

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
 * Vérifie si une requête est autorisée selon le rate limit
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
