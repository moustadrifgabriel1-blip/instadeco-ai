import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { useCases } from '@/src/infrastructure/config/di-container';

/**
 * POST /api/v2/webhooks/stripe
 * 
 * Gère les webhooks Stripe via ProcessStripeWebhookUseCase
 * 
 * Events gérés:
 * - checkout.session.completed: Achat de crédits ou HD unlock
 */
export async function POST(req: Request) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('[Stripe Webhook V2] ❌ Signature manquante');
      return NextResponse.json(
        { error: 'Signature Stripe manquante' },
        { status: 400 }
      );
    }

    // Exécuter le Use Case
    const result = await useCases.processStripeWebhook.execute({
      payload: body,
      signature,
    });

    if (!result.success) {
      console.error('[Stripe Webhook V2] ❌ Erreur:', result.error.message);
      
      // Pour les webhooks, on retourne 200 même en cas d'erreur métier
      // pour éviter les retries de Stripe sur des erreurs non récupérables
      if (result.error.code === 'WEBHOOK_SIGNATURE_INVALID') {
        return NextResponse.json(
          { error: result.error.message },
          { status: 400 }
        );
      }

      // Log l'erreur mais retourne 200 pour éviter les retries
      return NextResponse.json({
        received: true,
        processed: false,
        error: result.error.message,
      });
    }

    const { eventType, processed, action } = result.data;

    console.log(`[Stripe Webhook V2] ✅ Event ${eventType} traité:`, { processed, action });

    return NextResponse.json({
      received: true,
      processed,
      eventType,
      action,
    });

  } catch (error) {
    console.error('[Stripe Webhook V2] ❌ Erreur non gérée:', error);

    return NextResponse.json(
      {
        error: 'Erreur serveur webhook',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
