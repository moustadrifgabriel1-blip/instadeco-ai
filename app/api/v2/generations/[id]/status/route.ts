import { NextResponse } from 'next/server';
import { z } from 'zod';
import { useCases } from '@/src/infrastructure/config/di-container';
import { GenerationMapper } from '@/src/application/mappers/GenerationMapper';

/**
 * Schéma de validation
 */
const paramsSchema = z.object({
  id: z.string().min(1),
});

const querySchema = z.object({
  userId: z.string().optional(),
});

/**
 * GET /api/v2/generations/[id]/status
 * 
 * Récupère le statut d'une génération via GetGenerationStatusUseCase
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const url = new URL(req.url);
    
    const paramsValidation = paramsSchema.safeParse(params);
    const queryValidation = querySchema.safeParse({
      userId: url.searchParams.get('userId'),
    });

    if (!paramsValidation.success) {
      return NextResponse.json(
        { error: 'ID de génération invalide' },
        { status: 400 }
      );
    }

    const { id } = paramsValidation.data;
    const { userId } = queryValidation.success ? queryValidation.data : { userId: undefined };

    console.log('[StatusAPI] Request for generation:', id);

    // Exécuter le Use Case
    const result = await useCases.getGenerationStatus.execute({
      generationId: id,
      userId,
    });

    if (!result.success) {
      console.error('[StatusAPI] UseCase failed:', result.error);
      return NextResponse.json(
        { error: result.error.message },
        { status: result.error.statusCode }
      );
    }

    // Mapper vers DTO
    const generationDTO = GenerationMapper.toDTO(result.data);

    console.log('[StatusAPI] Returning status:', generationDTO.status, 'hasOutput:', !!generationDTO.outputImageUrl);

    return NextResponse.json({
      generation: generationDTO,
      status: generationDTO.status,
      isComplete: generationDTO.status === 'completed',
      isFailed: generationDTO.status === 'failed',
    });

  } catch (error) {
    console.error('[Generation Status V2] ❌ Erreur:', error);

    return NextResponse.json(
      {
        error: 'Erreur lors de la récupération du statut',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
