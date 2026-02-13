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

  console.log(`[Trial Status] 📡 Checking status for: ${requestId}`);

  try {
    const FAL_KEY = process.env.FAL_KEY || process.env.FAL_API_KEY;
    if (!FAL_KEY) {
      console.error('[Trial Status] ❌ FAL_KEY manquant dans les variables d\'environnement');
      return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 });
    }

    // ── Méthode 1 : SDK fal.ai (plus fiable) ──
    try {
      fal.config({ credentials: FAL_KEY });
      const statusResult = await fal.queue.status(MODEL_PATH, {
        requestId,
        logs: true,
      });

      console.log(`[Trial Status] 📊 SDK status:`, JSON.stringify({
        status: statusResult?.status,
        requestId,
      }));

      const sdkStatus = (statusResult?.status || '').toUpperCase();

      if (sdkStatus === 'COMPLETED') {
        // Récupérer le résultat
        console.log(`[Trial Status] ✅ Completed, fetching result...`);
        try {
          const result = await fal.queue.result(MODEL_PATH, { requestId }) as any;
          const imageUrl = result?.data?.images?.[0]?.url 
            || result?.images?.[0]?.url
            || result?.data?.image?.url;
          
          console.log(`[Trial Status] 🖼️ Image URL found: ${imageUrl ? 'YES' : 'NO'}`, 
            imageUrl ? imageUrl.substring(0, 80) + '...' : 'null');

          if (imageUrl) {
            return NextResponse.json({ status: 'completed', imageUrl });
          }

          // Fallback: essayer la méthode REST
          console.warn(`[Trial Status] ⚠️ SDK result missing image, trying REST fallback...`);
        } catch (resultError: any) {
          console.error(`[Trial Status] ❌ SDK result fetch failed:`, resultError?.message);
        }
      }

      if (sdkStatus === 'FAILED') {
        const errorMsg = (statusResult as any)?.error || 'La génération a échoué';
        console.error(`[Trial Status] ❌ Generation failed:`, errorMsg);
        return NextResponse.json({ status: 'failed', error: errorMsg });
      }

      if (['IN_PROGRESS', 'IN_QUEUE', 'QUEUED', 'PENDING'].includes(sdkStatus)) {
        console.log(`[Trial Status] ⏳ Still processing: ${sdkStatus}`);
        return NextResponse.json({ status: 'processing' });
      }
    } catch (sdkError: any) {
      console.warn(`[Trial Status] ⚠️ SDK method failed, falling back to REST:`, sdkError?.message);
    }

    // ── Méthode 2 : REST API fallback ──
    const statusUrl = `https://queue.fal.run/${MODEL_PATH}/requests/${requestId}/status`;
    console.log(`[Trial Status] 🔄 REST fallback: ${statusUrl}`);
    
    const statusResponse = await fetch(statusUrl, {
      headers: { 'Authorization': `Key ${FAL_KEY}` },
    });

    console.log(`[Trial Status] 📡 REST status response: ${statusResponse.status}`);

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text().catch(() => 'unknown');
      console.error(`[Trial Status] ❌ REST status failed: ${statusResponse.status} - ${errorText}`);
      return NextResponse.json({ 
        error: 'Impossible de vérifier le statut',
        detail: `fal.ai returned ${statusResponse.status}`,
      }, { status: 500 });
    }

    const statusData = await statusResponse.json();
    const statusCode = (statusData?.status || 'UNKNOWN').toUpperCase();
    console.log(`[Trial Status] 📊 REST status: ${statusCode}`, JSON.stringify(statusData).substring(0, 200));

    // Terminé
    if (['COMPLETED', 'SUCCEEDED', 'OK'].includes(statusCode)) {
      let imageUrl = statusData?.images?.[0]?.url || statusData?.response?.images?.[0]?.url;

      if (!imageUrl) {
        console.log(`[Trial Status] 🔍 Image not in status response, fetching full result...`);
        const resultUrl = `https://queue.fal.run/${MODEL_PATH}/requests/${requestId}`;
        const resultResponse = await fetch(resultUrl, {
          headers: { 'Authorization': `Key ${FAL_KEY}` },
        });

        console.log(`[Trial Status] 📡 REST result response: ${resultResponse.status}`);

        if (resultResponse.ok) {
          const resultData = await resultResponse.json();
          imageUrl = resultData?.images?.[0]?.url || resultData?.image?.url;
          console.log(`[Trial Status] 🖼️ REST result image: ${imageUrl ? imageUrl.substring(0, 80) + '...' : 'NOT FOUND'}`,
            `Keys: ${Object.keys(resultData).join(', ')}`);
        } else {
          const errText = await resultResponse.text().catch(() => '');
          console.error(`[Trial Status] ❌ REST result failed: ${resultResponse.status} - ${errText}`);
        }
      }

      if (imageUrl) {
        console.log(`[Trial Status] ✅ Returning completed with image`);
        return NextResponse.json({ status: 'completed', imageUrl });
      }

      console.error(`[Trial Status] ❌ Completed but no image found in any response`);
      return NextResponse.json({ error: 'Image introuvable dans le résultat' }, { status: 500 });
    }

    // En cours
    if (['IN_PROGRESS', 'IN_QUEUE', 'QUEUED', 'PENDING', 'RUNNING', 'STARTING'].includes(statusCode)) {
      return NextResponse.json({ status: 'processing' });
    }

    // Échoué
    if (['FAILED', 'ERROR'].includes(statusCode)) {
      console.error(`[Trial Status] ❌ Failed:`, statusData.error || statusData);
      return NextResponse.json({
        status: 'failed',
        error: statusData.error || 'La génération a échoué',
      });
    }

    // Statut inconnu → traiter comme en cours
    console.warn(`[Trial Status] ❓ Unknown status: ${statusCode}`, JSON.stringify(statusData).substring(0, 300));
    return NextResponse.json({ status: 'processing' });
  } catch (error: any) {
    console.error('[Trial Status] ❌ Unhandled error:', error?.message || error, error?.stack?.split('\n').slice(0, 3).join(' | '));
    return NextResponse.json({ error: 'Erreur serveur', detail: error?.message }, { status: 500 });
  }
}
