/**
 * Middleware: Cron Security
 * 
 * Utilitaires pour sécuriser les endpoints cron.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Vérifie que la requête provient d'un cron job autorisé
 */
export function verifyCronAuth(request: NextRequest): {
  authorized: boolean;
  error?: string;
} {
  const cronSecret = process.env.CRON_SECRET;

  // Vérifier que le secret est configuré
  if (!cronSecret) {
    console.error('CRON_SECRET non configuré dans les variables d\'environnement');
    return {
      authorized: false,
      error: 'Configuration serveur invalide',
    };
  }

  // Méthode 1: Header Authorization (utilisé par Vercel Cron)
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${cronSecret}`) {
    return { authorized: true };
  }

  // Méthode 2: Header x-cron-secret (alternative)
  const cronHeader = request.headers.get('x-cron-secret');
  if (cronHeader === cronSecret) {
    return { authorized: true };
  }

  // Méthode 3: Query param (pour tests locaux uniquement)
  if (process.env.NODE_ENV === 'development') {
    const url = new URL(request.url);
    const secretParam = url.searchParams.get('secret');
    if (secretParam === cronSecret) {
      return { authorized: true };
    }
  }

  return {
    authorized: false,
    error: 'Non autorisé',
  };
}

/**
 * Crée une réponse d'erreur d'authentification
 */
export function unauthorizedResponse(message?: string): NextResponse {
  return NextResponse.json(
    { 
      success: false, 
      error: message || 'Non autorisé',
      timestamp: new Date().toISOString(),
    },
    { status: 401 }
  );
}

/**
 * Wrapper pour protéger un handler cron
 */
export function withCronAuth(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const { authorized, error } = verifyCronAuth(request);
    
    if (!authorized) {
      console.warn(`Cron: Tentative d'accès non autorisée depuis ${request.headers.get('x-forwarded-for') || 'unknown'}`);
      return unauthorizedResponse(error);
    }

    return handler(request);
  };
}

/**
 * Génère un secret cron aléatoire (pour le setup initial)
 */
export function generateCronSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
