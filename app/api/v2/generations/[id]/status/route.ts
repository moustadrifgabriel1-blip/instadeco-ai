import { NextResponse } from 'next/server';
import { z } from 'zod';
import { useCases } from '@/src/infrastructure/config/di-container';
import { GenerationMapper } from '@/src/application/mappers/GenerationMapper';
import { createClient } from '@/lib/supabase/server';

/**
 * Schéma de validation
 */
const paramsSchema = z.object({
  id: z.string().min(1),
});

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

/**
 * GET /api/v2/generations/[id]/status
 * 
 * Récupère le statut d'une génération via GetGenerationStatusUseCase
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔒 Authentification serveur
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    
    const paramsValidation = paramsSchema.safeParse(resolvedParams);

    if (!paramsValidation.success) {
      return NextResponse.json(
        { error: 'ID de génération invalide' },
        { status: 400 }
      );
    }

    const { id } = paramsValidation.data;
    // Utiliser le userId de la session pour vérifier la propriété
    const userId = user.id;

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

    // NB : l'email post-génération est envoyé par POST /api/v2/generate au
    // moment exact du passage à 'completed' (une seule fois). Ne PAS le renvoyer
    // ici : le polling toutes les 3s provoquerait des envois multiples.

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
