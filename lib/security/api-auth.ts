import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

/**
 * Helper d'authentification centralisé pour toutes les API Routes.
 * 
 * Vérifie le token JWT via `supabase.auth.getUser()` (pas getSession)
 * et retourne l'utilisateur authentifié ou une réponse 401.
 * 
 * Usage:
 * ```typescript
 * import { requireAuth } from '@/lib/security/api-auth';
 * 
 * export async function GET(req: Request) {
 *   const auth = await requireAuth();
 *   if (auth.error) return auth.error;
 *   const user = auth.user;
 *   // ...
 * }
 * ```
 */
export async function requireAuth(): Promise<
  | { user: User; error: null }
  | { user: null; error: NextResponse }
> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Non authentifié. Veuillez vous connecter.' },
          { status: 401 }
        ),
      };
    }

    return { user, error: null };
  } catch {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Erreur d\'authentification.' },
        { status: 401 }
      ),
    };
  }
}

/**
 * Vérifie que le webhook provient bien de Fal.ai via un secret partagé.
 */
export function verifyFalWebhookSecret(req: Request): boolean {
  const secret = process.env.FAL_WEBHOOK_SECRET;
  if (!secret) {
    // Si pas de secret configuré, rejeter par défaut en production
    return process.env.NODE_ENV !== 'production';
  }
  const headerSecret = req.headers.get('x-fal-webhook-secret') 
    || req.headers.get('authorization')?.replace('Bearer ', '');
  return headerSecret === secret;
}
