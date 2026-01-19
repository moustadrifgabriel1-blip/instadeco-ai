import { NextResponse } from 'next/server';
import { stripe } from '@/lib/payments/stripe';
import { adminDb } from '@/lib/firebase/admin';
import type Stripe from 'stripe';

// Prix HD Unlock (à créer dans Stripe Dashboard)
const HD_UNLOCK_PRICE_ID = process.env.STRIPE_PRICE_HD_UNLOCK || '';
const HD_UNLOCK_PRICE_EUR = 4.99;

/**
 * POST /api/hd-unlock/create-checkout
 * 
 * Crée une session Stripe Checkout pour débloquer l'image HD sans filigrane
 */
export async function POST(req: Request) {
  try {
    const { generationId, userId, userEmail } = await req.json();

    if (!generationId || !userId) {
      return NextResponse.json(
        { error: 'generationId et userId requis' },
        { status: 400 }
      );
    }

    // Vérifier que la génération existe et appartient à l'utilisateur
    const generationDoc = await adminDb.collection('generations').doc(generationId).get();

    if (!generationDoc.exists) {
      return NextResponse.json(
        { error: 'Génération non trouvée' },
        { status: 404 }
      );
    }

    const generation = generationDoc.data();

    if (generation?.userId !== userId) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // Vérifier si déjà débloqué
    if (generation?.hdUnlocked) {
      return NextResponse.json(
        { error: 'Image déjà débloquée', alreadyUnlocked: true },
        { status: 400 }
      );
    }

    // Vérifier que l'image est disponible
    if (!generation?.outputImageUrl || generation.status !== 'completed') {
      return NextResponse.json(
        { error: 'Image non disponible' },
        { status: 400 }
      );
    }

    // Créer la session Stripe Checkout
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://instadeco.app';
    
    // Si pas de prix ID configuré, créer un checkout avec prix inline
    let sessionConfig: Stripe.Checkout.SessionCreateParams;
    
    if (HD_UNLOCK_PRICE_ID) {
      sessionConfig = {
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price: HD_UNLOCK_PRICE_ID,
            quantity: 1,
          },
        ],
        client_reference_id: userId,
        customer_email: userEmail,
        success_url: `${appUrl}/hd-success?session_id={CHECKOUT_SESSION_ID}&generation_id=${generationId}`,
        cancel_url: `${appUrl}/dashboard?canceled=true`,
        metadata: {
          type: 'hd_unlock',
          userId,
          generationId,
        },
      };
    } else {
      // Fallback: Créer un prix inline (mode test)
      sessionConfig = {
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: 'Image HD sans filigrane',
                description: `Téléchargez votre création en haute définition sans filigrane`,
                images: [generation.outputImageUrl],
              },
              unit_amount: Math.round(HD_UNLOCK_PRICE_EUR * 100), // 499 centimes
            },
            quantity: 1,
          },
        ],
        client_reference_id: userId,
        customer_email: userEmail,
        success_url: `${appUrl}/hd-success?session_id={CHECKOUT_SESSION_ID}&generation_id=${generationId}`,
        cancel_url: `${appUrl}/dashboard?canceled=true`,
        metadata: {
          type: 'hd_unlock',
          userId,
          generationId,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log(`[HD Unlock] ✅ Session créée: ${session.id} pour génération ${generationId}`);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('[HD Unlock Create Checkout] ❌ Erreur:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la création de la session',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
