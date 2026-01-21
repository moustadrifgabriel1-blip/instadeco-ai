import { NextResponse } from 'next/server';
import { z } from 'zod';
import { useCases } from '@/src/infrastructure/config/di-container';
import { GenerationMapper } from '@/src/application/mappers/GenerationMapper';

/**
 * Schéma de validation
 */
const querySchema = z.object({
  userId: z.string().min(1, 'userId requis'),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

/**
 * GET /api/v2/generations
 * 
 * Récupère les générations de l'utilisateur via ListUserGenerationsUseCase
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
    const result = await useCases.listUserGenerations.execute({
      userId,
      limit,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    // Mapper vers DTOs
    const generationsDTO = GenerationMapper.toDTOList(result.data);

    return NextResponse.json({
      generations: generationsDTO,
      total: generationsDTO.length,
    });

  } catch (error) {
    console.error('[Generations V2] ❌ Erreur:', error);

    return NextResponse.json(
      {
        error: 'Erreur lors de la récupération des générations',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
