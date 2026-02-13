/**
 * Constantes de prix pour les crédits
 */
export const CREDIT_PRICES = {
  // Pack de crédits
  PACK_10: {
    id: 'pack_10',
    credits: 10,
    price: 990, // en centimes (9.90€)
    priceDisplay: '9,90 €',
    stripePriceId: process.env.STRIPE_PRICE_STARTER || process.env.STRIPE_PRICE_10_CREDITS,
  },
  PACK_25: {
    id: 'pack_25',
    credits: 25,
    price: 1990, // 19.90€
    priceDisplay: '19,90 €',
    stripePriceId: process.env.STRIPE_PRICE_PRO || process.env.STRIPE_PRICE_25_CREDITS,
    popular: true,
  },
  PACK_50: {
    id: 'pack_50',
    credits: 50,
    price: 3490, // 34.90€
    priceDisplay: '34,90 €',
    stripePriceId: process.env.STRIPE_PRICE_UNLIMITED || process.env.STRIPE_PRICE_50_CREDITS,
  },
  PACK_100: {
    id: 'pack_100',
    credits: 100,
    price: 5990, // 59.90€
    priceDisplay: '59,90 €',
    stripePriceId: process.env.STRIPE_PRICE_100_CREDITS,
    bestValue: true,
  },
} as const;

/**
 * Coût en crédits par opération
 */
export const CREDIT_COSTS = {
  GENERATION: 1,           // 1 crédit par génération
  PREMIUM_STYLE: 2,        // 2 crédits pour styles premium
} as const;

/**
 * Crédits offerts à l'inscription
 */
export const SIGNUP_BONUS_CREDITS = 3;
