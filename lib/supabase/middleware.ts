import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware Next.js pour gérer l'authentification Supabase
 * 
 * Fonctions:
 * 1. Rafraîchit automatiquement le token JWT si expiré
 * 2. Protège les routes authentifiées (/dashboard, /generate)
 * 3. Redirige vers /login si non authentifié
 * 
 * IMPORTANT: Ne doit JAMAIS retourner 5xx sur les pages publiques/SEO.
 * Le middleware skip l'auth pour les pages marketing statiques
 * et wrape tout dans un try-catch pour garantir la disponibilité.
 */

// Pages marketing statiques : aucun besoin de vérifier l'auth.
// Évite des appels Supabase inutiles pour Googlebot & visiteurs non connectés.
const PUBLIC_STATIC_PREFIXES = [
  '/architecte-interieur',
  '/style/',
  '/piece/',
  '/pieces',
  '/deco/',
  '/solution/',
  '/solutions',
  '/exemples',
  '/essai',
  '/galerie',
  '/a-propos',
  '/legal/',
  '/blog',
  '/pro',
  '/pricing',
  '/quiz',
  '/styles',
  '/tiktok-generator',
];

function isPublicStaticPage(pathname: string): boolean {
  // Homepage
  if (pathname === '/') return true;
  return PUBLIC_STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;

  // ── Pages marketing/statiques : passer directement sans appeler Supabase ──
  // Cela évite les erreurs 5xx si Supabase est temporairement lent/indisponible
  // quand Googlebot crawle les pages SEO.
  if (isPublicStaticPage(pathname)) {
    return response;
  }

  // ── Routes nécessitant l'auth : wrap dans try-catch ──
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value,
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    // Rafraîchir la session (refresh token si expiré)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Routes protégées
    const protectedPaths = ['/dashboard', '/generate', '/projects'];
    const isProtectedPath = protectedPaths.some((path) =>
      pathname.startsWith(path)
    );

    // Rediriger vers /login si non authentifié sur route protégée
    if (isProtectedPath && !user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Rediriger vers /dashboard si déjà authentifié sur /login ou /signup
    if (
      user &&
      (pathname === '/login' || pathname === '/signup')
    ) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } catch (error) {
    // En cas d'erreur Supabase (timeout, réseau, etc.)
    // Ne JAMAIS bloquer la page — on laisse passer la requête.
    console.error('[Middleware] Auth error (non-blocking):', error);

    // Si c'est une route protégée et l'auth a échoué, redirect login par sécurité
    const protectedPaths = ['/dashboard', '/generate', '/projects'];
    const isProtectedPath = protectedPaths.some((path) =>
      pathname.startsWith(path)
    );
    if (isProtectedPath) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return response;
}
