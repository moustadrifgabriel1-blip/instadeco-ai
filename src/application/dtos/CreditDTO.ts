import { CreditTransaction } from '@/src/domain/entities/Credit';

/**
 * DTO pour une transaction de crédits
 */
export interface CreditTransactionDTO {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

/**
 * DTO pour le solde de crédits
 */
export interface CreditBalanceDTO {
  balance: number;
  userId: string;
}
