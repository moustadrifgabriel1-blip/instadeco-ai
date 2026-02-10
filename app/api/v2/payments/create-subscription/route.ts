import { NextResponse } from 'next/server';
import { z } from 'zod';
import Stripe from 'stripe';
import { checkRateLimit, getClientIP, RATE_LIMIT_CONFIGS } from '@/lib/security/rate-limiter';
import { requireAuth } from '@/lib/security/api-auth';

/**
 * Schéma de validation pour la souscription à un abonnement
 */
const subscriptionRequestSchema = z.object({
  planId: z.enum(['sub_essentiel', 'sub_pro', 'sub_business']),
  interval: z.enum(['monthly', 'annual']).default('monthly'),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

/**
 * Configuration des plans d'abonnement
 * Chaque plan a un price ID Stripe pour mensuel et annuel
 */
function getSubscriptionConfig(planId: string, interval: string): {
  priceId: string;
  creditsPerMonth: number;
  planName: string;
} | null {
  const configs: Record<string, {
    monthly: string | undefined;
    annual: string | undefined;
    creditsPerMonth: number;
    planName: string;
  }> = {
    sub_essentiel: {
      monthly: process.env.STRIPE_PRICE_SUB_ESSENTIEL_MONTHLY,
      annual: process.env.STRIPE_PRICE_SUB_ESSENTIEL_ANNUAL,
      creditsPerMonth: 30,
      planName: 'Essentiel',
    },
    sub_pro: {
      monthly: process.env.STRIPE_PRICE_SUB_PRO_MONTHLY,
      annual: process.env.STRIPE_PRICE_SUB_PRO_ANNUAL,
      creditsPerMonth: 80,
      planName: 'Pro',
    },
    sub_business: {
      monthly: process.env.STRIPE_PRICE_SUB_BUSINESS_MONTHLY,
      annual: process.env.STRIPE_PRICE_SUB_BUSINESS_ANNUAL,
      creditsPerMonth: 200,
      planName: 'Business',
    },
  };

  const config = configs[planId];
  if (!config) return null;

  const priceId = interval === 'annual' ? config.annual : config.monthly;
  if (!priceId) {
    console.error(`[Subscription] Missing price ID for ${planId} (${interval})`, {
      monthly: config.monthly ? 'set' : 'missing',
      annual: config.annual ? 'set' : 'missing',
    });
    return null;
  }

  return {
    priceId,
    creditsPerMonth: config.creditsPerMonth,
    planName: config.planName,
  };
}

/**
 * POST /api/v2/payments/create-subscription
 * 
 * Crée une session Stripe Checkout en mode subscription
 */
export async function POST(req: Request) {
  // ✅ Authentification obligatoire
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const userId = auth.user.id;
  const email = auth.user.email!;

  const clientIP = getClientIP(req.headers);
  const rateLimitResult = checkRateLimit(clientIP, RATE_LIMIT_CONFIGS.checkout);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
      { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter) } }
    );
  }

  try {
    const body = await req.json();

    const validation = subscriptionRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation échouée', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { planId, interval, successUrl, cancelUrl } = validation.data;

    const subConfig = getSubscriptionConfig(planId, interval);
    if (!subConfig) {
      return NextResponse.json(
        { error: 'Plan ou intervalle invalide. Vérifiez les variables STRIPE_PRICE_SUB_* sur Vercel.' },
        { status: 400 }
      );
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: 'Configuration Stripe manquante' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' });

    const origin = new URL(req.url).origin;
    const defaultSuccessUrl = successUrl || `${origin}/dashboard?subscription=success`;
    const defaultCancelUrl = cancelUrl || `${origin}/pricing?subscription=cancelled`;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price: subConfig.priceId,
          quantity: 1,
        },
      ],
      success_url: defaultSuccessUrl,
      cancel_url: defaultCancelUrl,
      metadata: {
        userId,
        planId,
        interval,
        creditsPerMonth: String(subConfig.creditsPerMonth),
        type: 'subscription',
      },
      subscription_data: {
        metadata: {
          userId,
          planId,
          interval,
          creditsPerMonth: String(subConfig.creditsPerMonth),
        },
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: 'Impossible de créer la session de paiement' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
      subscription: {
        planId,
        interval,
        creditsPerMonth: subConfig.creditsPerMonth,
      },
    });

  } catch (error) {
    console.error('[Subscription] ❌ Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la session d\'abonnement' },
      { status: 500 }
    );
  }
}
