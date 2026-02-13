import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

/**
 * Validation des variables d'environnement Supabase
 */
const supabaseEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

/**
 * Récupère les variables d'environnement Supabase
 */
function getSupabaseEnv() {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  const result = supabaseEnvSchema.safeParse(env);
  
  if (!result.success) {
    console.error('❌ Supabase environment variables missing:', result.error.flatten());
    throw new Error('Missing Supabase environment variables');
  }

  return result.data;
}

/**
 * Client Supabase Admin (avec Service Role Key)
 * À utiliser uniquement côté serveur
 */
let supabaseAdminInstance: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance;
  }

  const env = getSupabaseEnv();

  supabaseAdminInstance = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  return supabaseAdminInstance;
}

/**
 * Client Supabase public (avec Anon Key)
 * Pour l'authentification côté client
 */
let supabaseClientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (supabaseClientInstance) {
    return supabaseClientInstance;
  }

  const env = getSupabaseEnv();

  supabaseClientInstance = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return supabaseClientInstance;
}

/**
 * Types pour les tables Supabase
 */
export interface GenerationRow {
  id: string;
  user_id: string;
  style_slug: string;
  room_type_slug: string;
  input_image_url: string;
  output_image_url: string | null;
  status: string;
  custom_prompt: string | null;
  stripe_session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  credits: number;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreditTransactionRow {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string;
  stripe_session_id: string | null;
  generation_id: string | null;
  created_at: string;
}

export interface StyleRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  prompt_template: string;
  thumbnail_url: string;
  category: string;
  is_premium: boolean;
  sort_order: number;
  created_at: string;
}
