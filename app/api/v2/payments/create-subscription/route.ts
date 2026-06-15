import { NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimitDistributed, getClientIP, RATE_LIMIT_CONFIGS } from '@/lib/security/rate-limiter';
import { requireAuth } from '@/lib/security/api-auth';
import { useCases } from '@/src/infrastructure/config/di-container';
import { InvalidSubscriptionPlanError } from '@/src/application/use-cases/payments/CreateSubscriptionUseCase';

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
 * POST /api/v2/payments/create-subscription
 *
 * Crée une session Stripe Checkout en mode subscription via CreateSubscriptionUseCase
 * (le SDK Stripe n'est plus instancié dans le transport). Transport ici : auth,
 * rate-limit, validation, mapping HTTP.
 */
export async function POST(req: Request) {
  // ✅ Authentification obligatoire (userId + email TOUJOURS issus de la session)
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const userId = auth.user.id;
  const email = auth.user.email!;

  // Rate limiting (store Supabase partagé, serverless-safe)
  const clientIP = getClientIP(req.headers);
  const rateLimitResult = await checkRateLimitDistributed(clientIP, RATE_LIMIT_CONFIGS.checkout);
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
    const origin = new URL(req.url).origin;

    const result = await useCases.createSubscription.execute({
      planId,
      interval,
      userId,
      email,
      successUrl: successUrl || `${origin}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: cancelUrl || `${origin}/pricing?subscription=cancelled`,
    });

    if (!result.success) {
      // Plan/prix invalide → 400 (comme l'origine) ; erreur Stripe → 500.
      const status = result.error instanceof InvalidSubscriptionPlanError ? 400 : 500;
      if (status === 500) console.error('[Subscription] ❌ Erreur:', result.error.message);
      return NextResponse.json({ error: result.error.message }, { status });
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: result.data.checkoutUrl,
      sessionId: result.data.sessionId,
      subscription: {
        planId: result.data.planId,
        interval: result.data.interval,
        creditsPerMonth: result.data.creditsPerMonth,
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
