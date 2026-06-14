import { NextResponse } from 'next/server';
import { z } from 'zod';
import { useCases } from '@/src/infrastructure/config/di-container';
import { checkRateLimitDistributed, getClientIP, RATE_LIMIT_CONFIGS } from '@/lib/security/rate-limiter';

/**
 * Schéma de validation pour l'achat de crédits SANS compte (guest checkout).
 * L'email est fourni par l'utilisateur ; le compte est créé par le webhook après paiement.
 */
const guestPurchaseSchema = z.object({
  email: z.string().email(),
  packId: z.enum(['pack_10', 'pack_25', 'pack_50', 'pack_100']).default('pack_10'),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  couponId: z.string().optional(),
});

function getPackConfig(packId: string): { priceId: string; credits: number } | null {
  const configs: Record<string, { priceId: string | undefined; credits: number }> = {
    pack_10: { priceId: process.env.STRIPE_PRICE_STARTER || process.env.STRIPE_PRICE_10_CREDITS, credits: 10 },
    pack_25: { priceId: process.env.STRIPE_PRICE_PRO || process.env.STRIPE_PRICE_25_CREDITS, credits: 25 },
    pack_50: { priceId: process.env.STRIPE_PRICE_UNLIMITED || process.env.STRIPE_PRICE_50_CREDITS, credits: 50 },
    pack_100: { priceId: process.env.STRIPE_PRICE_100_CREDITS, credits: 100 },
  };
  const config = configs[packId];
  if (!config || !config.priceId) {
    console.error(`[Guest Payments] Missing price ID for pack: ${packId}`);
    return null;
  }
  return { priceId: config.priceId, credits: config.credits };
}

/**
 * POST /api/v2/payments/create-guest-checkout
 *
 * Crée une session Stripe pour un achat de crédits SANS compte.
 * Le compte est matérialisé par le webhook après paiement (magic link envoyé).
 */
export async function POST(req: Request) {
  // Rate limiting (store Supabase partagé, serverless-safe)
  const clientIP = getClientIP(req.headers);
  const rateLimitResult = await checkRateLimitDistributed(clientIP, RATE_LIMIT_CONFIGS.checkout);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
      { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter) } },
    );
  }

  try {
    const body = await req.json();
    const validation = guestPurchaseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation échouée', details: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { email, packId, successUrl, cancelUrl, couponId } = validation.data;

    const packConfig = getPackConfig(packId);
    if (!packConfig) {
      return NextResponse.json(
        { error: 'Pack invalide ou non configuré. Vérifiez les variables STRIPE_PRICE_* sur Vercel.' },
        { status: 400 },
      );
    }

    const origin = new URL(req.url).origin;
    const defaultSuccessUrl = successUrl || `${origin}/credits/success?session_id={CHECKOUT_SESSION_ID}`;
    const defaultCancelUrl = cancelUrl || `${origin}/pricing?purchase=cancelled`;

    const result = await useCases.createGuestCheckout.execute({
      email,
      packId,
      credits: packConfig.credits,
      priceId: packConfig.priceId,
      successUrl: defaultSuccessUrl,
      cancelUrl: defaultCancelUrl,
      couponId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: result.error.statusCode },
      );
    }

    const { checkoutUrl, sessionId } = result.data;
    return NextResponse.json({
      success: true,
      checkoutUrl,
      sessionId,
      order: { packId, credits: packConfig.credits },
    });
  } catch (error) {
    console.error('[Guest Payments V2] ❌ Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la session de paiement' },
      { status: 500 },
    );
  }
}
