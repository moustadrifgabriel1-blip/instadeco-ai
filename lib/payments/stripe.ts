import Stripe from 'stripe';

// Initialiser le client Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('[Stripe] STRIPE_SECRET_KEY non configurée');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Configuration des packs de crédits
export const CREDIT_PACKS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    credits: 10,
    priceEur: 9.99,
    priceId: process.env.STRIPE_PRICE_STARTER || '',
    popular: false,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    credits: 30,
    priceEur: 24.99,
    priceId: process.env.STRIPE_PRICE_PRO || '',
    popular: true,
  },
  unlimited: {
    id: 'unlimited',
    name: 'Unlimited',
    credits: 100,
    priceEur: 69.99,
    priceId: process.env.STRIPE_PRICE_UNLIMITED || '',
    popular: false,
  },
} as const;

export type PackId = keyof typeof CREDIT_PACKS;

// Mapping des Prix Stripe → Crédits
// À mettre à jour avec les vrais price IDs de Stripe Dashboard
export const PRICE_TO_CREDITS: Record<string, number> = {
  // Starter TEST - 10 crédits à 9.99€
  'price_1Sr2NfI3ljx3HXhRlRgPlVHi': 10,
  // Pro - 30 crédits à 24.99€
  'price_1SrINGIe6ALYwdt59gKxQyKk': 30,
  // Unlimited - 100 crédits à 69.99€
  'price_1Sr1vMI3ljx3HXhRJQqq5Axh': 100,
};

/**
 * Créer une session Stripe Checkout
 */
export async function createCheckoutSession({
  packId,
  userId,
  userEmail,
  successUrl,
  cancelUrl,
}: {
  packId: PackId;
  userId: string;
  userEmail?: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const pack = CREDIT_PACKS[packId];

  if (!pack) {
    throw new Error(`Pack invalide: ${packId}`);
  }

  if (!pack.priceId) {
    throw new Error(`Price ID non configuré pour le pack: ${packId}`);
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price: pack.priceId,
        quantity: 1,
      },
    ],
    client_reference_id: userId,
    customer_email: userEmail,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      credits: pack.credits.toString(),
      packId,
    },
  });

  return session;
}

/**
 * Vérifier la signature d'un webhook Stripe
 */
export function constructWebhookEvent(
  body: string,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}
