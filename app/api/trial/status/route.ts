import { NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

const MODEL_PATH = 'fal-ai/flux-general/image-to-image';
// Path de la queue fal.ai (sans le suffixe /image-to-image)
const QUEUE_BASE_PATH = 'fal-ai/flux-general';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Cache de requêtes pour détecter les boucles infinies
const requestCache = new Map<string, { count: number; firstSeen: number }>();

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

  // Détecter les boucles infinies (> 50 polls = 2min30)
  const cacheKey = requestId;
  const cached = requestCache.get(cacheKey);
  const now = Date.now();
  
  if (cached) {
    cached.count++;
    // Si > 50 polls ou > 3min, forcer l'échec
    if (cached.count > 50 || (now - cached.firstSeen) > 180000) {
      console.error(`[Trial Status] ⏰ Timeout: requestId=${requestId} polled ${cached.count} times over ${Math.floor((now - cached.firstSeen) / 1000)}s`);
      requestCache.delete(cacheKey);
      return NextResponse.json({ 
        status: 'failed', 
        error: 'La génération a pris trop de temps. Veuillez réessayer.' 
      });
    }
  } else {
    requestCache.set(cacheKey, { count: 1, firstSeen: now });
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
          console.log(`[Trial Status] 📦 SDK result keys:`, Object.keys(result || {}), 'data keys:', Object.keys(result?.data || {}));
          const imageUrl = result?.data?.images?.[0]?.url 
            || result?.images?.[0]?.url
            || result?.data?.image?.url;

          if (imageUrl) {
            console.log(`[Trial Status] ✅ Image ready: ${imageUrl.substring(0, 50)}...`);
            requestCache.delete(cacheKey);
            return NextResponse.json({ status: 'completed', imageUrl });
          } else {
            console.error(`[Trial Status] ⚠️ Status=COMPLETED but no image URL in result:`, JSON.stringify(result).substring(0, 500));
            requestCache.delete(cacheKey);
            return NextResponse.json({ status: 'failed', error: 'Image introuvable dans le résultat' });
          }
        } catch (resultError: any) {
          console.error(`[Trial Status] ❌ SDK result fetch failed:`, resultError?.message, resultError?.body || resultError?.status);
          
          // Fallback REST pour récupérer le résultat
          try {
            const resultUrl = `https://queue.fal.run/${QUEUE_BASE_PATH}/requests/${requestId}`;
            const resultResponse = await fetch(resultUrl, {
              headers: { 'Authorization': `Key ${FAL_KEY}` },
              signal: AbortSignal.timeout(15000),
            });
            if (resultResponse.ok) {
              const resultData = await resultResponse.json();
              const imageUrl = resultData?.images?.[0]?.url || resultData?.output?.images?.[0]?.url;
              if (imageUrl) {
                console.log(`[Trial Status] ✅ REST fallback got image: ${imageUrl.substring(0, 50)}...`);
                requestCache.delete(cacheKey);
                return NextResponse.json({ status: 'completed', imageUrl });
              }
            }
            console.error(`[Trial Status] ❌ REST fallback also failed:`, resultResponse.status);
          } catch (restErr: any) {
            console.error(`[Trial Status] ❌ REST fallback error:`, restErr?.message);
          }
          
          requestCache.delete(cacheKey);
          return NextResponse.json({ status: 'failed', error: 'Erreur lors de la récupération du résultat' });
        }
      }

      if (sdkStatus === 'FAILED') {
        const errorMsg = (statusResult as any)?.error || 'La génération a échoué';
        console.error(`[Trial Status] ❌ Generation failed:`, errorMsg);
        requestCache.delete(cacheKey);
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
      const statusUrl = `https://queue.fal.run/${QUEUE_BASE_PATH}/requests/${requestId}/status`;
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
          const resultUrl = `https://queue.fal.run/${QUEUE_BASE_PATH}/requests/${requestId}`;
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
          console.log(`[Trial Status] ✅ Image ready (REST): ${imageUrl.substring(0, 50)}...`);
          requestCache.delete(cacheKey);
          return NextResponse.json({ status: 'completed', imageUrl });
        }

        console.error(`[Trial Status] ⚠️ REST: Status completed but no image URL`);
        requestCache.delete(cacheKey);
        return NextResponse.json({ status: 'failed', error: 'Image introuvable dans le résultat' });
      }

      if (['IN_PROGRESS', 'IN_QUEUE', 'QUEUED', 'PENDING', 'RUNNING', 'STARTING'].includes(statusCode)) {
        return NextResponse.json({ status: 'processing' });
      }

      if (['FAILED', 'ERROR'].includes(statusCode)) {
        console.error(`[Trial Status] ❌ Generation failed (REST):`, statusData.error);
        requestCache.delete(cacheKey);
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
