import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  checkRateLimit,
  getClientIP,
  isDevBypass,
  type RateLimitConfig,
} from '@/lib/security/rate-limiter';

/**
 * Tests du rate-limiter en mémoire (`lib/security/rate-limiter.ts`).
 *
 * ⚠️ La `Map` mémoire est un singleton de module partagé entre tous les tests
 * (pas de reset entre `it`). Pour éviter toute fuite de compteur d'un test à
 * l'autre, chaque test utilise un `identifier` UNIQUE. On n'utilise pas de
 * faux timers : l'expiration de fenêtre est testée via une fenêtre de durée
 * négative (resetAt déjà dépassé) plutôt qu'en avançant le temps.
 */

let counter = 0;
/** Génère un identifiant unique par appel pour isoler chaque scénario. */
function uniqueId(label: string): string {
  counter += 1;
  return `${label}-${Date.now()}-${counter}-${Math.random().toString(36).slice(2)}`;
}

describe('checkRateLimit', () => {
  it('autorise la 1ère requête et décrémente remaining', () => {
    const id = uniqueId('first');
    const config: RateLimitConfig = { maxRequests: 3, windowSeconds: 60, prefix: 'test' };

    const result = checkRateLimit(id, config);

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(2); // maxRequests - 1
    expect(result.resetAt).toBeGreaterThan(Date.now());
    expect(result.retryAfter).toBeUndefined();
  });

  it('décrémente remaining à chaque requête dans la fenêtre', () => {
    const id = uniqueId('decrement');
    const config: RateLimitConfig = { maxRequests: 3, windowSeconds: 60, prefix: 'test' };

    const r1 = checkRateLimit(id, config);
    const r2 = checkRateLimit(id, config);
    const r3 = checkRateLimit(id, config);

    expect(r1.remaining).toBe(2);
    expect(r2.remaining).toBe(1);
    expect(r3.remaining).toBe(0);
    expect(r1.success && r2.success && r3.success).toBe(true);
  });

  it('refuse au-delà de maxRequests et renvoie retryAfter', () => {
    const id = uniqueId('exceed');
    const config: RateLimitConfig = { maxRequests: 2, windowSeconds: 60, prefix: 'test' };

    checkRateLimit(id, config); // 1
    checkRateLimit(id, config); // 2 (limite atteinte)
    const blocked = checkRateLimit(id, config); // 3 → refusé

    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfter).toBeGreaterThan(0);
    expect(blocked.retryAfter).toBeLessThanOrEqual(60);
    expect(blocked.resetAt).toBeGreaterThan(Date.now());
  });

  it('reste bloqué pour les requêtes suivantes une fois la limite atteinte', () => {
    const id = uniqueId('stay-blocked');
    const config: RateLimitConfig = { maxRequests: 1, windowSeconds: 60, prefix: 'test' };

    const ok = checkRateLimit(id, config); // consomme l'unique requête
    const blocked1 = checkRateLimit(id, config);
    const blocked2 = checkRateLimit(id, config);

    expect(ok.success).toBe(true);
    expect(blocked1.success).toBe(false);
    expect(blocked2.success).toBe(false);
  });

  it('réinitialise le compteur quand la fenêtre est expirée', () => {
    const id = uniqueId('reset');
    // Fenêtre négative → resetAt = now - 1000 ms, donc immédiatement expirée
    // au prochain appel. Permet de tester le reset sans faux timers.
    const expiredConfig: RateLimitConfig = {
      maxRequests: 1,
      windowSeconds: -1,
      prefix: 'test',
    };

    const first = checkRateLimit(id, expiredConfig); // crée l'entrée (déjà expirée)
    expect(first.success).toBe(true);

    // L'entrée précédente est expirée (resetAt < now) → le compteur repart à 1,
    // la requête est de nouveau autorisée au lieu d'être bloquée.
    const afterExpiry = checkRateLimit(id, expiredConfig);
    expect(afterExpiry.success).toBe(true);
    expect(afterExpiry.remaining).toBe(0); // maxRequests(1) - 1
  });

  it('isole les compteurs par préfixe pour un même identifiant', () => {
    const id = uniqueId('prefix');
    const cfgGen: RateLimitConfig = { maxRequests: 1, windowSeconds: 60, prefix: 'gen' };
    const cfgCheckout: RateLimitConfig = { maxRequests: 1, windowSeconds: 60, prefix: 'checkout' };

    const gen = checkRateLimit(id, cfgGen);
    const checkout = checkRateLimit(id, cfgCheckout);

    // Même identifiant mais préfixes différents → clés distinctes, les deux passent.
    expect(gen.success).toBe(true);
    expect(checkout.success).toBe(true);
  });

  it('fonctionne sans préfixe (clé = identifiant brut)', () => {
    const id = uniqueId('no-prefix');
    const config: RateLimitConfig = { maxRequests: 1, windowSeconds: 60 };

    const ok = checkRateLimit(id, config);
    const blocked = checkRateLimit(id, config);

    expect(ok.success).toBe(true);
    expect(blocked.success).toBe(false);
  });
});

describe('getClientIP', () => {
  it('priorise x-forwarded-for et prend la 1ère IP de la liste', () => {
    const headers = new Headers({
      'x-forwarded-for': '203.0.113.7, 70.41.3.18, 150.172.238.178',
      'cf-connecting-ip': '198.51.100.1',
      'x-real-ip': '192.0.2.1',
    });

    expect(getClientIP(headers)).toBe('203.0.113.7');
  });

  it('trim les espaces autour de l\'IP x-forwarded-for', () => {
    const headers = new Headers({ 'x-forwarded-for': '   203.0.113.7   , 70.41.3.18' });
    expect(getClientIP(headers)).toBe('203.0.113.7');
  });

  it('retombe sur cf-connecting-ip si x-forwarded-for absent', () => {
    const headers = new Headers({
      'cf-connecting-ip': '198.51.100.1',
      'x-real-ip': '192.0.2.1',
    });

    expect(getClientIP(headers)).toBe('198.51.100.1');
  });

  it('retombe sur x-real-ip si forwarded-for et cf-connecting-ip absents', () => {
    const headers = new Headers({ 'x-real-ip': '192.0.2.1' });
    expect(getClientIP(headers)).toBe('192.0.2.1');
  });

  it('retourne "unknown" si aucun header d\'IP n\'est présent', () => {
    const headers = new Headers();
    expect(getClientIP(headers)).toBe('unknown');
  });
});

describe('isDevBypass', () => {
  afterEach(() => {
    vi.resetModules();
  });

  it('retourne false quand DEV_BYPASS_TOKEN n\'est pas configuré', () => {
    // Dans l'environnement de test, DEV_BYPASS_TOKEN n'est pas défini.
    const headers = new Headers({ cookie: 'instadeco_dev=whatever' });
    expect(isDevBypass(headers)).toBe(false);
  });

  it('retourne true uniquement quand le cookie correspond au token configuré', async () => {
    // Le token est lu à l'import du module → on configure l'env AVANT un
    // import isolé (resetModules) pour exercer le chemin "token configuré".
    vi.resetModules();
    process.env.DEV_BYPASS_TOKEN = 'secret-dev-token';
    try {
      const mod = await import('@/lib/security/rate-limiter');

      const validCookie = new Headers({ cookie: 'foo=bar; instadeco_dev=secret-dev-token; baz=1' });
      const wrongCookie = new Headers({ cookie: 'instadeco_dev=mauvais-token' });
      const noCookie = new Headers();

      expect(mod.isDevBypass(validCookie)).toBe(true);
      expect(mod.isDevBypass(wrongCookie)).toBe(false);
      expect(mod.isDevBypass(noCookie)).toBe(false);
    } finally {
      delete process.env.DEV_BYPASS_TOKEN;
      vi.resetModules();
    }
  });
});
