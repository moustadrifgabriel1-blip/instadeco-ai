import { NextResponse } from 'next/server';
import { z } from 'zod';
import { useCases } from '@/src/infrastructure/config/di-container';

/**
 * Schéma de validation pour la confirmation HD
 */
const confirmHDSchema = z.object({
  sessionId: z.string().min(1, 'sessionId requis'),
  generationId: z.string().min(1, 'generationId requis'),
});

/**
 * POST /api/v2/hd-unlock/confirm
 * 
 * Confirme le déblocage HD après paiement via ConfirmHDUnlockUseCase
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validation avec Zod
    const validation = confirmHDSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation échouée',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { sessionId, generationId } = validation.data;

    // Exécuter le Use Case
    const result = await useCases.confirmHDUnlock.execute({
      sessionId,
      generationId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: result.error.statusCode }
      );
    }

    const { imageUrl, downloadUrl } = result.data;

    return NextResponse.json({
      success: true,
      generationId,
      imageUrl,
      downloadUrl,
      message: 'Image HD débloquée avec succès',
    });

  } catch (error) {
    console.error('[HD Confirm V2] ❌ Erreur:', error);

    return NextResponse.json(
      {
        error: 'Erreur lors de la confirmation HD',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
