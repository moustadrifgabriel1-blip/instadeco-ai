import { createBrowserClient } from '@supabase/ssr';

/**
 * Crée un client Supabase pour les Client Components
 * 
 * Usage:
 * ```typescript
 * 'use client';
 * 
 * import { createClient } from '@/lib/supabase/client';
 * 
 * export function MyComponent() {
 *   const supabase = createClient();
 *   
 *   useEffect(() => {
 *     const channel = supabase
 *       .channel('generations')
 *       .on('postgres_changes', {
 *         event: 'UPDATE',
 *         schema: 'public',
 *         table: 'generations',
 *       }, (payload) => {
 *         console.log('Change:', payload);
 *       })
 *       .subscribe();
 *     
 *     return () => {
 *       supabase.removeChannel(channel);
 *     };
 *   }, []);
 * }
 * ```
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
