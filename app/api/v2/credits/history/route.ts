import { NextResponse } from 'next/server';
import { z } from 'zod';
import { useCases } from '@/src/infrastructure/config/di-container';
import { CreditMapper } from '@/src/application/mappers/CreditMapper';
import { requireAuth } from '@/lib/security/api-auth';

export const dynamic = 'force-dynamic';

/**
 * Schéma de validation (limit uniquement, userId vient du token)
 */
const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(50),
});

/**
 * GET /api/v2/credits/history
 * 
 * Récupère l'historique des transactions de crédits de l'utilisateur authentifié.
 */
export async function GET(req: Request) {
  // ✅ Authentification obligatoire
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const userId = auth.user.id;

  try {
    const url = new URL(req.url);

    const validation = querySchema.safeParse({
      limit: url.searchParams.get('limit'),
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Paramètres invalides', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { limit } = validation.data;

    // Exécuter le Use Case avec l'ID de l'utilisateur authentifié
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
      { error: 'Erreur lors de la récupération de l\'historique' },
      { status: 500 }
    );
  }
}
