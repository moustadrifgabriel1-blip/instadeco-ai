import { NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

const MODEL_PATH = 'fal-ai/flux-general/image-to-image';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/trial/status?requestId=xxx
 * 
 * Polling du statut de génération fal.ai pour l'essai gratuit.
 * Pas d'auth requise, mais le requestId doit être valide.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const requestId = searchParams.get('requestId');

  if (!requestId) {
    return NextResponse.json({ error: 'requestId manquant' }, { status: 400 });
  }

  try {
    const FAL_KEY = process.env.FAL_KEY || process.env.FAL_API_KEY;
    if (!FAL_KEY) {
      return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 });
    }

    // Check status via REST API
    const statusUrl = `https://queue.fal.run/${MODEL_PATH}/requests/${requestId}/status`;
    const statusResponse = await fetch(statusUrl, {
      headers: { 'Authorization': `Key ${FAL_KEY}` },
    });

    if (!statusResponse.ok) {
      console.error('[Trial Status] Status request failed:', statusResponse.status);
      return NextResponse.json({ error: 'Impossible de vérifier le statut' }, { status: 500 });
    }

    const statusData = await statusResponse.json();
    const statusCode = (statusData?.status || 'UNKNOWN').toUpperCase();

    // Terminé
    if (['COMPLETED', 'SUCCEEDED', 'OK'].includes(statusCode)) {
      // Chercher l'image dans la réponse de status
      let imageUrl = statusData?.images?.[0]?.url || statusData?.response?.images?.[0]?.url;

      // Sinon, fetch le résultat
      if (!imageUrl) {
        const resultUrl = `https://queue.fal.run/${MODEL_PATH}/requests/${requestId}`;
        const resultResponse = await fetch(resultUrl, {
          headers: { 'Authorization': `Key ${FAL_KEY}` },
        });

        if (resultResponse.ok) {
          const resultData = await resultResponse.json();
          imageUrl = resultData?.images?.[0]?.url || resultData?.image?.url;
        }
      }

      if (imageUrl) {
        return NextResponse.json({
          status: 'completed',
          imageUrl,
        });
      }

      return NextResponse.json({ error: 'Image introuvable dans le résultat' }, { status: 500 });
    }

    // En cours
    if (['IN_PROGRESS', 'IN_QUEUE', 'QUEUED', 'PENDING', 'RUNNING', 'STARTING'].includes(statusCode)) {
      return NextResponse.json({ status: 'processing' });
    }

    // Échoué
    if (['FAILED', 'ERROR'].includes(statusCode)) {
      return NextResponse.json({
        status: 'failed',
        error: statusData.error || 'La génération a échoué',
      });
    }

    // Autre
    return NextResponse.json({ status: 'processing' });
  } catch (error: any) {
    console.error('[Trial Status] Error:', error?.message || error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
