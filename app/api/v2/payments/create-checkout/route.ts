import { NextResponse } from 'next/server';
import { z } from 'zod';
import { useCases } from '@/src/infrastructure/config/di-container';
import { CREDIT_PRICES } from '@/src/shared/constants/pricing';

/**
 * Schéma de validation pour l'achat de crédits
 */
const purchaseRequestSchema = z.object({
  userId: z.string().min(1, 'userId requis'),
  email: z.string().email('Email invalide'),
  packId: z.enum(['pack_10', 'pack_25', 'pack_50', 'pack_100']).default('pack_10'),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

// Mapping des packIds vers les configs
const PACK_CONFIG: Record<string, { priceId: string; credits: number }> = {
  pack_10: {
    priceId: CREDIT_PRICES.PACK_10.stripePriceId || '',
    credits: CREDIT_PRICES.PACK_10.credits,
  },
  pack_25: {
    priceId: CREDIT_PRICES.PACK_25.stripePriceId || '',
    credits: CREDIT_PRICES.PACK_25.credits,
  },
  pack_50: {
    priceId: CREDIT_PRICES.PACK_50.stripePriceId || '',
    credits: CREDIT_PRICES.PACK_50.credits,
  },
  pack_100: {
    priceId: CREDIT_PRICES.PACK_100.stripePriceId || '',
    credits: CREDIT_PRICES.PACK_100.credits,
  },
};

/**
 * POST /api/v2/payments/create-checkout
 * 
 * Crée une session Stripe pour l'achat de crédits via PurchaseCreditsUseCase
 */
export async function POST(req: Request) {
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

    // Récupérer la config du pack
    const packConfig = PACK_CONFIG[packId];
    if (!packConfig || !packConfig.priceId) {
      return NextResponse.json(
        { error: 'Pack invalide ou non configuré' },
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
