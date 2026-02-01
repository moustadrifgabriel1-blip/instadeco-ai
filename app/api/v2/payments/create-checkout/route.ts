import { NextResponse } from 'next/server';
import { z } from 'zod';
import { useCases } from '@/src/infrastructure/config/di-container';
import { checkRateLimit, getClientIP, RATE_LIMIT_CONFIGS } from '@/lib/security/rate-limiter';

/**
 * Schéma de validation pour l'achat de crédits
 */
const purchaseRequestSchema = z.object({
  userId: z.string().uuid('ID utilisateur invalide'),
  email: z.string().email('Email invalide'),
  packId: z.enum(['pack_10', 'pack_25', 'pack_50', 'pack_100']).default('pack_10'),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

// Fonction pour obtenir la config du pack au runtime
function getPackConfig(packId: string): { priceId: string; credits: number } | null {
  const configs: Record<string, { priceId: string | undefined; credits: number }> = {
    pack_10: {
      priceId: process.env.STRIPE_PRICE_STARTER || process.env.STRIPE_PRICE_10_CREDITS,
      credits: 10,
    },
    pack_25: {
      priceId: process.env.STRIPE_PRICE_PRO || process.env.STRIPE_PRICE_25_CREDITS,
      credits: 25,
    },
    pack_50: {
      priceId: process.env.STRIPE_PRICE_UNLIMITED || process.env.STRIPE_PRICE_50_CREDITS,
      credits: 50,
    },
    pack_100: {
      priceId: process.env.STRIPE_PRICE_100_CREDITS,
      credits: 100,
    },
  };

  const config = configs[packId];
  if (!config || !config.priceId) {
    console.error(`[Payments] Missing price ID for pack: ${packId}`, {
      STRIPE_PRICE_STARTER: process.env.STRIPE_PRICE_STARTER ? 'set' : 'missing',
      STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO ? 'set' : 'missing',
      STRIPE_PRICE_UNLIMITED: process.env.STRIPE_PRICE_UNLIMITED ? 'set' : 'missing',
    });
    return null;
  }

  return { priceId: config.priceId, credits: config.credits };
}

/**
 * POST /api/v2/payments/create-checkout
 * 
 * Crée une session Stripe pour l'achat de crédits via PurchaseCreditsUseCase
 */
export async function POST(req: Request) {
  // Rate limiting pour éviter les abus
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

    // Validation avec Zod
    const validation = purchaseRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation échouée',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { userId, email, packId, successUrl, cancelUrl } = validation.data;

    // Récupérer la config du pack au runtime
    const packConfig = getPackConfig(packId);
    if (!packConfig) {
      return NextResponse.json(
        { error: 'Pack invalide ou non configuré. Vérifiez les variables STRIPE_PRICE_* sur Vercel.' },
        { status: 400 }
      );
    }

    // URLs par défaut
    const origin = new URL(req.url).origin;
    const defaultSuccessUrl = successUrl || `${origin}/dashboard?purchase=success`;
    const defaultCancelUrl = cancelUrl || `${origin}/pricing?purchase=cancelled`;

    // Exécuter le Use Case
    const result = await useCases.purchaseCredits.execute({
      userId,
      userEmail: email,
      packId,
      credits: packConfig.credits,
      priceId: packConfig.priceId,
      successUrl: defaultSuccessUrl,
      cancelUrl: defaultCancelUrl,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: result.error.statusCode }
      );
    }

    const { checkoutUrl, sessionId } = result.data;

    return NextResponse.json({
      success: true,
      checkoutUrl,
      sessionId,
      order: {
        packId,
        credits: packConfig.credits,
      },
    });

  } catch (error) {
    console.error('[Payments V2] ❌ Erreur:', error);

    return NextResponse.json(
      {
        error: 'Erreur lors de la création de la session de paiement',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
