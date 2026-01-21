import { NextResponse } from 'next/server';
import { z } from 'zod';
import { useCases } from '@/src/infrastructure/config/di-container';
import { CreditMapper } from '@/src/application/mappers/CreditMapper';

/**
 * Schéma de validation
 */
const querySchema = z.object({
  userId: z.string().min(1, 'userId requis'),
});

/**
 * GET /api/v2/credits
 * 
 * Récupère le solde de crédits de l'utilisateur via GetUserCreditsUseCase
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const validation = querySchema.safeParse({
      userId: url.searchParams.get('userId'),
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Paramètres invalides',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { userId } = validation.data;

    // Exécuter le Use Case
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
      {
        error: 'Erreur lors de la récupération des crédits',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
