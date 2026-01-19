import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Routes protégées qui nécessitent une authentification
  const protectedRoutes = ['/demo', '/dashboard', '/generate', '/credits'];
  const authRoutes = ['/login', '/signup'];
  
  const { pathname } = request.nextUrl;
  
  // Vérifier si la route actuelle est protégée
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  // Récupérer le cookie de session Firebase (si disponible)
  // Note: Firebase Auth utilise le stockage local, pas les cookies par défaut
  // Cette vérification est simplifiée - la vraie vérification se fait côté client
  
  if (isProtectedRoute) {
    // Pour le moment, on ne peut pas vérifier l'authentification côté serveur
    // sans Firebase Admin SDK configuré.
    // La protection réelle se fera côté client via useAuth hook
    
    // TODO: Implémenter la vérification côté serveur avec Firebase Admin SDK
    // pour une vraie protection
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
