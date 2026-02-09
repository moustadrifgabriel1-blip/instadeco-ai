import { NextResponse } from 'next/server';
import { z } from 'zod';
import { useCases } from '@/src/infrastructure/config/di-container';
import { GenerationMapper } from '@/src/application/mappers/GenerationMapper';
import { sendGenerationCompleteEmail } from '@/lib/notifications/marketing-emails';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

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

    // Envoyer email post-génération si la génération vient de se terminer
    // On détecte ça en vérifiant si le status est completed ET si updatedAt est récent (<30s)
    if (generationDTO.status === 'completed' && generationDTO.outputImageUrl) {
      const updatedAt = new Date(result.data.updatedAt || Date.now());
      const isJustCompleted = (Date.now() - updatedAt.getTime()) < 30_000;
      
      if (isJustCompleted && result.data.userId) {
        // Envoyer en arrière-plan (ne bloque pas la réponse)
        sendPostGenerationEmail(
          result.data.userId,
          result.data.styleSlug || 'modern',
          result.data.roomType || 'living_room',
        ).catch((err) => {
          console.error('[StatusAPI] Post-generation email failed:', err);
        });
      }
    }

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

/**
 * Récupère le profil utilisateur et envoie l'email post-génération
 */
async function sendPostGenerationEmail(
  userId: string,
  style: string,
  roomType: string,
): Promise<void> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return;
  }

  const supabaseAdmin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('email, full_name, referral_code')
    .eq('id', userId)
    .single();

  if (!profile?.email) return;

  await sendGenerationCompleteEmail(
    profile.email,
    profile.full_name,
    style,
    roomType,
    profile.referral_code || null,
  );
}
