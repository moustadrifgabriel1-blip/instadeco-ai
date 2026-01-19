import { NextResponse } from 'next/server';
import { addCredits } from '@/lib/firebase/credits';
import { stripe, PRICE_TO_CREDITS, constructWebhookEvent } from '@/lib/payments/stripe';
import type Stripe from 'stripe';

/**
 * POST /api/payments/webhook
 * 
 * Webhook Stripe pour traiter les paiements réussis
 * Événements écoutés :
 * - checkout.session.completed : Session de paiement terminée
 * 
 * Important : Configurer le webhook sur Stripe Dashboard :
 * URL: https://instantdecor-ai.vercel.app/api/payments/webhook
 * Événements : checkout.session.completed
 */
export async function POST(req: Request) {
  try {
    // Récupérer le body brut (nécessaire pour vérifier la signature)
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('[Webhook] ❌ Signature Stripe manquante');
      return NextResponse.json(
        { error: 'Signature manquante' },
        { status: 400 }
      );
    }

    // Vérifier que le secret webhook est configuré
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('[Webhook] ❌ STRIPE_WEBHOOK_SECRET non configuré');
      return NextResponse.json(
        { error: 'Configuration webhook manquante' },
        { status: 500 }
      );
    }

    // Vérifier la signature du webhook
    let event: Stripe.Event;
    try {
      event = constructWebhookEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('[Webhook] ❌ Signature invalide:', err);
      return NextResponse.json(
        { error: 'Signature invalide' },
        { status: 400 }
      );
    }

    console.log('[Webhook] ✅ Événement reçu:', event.type);

    // Traiter les différents types d'événements
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        console.log('[Webhook] 💳 Paiement réussi:', {
          sessionId: session.id,
          customerId: session.customer,
          amount: session.amount_total,
          status: session.payment_status,
        });

        // Vérifier que le paiement est bien payé
        if (session.payment_status !== 'paid') {
          console.warn('[Webhook] ⚠️ Paiement non payé, skip');
          return NextResponse.json({ received: true });
        }

        // Récupérer l'userId depuis client_reference_id (passé dans l'URL Stripe)
        const userId = session.client_reference_id;
        
        if (!userId) {
          console.error('[Webhook] ❌ userId manquant dans client_reference_id');
          return NextResponse.json(
            { error: 'userId manquant' },
            { status: 400 }
          );
        }

        // Récupérer le line_items pour identifier le produit acheté
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
          limit: 1,
        });

        if (!lineItems.data.length) {
          console.error('[Webhook] ❌ Aucun line_item trouvé');
          return NextResponse.json(
            { error: 'Produit non identifié' },
            { status: 400 }
          );
        }

        const priceId = lineItems.data[0].price?.id;
        
        if (!priceId) {
          console.error('[Webhook] ❌ priceId introuvable');
          return NextResponse.json(
            { error: 'Prix non identifié' },
            { status: 400 }
          );
        }

        // Déterminer le nombre de crédits à ajouter
        const credits = PRICE_TO_CREDITS[priceId];

        if (!credits) {
          console.error('[Webhook] ❌ Prix inconnu:', priceId);
          return NextResponse.json(
            { error: 'Prix non reconnu' },
            { status: 400 }
          );
        }

        // Ajouter les crédits au compte utilisateur
        console.log(`[Webhook] ➕ Ajout de ${credits} crédits pour user ${userId}`);
        
        await addCredits(
          userId,
          credits,
          'purchase',
          session.payment_intent as string
        );

        console.log('[Webhook] ✅ Crédits ajoutés avec succès');

        return NextResponse.json({
          received: true,
          userId,
          credits,
        });
      }

      default:
        console.log(`[Webhook] ⚠️ Événement non traité: ${event.type}`);
        return NextResponse.json({ received: true });
    }

  } catch (error) {
    console.error('[Webhook] ❌ Erreur:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur lors du traitement du webhook',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
