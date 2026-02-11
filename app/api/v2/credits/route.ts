import { NextResponse } from 'next/server';
import { useCases } from '@/src/infrastructure/config/di-container';
import { requireAuth } from '@/lib/security/api-auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v2/credits
 * 
 * Récupère le solde de crédits de l'utilisateur authentifié via GetUserCreditsUseCase.
 * Le userId est extrait du token JWT — impossible de consulter les crédits d'un autre utilisateur.
 */
export async function GET(req: Request) {
  // ✅ Authentification obligatoire
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const userId = auth.user.id;

  try {
    // Exécuter le Use Case avec l'ID de l'utilisateur authentifié
    const result = await useCases.getUserCredits.execute({ userId });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: result.error.statusCode }
      );
    }

    return NextResponse.json({
      credits: result.data.balance,
      userId,
    });

  } catch (error) {
    console.error('[Credits V2] ❌ Erreur:', error);

    return NextResponse.json(
      { error: 'Erreur lors de la récupération des crédits' },
      { status: 500 }
    );
  }
}
