import { NextResponse } from 'next/server';
import { z } from 'zod';
import { useCases } from '@/src/infrastructure/config/di-container';
import { CreditMapper } from '@/src/application/mappers/CreditMapper';

/**
 * Schéma de validation
 */
const querySchema = z.object({
  userId: z.string().min(1, 'userId requis'),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
});

/**
 * GET /api/v2/credits/history
 * 
 * Récupère l'historique des transactions de crédits via GetCreditHistoryUseCase
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const validation = querySchema.safeParse({
      userId: url.searchParams.get('userId'),
      limit: url.searchParams.get('limit'),
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

    const { userId, limit } = validation.data;

    // Exécuter le Use Case
    const result = await useCases.getCreditHistory.execute({ userId, limit });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: result.error.statusCode }
      );
    }

    // Mapper vers DTOs
    const transactionsDTO = CreditMapper.toDTOList(result.data);

    return NextResponse.json({
      transactions: transactionsDTO,
      total: transactionsDTO.length,
    });

  } catch (error) {
    console.error('[Credits History V2] ❌ Erreur:', error);

    return NextResponse.json(
      {
        error: 'Erreur lors de la récupération de l\'historique',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
