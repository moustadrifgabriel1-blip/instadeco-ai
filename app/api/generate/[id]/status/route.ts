import { NextResponse } from 'next/server';
import { checkGenerationStatus, getGenerationResult } from '@/lib/ai/fal-client';

/**
 * GET /api/generate/[id]/status
 * 
 * Vérifie le statut d'une génération en cours via polling.
 * Retourne l'URL de l'image générée quand la génération est terminée.
 * 
 * Params:
 * - id: string (requestId retourné par POST /api/generate)
 * 
 * Response:
 * - status: 'in_queue' | 'in_progress' | 'completed' | 'failed'
 * - progress?: number (0-100)
 * - outputImageUrl?: string (URL de l'image générée si completed)
 * - error?: string (message d'erreur si failed)
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const requestId = params.id;

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID manquant' },
        { status: 400 }
      );
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      console.error('[Status] REPLICATE_API_TOKEN non configurée');
      return NextResponse.json(
        { error: 'Configuration serveur manquante (REPLICATE_API_TOKEN)' },
        { status: 500 }
      );
    }

    console.log('[Status] Vérification du statut pour:', requestId);

    // Vérifier le statut via le client Fal.ai
    const statusData = await checkGenerationStatus(requestId);

    // Mapper les statuts Fal.ai vers nos statuts internes
    const statusMap: Record<string, string> = {
      'IN_QUEUE': 'in_queue',
      'IN_PROGRESS': 'in_progress',
      'COMPLETED': 'completed',
      'FAILED': 'failed',
    };

    const status = statusMap[statusData.status] || statusData.status.toLowerCase();

    // Si la génération est terminée, récupérer le résultat
    if (statusData.status === 'COMPLETED') {
      const resultData = await getGenerationResult(requestId);

      console.log('[Status] Génération terminée. Image:', resultData.images?.[0]?.url);

      return NextResponse.json({
        status: 'completed',
        progress: 100,
        outputImageUrl: resultData.images?.[0]?.url,
        width: resultData.images?.[0]?.width,
        height: resultData.images?.[0]?.height,
        generationTime: resultData.timings?.inference,
        seed: resultData.seed,
      });
    }

    // Si la génération a échoué
    if (statusData.status === 'FAILED') {
      console.error('[Status] Génération échouée:', statusData.error);
      
      return NextResponse.json({
        status: 'failed',
        error: statusData.error || 'La génération a échoué',
      });
    }

    // Sinon, retourner le statut actuel avec progression estimée
    // Fal.ai ne fournit pas toujours de progression, on estime
    let estimatedProgress = statusData.progress || 0;
    if (statusData.status === 'IN_QUEUE') {
      estimatedProgress = 10;
    } else if (statusData.status === 'IN_PROGRESS' && !statusData.progress) {
      estimatedProgress = 50;
    }

    return NextResponse.json({
      status,
      progress: Math.min(estimatedProgress, 95), // Max 95% jusqu'à completion
    });

  } catch (error) {
    console.error('[Status] Erreur:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la vérification du statut',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
