import { db } from './config';
import { 
  doc, 
  runTransaction, 
  collection, 
  addDoc, 
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';

/**
 * Types pour les transactions de crédits
 */
export type CreditTransactionType = 'purchase' | 'usage' | 'refund' | 'bonus';

export interface CreditTransaction {
  userId: string;
  amount: number;
  type: CreditTransactionType;
  stripePaymentIntentId?: string;
  metadata?: Record<string, any>;
  createdAt: Timestamp;
}

/**
 * Déduire des crédits d'un utilisateur (transaction atomique)
 * 
 * @param userId - ID Firebase Auth de l'utilisateur
 * @param amount - Nombre de crédits à déduire (positif)
 * @param metadata - Métadonnées optionnelles (ex: generationId)
 * @returns Promise<boolean> - true si succès, false si solde insuffisant
 * 
 * @example
 * const success = await deductCredits('user123', 1, { generationId: 'gen456' });
 * if (!success) {
 *   throw new Error('Crédits insuffisants');
 * }
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
    const result = await runTransaction(db, async (transaction) => {
      // 1. Lire le solde actuel
      const userRef = doc(db, 'users', userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        throw new Error('Utilisateur introuvable');
      }

      const currentCredits = userDoc.data().credits || 0;

      // 2. Vérifier si le solde est suffisant
      if (currentCredits < amount) {
        return false; // Solde insuffisant
      }

      // 3. Déduire les crédits
      transaction.update(userRef, {
        credits: currentCredits - amount,
        updatedAt: serverTimestamp(),
      });

      // 4. Enregistrer la transaction
      const transactionRef = doc(collection(db, 'creditTransactions'));
      transaction.set(transactionRef, {
        userId,
        amount: -amount, // Négatif pour indiquer une déduction
        type: 'usage' as CreditTransactionType,
        metadata: metadata || {},
        createdAt: serverTimestamp(),
      });

      return true; // Succès
    });

    if (result) {
      console.log(`[Credits] Déduit ${amount} crédit(s) pour user ${userId}`);
    } else {
      console.warn(`[Credits] Solde insuffisant pour user ${userId}`);
    }

    return result;
  } catch (error) {
    console.error('[Credits] Erreur lors de la déduction:', error);
    throw error;
  }
}

/**
 * Ajouter des crédits à un utilisateur (transaction atomique)
 * 
 * @param userId - ID Firebase Auth de l'utilisateur
 * @param amount - Nombre de crédits à ajouter (positif)
 * @param type - Type de transaction (purchase, bonus, refund)
 * @param stripePaymentIntentId - ID du paiement Stripe (optionnel)
 * @param metadata - Métadonnées optionnelles
 * 
 * @example
 * await addCredits('user123', 10, 'purchase', 'pi_abc123');
 */
export async function addCredits(
  userId: string,
  amount: number,
  type: CreditTransactionType = 'purchase',
  stripePaymentIntentId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  if (amount <= 0) {
    throw new Error('Le montant doit être positif');
  }

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Lire le solde actuel
      const userRef = doc(db, 'users', userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        throw new Error('Utilisateur introuvable');
      }

      const currentCredits = userDoc.data().credits || 0;

      // 2. Ajouter les crédits
      transaction.update(userRef, {
        credits: currentCredits + amount,
        updatedAt: serverTimestamp(),
      });

      // 3. Enregistrer la transaction
      const transactionRef = doc(collection(db, 'creditTransactions'));
      transaction.set(transactionRef, {
        userId,
        amount, // Positif pour indiquer un ajout
        type,
        stripePaymentIntentId: stripePaymentIntentId || null,
        metadata: metadata || {},
        createdAt: serverTimestamp(),
      });
    });

    console.log(`[Credits] Ajouté ${amount} crédit(s) pour user ${userId} (${type})`);
  } catch (error) {
    console.error('[Credits] Erreur lors de l\'ajout:', error);
    throw error;
  }
}

/**
 * Récupérer le solde de crédits d'un utilisateur
 * Note: Préférer utiliser le hook useAuth côté client avec onSnapshot
 * 
 * @param userId - ID Firebase Auth de l'utilisateur
 * @returns Promise<number> - Solde actuel
 */
export async function getCreditBalance(userId: string): Promise<number> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await (await import('firebase/firestore')).getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('Utilisateur introuvable');
    }

    return userDoc.data().credits || 0;
  } catch (error) {
    console.error('[Credits] Erreur lors de la récupération du solde:', error);
    throw error;
  }
}
