import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

/**
 * POST /api/verify-hd-purchase
 * 
 * Vérifie qu'un paiement Stripe a été effectué et retourne l'URL de l'image HD
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, generationId } = body;

    if (!sessionId || !generationId) {
      return NextResponse.json(
        { error: 'sessionId et generationId requis' },
        { status: 400 }
      );
    }

    // Vérifier la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Vérifier que le paiement est complété
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Paiement non complété' },
        { status: 402 }
      );
    }

    // Vérifier que la session correspond bien à cette génération
    if (session.metadata?.generationId !== generationId) {
      return NextResponse.json(
        { error: 'Session non valide pour cette génération' },
        { status: 403 }
      );
    }

    // Récupérer la génération depuis Firestore
    const generationDoc = await adminDb.collection('generations').doc(generationId).get();

    if (!generationDoc.exists) {
      return NextResponse.json(
        { error: 'Génération non trouvée' },
        { status: 404 }
      );
    }

    const generation = generationDoc.data();

    if (!generation?.outputImageUrl) {
      return NextResponse.json(
        { error: 'Image non disponible' },
        { status: 404 }
      );
    }

    // Marquer comme débloqué (optionnel - pour éviter les re-téléchargements frauduleux)
    await adminDb.collection('generations').doc(generationId).update({
      hdUnlocked: true,
      hdUnlockedAt: new Date(),
      stripeSessionId: sessionId,
    });

    // Log pour audit
    console.log(`[Verify HD] ✅ Image débloquée: ${generationId} (session: ${sessionId})`);

    // Retourner l'URL de l'image originale (sans filigrane)
    return NextResponse.json({
      success: true,
      imageUrl: generation.outputImageUrl,
      message: 'Image HD débloquée avec succès',
    });

  } catch (error) {
    console.error('[Verify HD] Erreur:', error);
    
    // Erreur Stripe spécifique
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: 'Session de paiement invalide ou expirée' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la vérification',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
