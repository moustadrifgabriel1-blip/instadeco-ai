import { NextResponse } from 'next/server';
import { useCases } from '@/src/infrastructure/config/di-container';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * POST /api/v2/webhooks/fal
 * 
 * Webhook appelé par Fal.ai quand un job se termine.
 * Vérifie le secret partagé avant de traiter.
 */
export async function POST(req: Request) {
  try {
    // ✅ Vérification du secret partagé Fal.ai
    const expectedSecret = process.env.FAL_WEBHOOK_SECRET;

    if (!expectedSecret) {
      console.error('[Fal Webhook] FAL_WEBHOOK_SECRET non configuré');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    // Ne jamais accepter le secret via query string (fuite dans les logs)
    const webhookSecret = req.headers.get('x-fal-webhook-secret');

    if (webhookSecret !== expectedSecret) {
      console.warn('[Fal Webhook] ⚠️ Unauthorized webhook attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    console.log('[Fal Webhook] 📬 Received webhook:', {
      request_id: body.request_id,
      status: body.status,
      hasImages: !!body.payload?.images?.length,
    });

    const requestId = body.request_id;
    
    if (!requestId) {
      console.warn('[Fal Webhook] ⚠️ No request_id in webhook payload');
      return NextResponse.json({ error: 'Missing request_id' }, { status: 400 });
    }

    // Le status peut être "OK", "COMPLETED", "SUCCEEDED", "FAILED", "ERROR"
    const status = (body.status || '').toUpperCase();
    const payload = body.payload || body;
    
    if (status === 'FAILED' || status === 'ERROR') {
      console.error('[Fal Webhook] ❌ Job failed:', requestId, body.error || 'Unknown error');
      // On ne peut pas directement update ici car on a le request_id, pas le generation_id
      // Le polling s'en chargera via GetGenerationStatusUseCase
      return NextResponse.json({ received: true, status: 'noted_failure' });
    }

    // Si la génération est réussie, le polling la détectera via checkStatus
    // Le webhook sert de "notification" - le vrai traitement se fait dans GetGenerationStatusUseCase
    console.log('[Fal Webhook] ✅ Job completed notification received for:', requestId);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Fal Webhook] ❌ Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
