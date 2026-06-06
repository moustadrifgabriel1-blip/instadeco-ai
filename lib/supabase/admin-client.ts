import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from '@supabase/supabase-js';

let instance: SupabaseClient | null = null;

/**
 * Admin Supabase client (lazy). Avoids top-level createClient during Next.js
 * build when env vars may be unavailable; throws on first use if misconfigured.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (instance) return instance;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for Supabase admin client.'
    );
  }
  instance = createSupabaseClient(url, key);
  return instance;
}

/** Same client as {@link getSupabaseAdmin}; property access initializes lazily. */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabaseAdmin();
    const value = Reflect.get(client as object, prop, receiver);
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
});
