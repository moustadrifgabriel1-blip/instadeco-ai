import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Crée un client Supabase pour les Server Components et Server Actions
 * 
 * Usage:
 * ```typescript
 * import { createClient } from '@/lib/supabase/server';
 * 
 * export default async function Page() {
 *   const supabase = createClient();
 *   const { data: profile } = await supabase
 *     .from('profiles')
 *     .select('*')
 *     .eq('id', userId)
 *     .single();
 * }
 * ```
 */
export function createClient() {
  const cookieStore = cookies();

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
export function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role = bypass RLS
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookies().set({ name, value, ...options });
          } catch (error) {
            // Ignore
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookies().set({ name, value: '', ...options });
          } catch (error) {
            // Ignore
          }
        },
      },
    }
  );
}
