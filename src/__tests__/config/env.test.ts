/**
 * Tests de la validation Zod des variables d'environnement (fail-fast au boot).
 *
 * getEnv() met en cache son résultat au niveau module → on utilise
 * vi.resetModules() + import dynamique pour repartir d'un état propre à chaque cas.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const VALID_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  FAL_KEY: 'fal-key',
  STRIPE_SECRET_KEY: 'sk_test_xxx',
  STRIPE_WEBHOOK_SECRET: 'whsec_test',
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_xxx',
};

describe('getEnv (validation env vars)', () => {
  const snapshot = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    Object.assign(process.env, VALID_ENV);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = { ...snapshot };
    vi.restoreAllMocks();
  });

  it('réussit et retourne les valeurs quand toutes les variables sont valides', async () => {
    const { getEnv } = await import('@/src/infrastructure/config/env');
    const env = getEnv();
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://test.supabase.co');
    expect(env.FAL_KEY).toBe('fal-key');
  });

  it('throw si une variable requise est absente', async () => {
    delete (process.env as Record<string, string | undefined>).SUPABASE_SERVICE_ROLE_KEY;
    const { getEnv } = await import('@/src/infrastructure/config/env');
    expect(() => getEnv()).toThrow(/Invalid environment variables/);
  });

  it('throw si une URL Supabase est malformée', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'pas-une-url';
    const { getEnv } = await import('@/src/infrastructure/config/env');
    expect(() => getEnv()).toThrow(/Invalid environment variables/);
  });

  it('throw si la clé Stripe n\'a pas le bon préfixe', async () => {
    process.env.STRIPE_SECRET_KEY = 'wrong_prefix';
    const { getEnv } = await import('@/src/infrastructure/config/env');
    expect(() => getEnv()).toThrow(/Invalid environment variables/);
  });

  it('met en cache : un second appel ne re-valide pas', async () => {
    const { getEnv } = await import('@/src/infrastructure/config/env');
    const first = getEnv();
    // Même après avoir cassé l'env, le cache renvoie la valeur initiale
    delete (process.env as Record<string, string | undefined>).FAL_KEY;
    const second = getEnv();
    expect(second).toBe(first);
  });
});
