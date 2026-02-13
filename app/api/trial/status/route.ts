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

  const FAL_KEY = process.env.FAL_KEY || process.env.FAL_API_KEY;
  if (!FAL_KEY) {
    console.error('[Trial Status] ❌ FAL_KEY manquant');
    return NextResponse.json({ status: 'failed', error: 'Configuration serveur manquante' }, { status: 200 });
  }

  try {
    // ── Méthode 1 : SDK fal.ai ──
    try {
      fal.config({ credentials: FAL_KEY });
      const statusResult = await fal.queue.status(MODEL_PATH, {
        requestId,
        logs: false,
      });

      const sdkStatus = (statusResult?.status || '').toUpperCase();

      if (sdkStatus === 'COMPLETED') {
        try {
          const result = await fal.queue.result(MODEL_PATH, { requestId }) as any;
          const imageUrl = result?.data?.images?.[0]?.url 
            || result?.images?.[0]?.url
            || result?.data?.image?.url;

          if (imageUrl) {
            return NextResponse.json({ status: 'completed', imageUrl });
          }
        } catch (resultError: any) {
          console.error(`[Trial Status] ❌ SDK result fetch failed:`, resultError?.message);
        }
      }

      if (sdkStatus === 'FAILED') {
        const errorMsg = (statusResult as any)?.error || 'La génération a échoué';
        return NextResponse.json({ status: 'failed', error: errorMsg });
      }

      if (['IN_PROGRESS', 'IN_QUEUE', 'QUEUED', 'PENDING'].includes(sdkStatus)) {
        return NextResponse.json({ status: 'processing' });
      }
    } catch (sdkError: any) {
      console.warn(`[Trial Status] ⚠️ SDK failed, trying REST:`, sdkError?.message);
    }

    // ── Méthode 2 : REST API fallback ──
    try {
      const statusUrl = `https://queue.fal.run/${MODEL_PATH}/requests/${requestId}/status`;
      const statusResponse = await fetch(statusUrl, {
        headers: { 'Authorization': `Key ${FAL_KEY}` },
        signal: AbortSignal.timeout(10000),
      });

      if (!statusResponse.ok) {
        // Si fal.ai retourne une erreur, on retourne "processing" pour que le client
        // continue de poller au lieu d'obtenir un 500 qui boucle
        console.warn(`[Trial Status] ⚠️ REST status returned ${statusResponse.status}`);
        return NextResponse.json({ status: 'processing' });
      }

      const statusData = await statusResponse.json();
      const statusCode = (statusData?.status || 'UNKNOWN').toUpperCase();

      if (['COMPLETED', 'SUCCEEDED', 'OK'].includes(statusCode)) {
        let imageUrl = statusData?.images?.[0]?.url || statusData?.response?.images?.[0]?.url;

        if (!imageUrl) {
          const resultUrl = `https://queue.fal.run/${MODEL_PATH}/requests/${requestId}`;
          const resultResponse = await fetch(resultUrl, {
            headers: { 'Authorization': `Key ${FAL_KEY}` },
            signal: AbortSignal.timeout(10000),
          });

          if (resultResponse.ok) {
            const resultData = await resultResponse.json();
            imageUrl = resultData?.images?.[0]?.url || resultData?.image?.url;
          }
        }

        if (imageUrl) {
          return NextResponse.json({ status: 'completed', imageUrl });
        }

        return NextResponse.json({ status: 'failed', error: 'Image introuvable dans le résultat' });
      }

      if (['IN_PROGRESS', 'IN_QUEUE', 'QUEUED', 'PENDING', 'RUNNING', 'STARTING'].includes(statusCode)) {
        return NextResponse.json({ status: 'processing' });
      }

      if (['FAILED', 'ERROR'].includes(statusCode)) {
        return NextResponse.json({ status: 'failed', error: statusData.error || 'La génération a échoué' });
      }

      // Statut inconnu → traiter comme en cours
      return NextResponse.json({ status: 'processing' });
    } catch (restError: any) {
      console.warn(`[Trial Status] ⚠️ REST also failed:`, restError?.message);
      // En cas d'erreur réseau, retourner "processing" pour que le client re-essaie
      return NextResponse.json({ status: 'processing' });
    }
  } catch (error: any) {
    console.error('[Trial Status] ❌ Unhandled error:', error?.message);
    // JAMAIS retourner un 500 — retourner un statut "processing" pour éviter la boucle d'erreurs
    return NextResponse.json({ status: 'processing' });
  }
}
