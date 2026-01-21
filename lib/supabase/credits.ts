import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Client admin (bypass RLS)
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Types pour les transactions de crédits
 */
export type CreditTransactionType = 'purchase' | 'usage' | 'refund' | 'bonus';

export interface CreditTransaction {
  user_id: string;
  amount: number;
  type: CreditTransactionType;
  stripe_payment_intent_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

/**
 * Déduire des crédits d'un utilisateur (transaction atomique via fonction RPC)
 * 
 * @param userId - ID Supabase Auth de l'utilisateur
 * @param amount - Nombre de crédits à déduire (positif)
 * @param metadata - Métadonnées optionnelles (ex: generationId)
 * @returns Promise<boolean> - true si succès, false si solde insuffisant
 */
export async function deductCredits(
  userId: string,
  amount: number,
  metadata?: Record<string, any>
): Promise<boolean> {
  if (amount <= 0) {
    throw new Error('Le montant doit être positif');
  }

  try {
    // 1. Récupérer le profil utilisateur
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (fetchError || !profile) {
      console.error('[Credits] Utilisateur introuvable:', userId);
      throw new Error('Utilisateur introuvable');
    }

    const currentCredits = profile.credits || 0;

    // 2. Vérifier si le solde est suffisant
    if (currentCredits < amount) {
      console.warn(`[Credits] Solde insuffisant pour user ${userId}: ${currentCredits} < ${amount}`);
      return false;
    }

    // 3. Déduire les crédits
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        credits: currentCredits - amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('[Credits] Erreur mise à jour crédits:', updateError);
      throw updateError;
    }

    // 4. Enregistrer la transaction
    const { error: txError } = await supabaseAdmin
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: -amount, // Négatif pour indiquer une déduction
        type: 'usage',
        metadata: metadata || {},
      });

    if (txError) {
      console.error('[Credits] Erreur enregistrement transaction:', txError);
      // On ne throw pas ici, les crédits ont déjà été déduits
    }

    console.log(`[Credits] ✅ Déduit ${amount} crédit(s) pour user ${userId}`);
    return true;
  } catch (error) {
    console.error('[Credits] Erreur lors de la déduction:', error);
    throw error;
  }
}

/**
 * Ajouter des crédits à un utilisateur (achat)
 * 
 * @param userId - ID Supabase Auth de l'utilisateur
 * @param amount - Nombre de crédits à ajouter
 * @param stripePaymentIntentId - ID du paiement Stripe
 * @param stripeSessionId - ID de la session Stripe
 * @param packId - ID du pack acheté
 */
export async function addCredits(
  userId: string,
  amount: number,
  stripePaymentIntentId?: string,
  stripeSessionId?: string,
  packId?: string
): Promise<void> {
  try {
    // 1. Récupérer le profil utilisateur
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (fetchError || !profile) {
      console.error('[Credits] Utilisateur introuvable:', userId);
      throw new Error('Utilisateur introuvable');
    }

    const currentCredits = profile.credits || 0;

    // 2. Ajouter les crédits
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        credits: currentCredits + amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('[Credits] Erreur ajout crédits:', updateError);
      throw updateError;
    }

    // 3. Enregistrer la transaction
    const { error: txError } = await supabaseAdmin
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount,
        type: 'purchase',
        stripe_payment_intent_id: stripePaymentIntentId,
        metadata: {
          stripe_session_id: stripeSessionId,
          pack_id: packId,
        },
      });

    if (txError) {
      console.error('[Credits] Erreur enregistrement transaction:', txError);
    }

    console.log(`[Credits] ✅ Ajouté ${amount} crédit(s) pour user ${userId}`);
  } catch (error) {
    console.error('[Credits] Erreur lors de l\'ajout:', error);
    throw error;
  }
}

/**
 * Récupérer le solde de crédits d'un utilisateur
 */
export async function getUserCredits(userId: string): Promise<number> {
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    console.error('[Credits] Erreur récupération crédits:', error);
    return 0;
  }

  return profile.credits || 0;
}
