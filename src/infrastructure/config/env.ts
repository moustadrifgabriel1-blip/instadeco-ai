import { z } from 'zod';

/**
 * Schéma de validation des variables d'environnement
 */
const envSchema = z.object({
  // Node
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default('http://localhost:3000'),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Fal.ai — OPTIONNEL : le provider par défaut est Gemini (cf. image-generator-factory).
  // Le rendre requis faisait crasher TOUTE route touchant getEnv() (webhook, SSR blog/galerie)
  // en prod où seule GEMINI_API_KEY est posée → 500 "Invalid environment variables".
  FAL_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  // Optionnelle : seulement requise pour Stripe.js côté client (Elements). Le tunnel
  // passe par Checkout en redirection, donc absente possible en prod.
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_').optional(),

  // Stripe Price IDs (optionnels car configurés dans Stripe Dashboard)
  STRIPE_PRICE_10_CREDITS: z.string().optional(),
  STRIPE_PRICE_25_CREDITS: z.string().optional(),
  STRIPE_PRICE_50_CREDITS: z.string().optional(),
  STRIPE_PRICE_100_CREDITS: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Variables d'environnement validées
 * Attention: Ne pas importer côté client (expose les secrets)
 */
let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(result.error.flatten().fieldErrors, null, 2));
    throw new Error('Invalid environment variables');
  }

  cachedEnv = result.data;
  return cachedEnv;
}

/**
 * Variables publiques (safe côté client)
 */
export function getPublicEnv() {
  return {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  };
}

/**
 * Vérifie si on est en production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Vérifie si on est en développement
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}
