// Augmentation des types ProcessEnv pour les variables d'environnement du projet
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Supabase
      NEXT_PUBLIC_SUPABASE_URL: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
      SUPABASE_SERVICE_ROLE_KEY: string;

      // Fal.ai
      FAL_KEY: string;

      // Stripe - Packs de crédits
      STRIPE_SECRET_KEY: string;
      STRIPE_WEBHOOK_SECRET: string;
      STRIPE_PRICE_STARTER: string;
      STRIPE_PRICE_PRO: string;
      STRIPE_PRICE_UNLIMITED: string;
      STRIPE_PRICE_HD_UNLOCK: string;
      STRIPE_PRICE_10_CREDITS?: string;
      STRIPE_PRICE_25_CREDITS?: string;
      STRIPE_PRICE_50_CREDITS?: string;
      STRIPE_PRICE_100_CREDITS?: string;

      // Stripe - Abonnements
      STRIPE_PRICE_SUB_ESSENTIEL_MONTHLY: string;
      STRIPE_PRICE_SUB_ESSENTIEL_ANNUAL: string;
      STRIPE_PRICE_SUB_PRO_MONTHLY: string;
      STRIPE_PRICE_SUB_PRO_ANNUAL: string;
      STRIPE_PRICE_SUB_BUSINESS_MONTHLY: string;
      STRIPE_PRICE_SUB_BUSINESS_ANNUAL: string;

      // Cron & Sécurité
      CRON_SECRET: string;
      RATE_LIMIT_MAX_REQUESTS?: string;

      // Gemini (Blog)
      GEMINI_API_KEY?: string;

      // Resend (Email)
      RESEND_API_KEY?: string;

      // Node
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
}
