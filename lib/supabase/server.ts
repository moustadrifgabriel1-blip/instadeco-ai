import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Crée un client Supabase pour les Server Components et Server Actions
 * 
 * Usage:
 * ```typescript
 * import { createClient } from '@/lib/supabase/server';
 * 
 * export default async function Page() {
 *   const supabase = await createClient();
 *   const { data: profile } = await supabase
 *     .from('profiles')
 *     .select('*')
 *     .eq('id', userId)
 *     .single();
 * }
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Ignore errors in Server Components (read-only)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Ignore errors in Server Components (read-only)
          }
        },
      },
    }
  );
}

/**
 * Crée un client Supabase avec le Service Role (admin)
 * ⚠️ DANGER: Bypass Row Level Security
 * 
 * Usage: Uniquement dans les API Routes pour des opérations admin
 * ```typescript
 * import { createAdminClient } from '@/lib/supabase/server';
 * 
 * export async function POST(req: Request) {
 *   const supabase = createAdminClient();
 *   // Peut accéder à toutes les données, ignorer RLS
 * }
 * ```
 */
export async function createAdminClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role = bypass RLS
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Ignore
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Ignore
          }
        },
      },
    }
  );
}

/**
 * Client admin SANS cookies, utilisable dans une page statique/ISR.
 *
 * `createAdminClient` appelle `cookies()`, ce qui bascule toute page qui
 * l'utilise en rendu dynamique : Next impose alors `no-store` et le CDN ne
 * cache plus rien (constaté sur /galerie, x-vercel-cache MISS malgré
 * `revalidate = 300`). La clé service role ignore de toute façon la session,
 * donc les cookies n'apportaient rien ici.
 *
 * À réserver aux lectures publiques pré-rendues. Pour tout ce qui dépend de
 * l'utilisateur connecté, garder `createClient` / `createAdminClient`.
 */
export function createStaticAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
