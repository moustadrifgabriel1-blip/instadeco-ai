import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/payments/stripe';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import Stripe from 'stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('Stripe-Signature') as string;

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('❌ STRIPE_WEBHOOK_SECRET manquant');
    return new NextResponse('Webhook Secret manquant', { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`❌ Erreur de signature Webhook: ${err instanceof Error ? err.message : 'Inconnue'}`);
    return new NextResponse('Erreur de signature', { status: 400 });
  }

  // Gérer l'événement
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Récupérer les métadonnées
    const userId = session.metadata?.userId;
    const creditsStr = session.metadata?.credits;
    const packId = session.metadata?.packId;

    if (!userId || !creditsStr) {
      console.error('❌ Métadonnées manquantes dans la session Stripe:', session.id);
      return new NextResponse('Métadonnées manquantes', { status: 400 });
    }

    const creditsInfo = parseInt(creditsStr, 10);

    console.log(`💰 Paiement réussi pour ${userId}. Ajout de ${creditsInfo} crédits (Pack: ${packId})`);

    try {
      // Utiliser Admin SDK pour ajouter les crédits (transaction atomique)
      await adminDb.runTransaction(async (transaction) => {
        const userRef = adminDb.collection('users').doc(userId);
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists) {
          throw new Error(`Utilisateur ${userId} introuvable`);
        }

        const currentCredits = userDoc.data()?.credits || 0;

        // Mettre à jour les crédits
        transaction.update(userRef, {
          credits: currentCredits + creditsInfo,
          updatedAt: FieldValue.serverTimestamp(),
        });

        // Enregistrer la transaction
        const txRef = adminDb.collection('creditTransactions').doc();
        transaction.set(txRef, {
          userId,
          amount: creditsInfo,
          type: 'purchase',
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent,
          amountPaid: session.amount_total ? session.amount_total / 100 : 0,
          currency: session.currency,
          packId: packId || 'unknown',
          createdAt: FieldValue.serverTimestamp(),
        });
      });

      console.log('✅ Crédits ajoutés avec succès !');
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout des crédits:', error);
      return new NextResponse('Erreur DB', { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
