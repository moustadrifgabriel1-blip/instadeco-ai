/**
 * Entité CreditTransaction
 * Représente une transaction de crédits (achat ou utilisation)
 */
export interface CreditTransaction {
  readonly id: string;
  readonly userId: string;
  readonly amount: number;
  readonly type: CreditTransactionType;
  readonly description: string;
  readonly stripeSessionId: string | null;
  readonly generationId: string | null;
  readonly createdAt: Date;
}

export type CreditTransactionType = 
  | 'purchase'    // Achat de crédits
  | 'generation'  // Utilisation pour génération
  | 'refund'      // Remboursement
  | 'bonus';      // Crédits bonus

export interface CreateCreditTransactionInput {
  userId: string;
  amount: number;
  type: CreditTransactionType;
  description: string;
  stripeSessionId?: string;
  generationId?: string;
}
