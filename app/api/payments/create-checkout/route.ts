import { NextResponse } from 'next/server';
import { createCheckoutSession, CREDIT_PACKS, type PackId } from '@/lib/payments/stripe';

/**
 * POST /api/payments/create-checkout
 * 
 * Crée une session Stripe Checkout avec les URLs de redirection configurées
 */
export async function POST(req: Request) {
  try {
    const { packId, userId, userEmail } = await req.json();

    if (!packId || !userId) {
      return NextResponse.json(
        { error: 'packId et userId requis' },
        { status: 400 }
      );
    }

    const pack = CREDIT_PACKS[packId as PackId];

    if (!pack) {
      return NextResponse.json(
        { error: 'Pack invalide' },
        { status: 400 }
      );
    }

    // Créer la session Stripe Checkout
    const session = await createCheckoutSession({
      packId: packId as PackId,
      userId,
      userEmail,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('[Create Checkout] ❌ Erreur:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la création de la session',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
