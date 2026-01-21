import { CreditTransaction, CreateCreditTransactionInput } from '../../entities/Credit';
import { Result } from '@/src/shared/types/Result';

/**
 * Port Repository - Credit
 * Interface pour la gestion des crédits utilisateur
 */
export interface ICreditRepository {
  /**
   * Récupère le solde de crédits d'un utilisateur
   */
  getBalance(userId: string): Promise<Result<number>>;

  /**
   * Ajoute des crédits à un utilisateur
   */
  addCredits(userId: string, amount: number, description: string, stripeSessionId?: string): Promise<Result<number>>;

  /**
   * Déduit des crédits d'un utilisateur
   */
  deductCredits(userId: string, amount: number, description: string, generationId?: string): Promise<Result<number>>;

  /**
   * Crée une transaction de crédit
   */
  createTransaction(input: CreateCreditTransactionInput): Promise<Result<CreditTransaction>>;

  /**
   * Récupère l'historique des transactions d'un utilisateur
   */
  getTransactionHistory(userId: string, limit?: number): Promise<Result<CreditTransaction[]>>;

  /**
   * Vérifie si un utilisateur a suffisamment de crédits
   */
  hasEnoughCredits(userId: string, amount: number): Promise<Result<boolean>>;
}
