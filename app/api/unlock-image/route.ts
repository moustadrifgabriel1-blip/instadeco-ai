import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

/**
 * POST /api/unlock-image
 * 
 * Crée une session Stripe Checkout pour débloquer une image en HD (sans filigrane)
 * Prix: 4,99€ par image
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { generationId, userId } = body;

    if (!generationId) {
      return NextResponse.json(
        { error: 'generationId requis' },
        { status: 400 }
      );
    }

    // URL de base
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://instadeco.app';

    // Créer une session Stripe Checkout pour l'achat unique
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Image HD sans filigrane',
              description: 'Téléchargement de votre design en haute définition, sans filigrane',
              images: ['https://instadeco.app/images/hd-download.png'],
            },
            unit_amount: 499, // 4,99€ en centimes
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'hd_unlock',
        generationId,
        userId: userId || 'anonymous',
      },
      success_url: `${baseUrl}/download-hd?session_id={CHECKOUT_SESSION_ID}&generation_id=${generationId}`,
      cancel_url: `${baseUrl}/generate?cancelled=true`,
    });

    console.log(`[Unlock HD] Session créée: ${session.id} pour generation: ${generationId}`);

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });

  } catch (error) {
    console.error('[Unlock HD] Erreur:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la création du paiement',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
