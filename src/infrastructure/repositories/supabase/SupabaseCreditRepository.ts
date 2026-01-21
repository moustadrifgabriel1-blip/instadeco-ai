import { Result, success, failure } from '@/src/shared/types/Result';
import { CreditTransaction, CreateCreditTransactionInput } from '@/src/domain/entities/Credit';
import { ICreditRepository } from '@/src/domain/ports/repositories/ICreditRepository';
import { getSupabaseAdmin, CreditTransactionRow } from './supabaseClient';

/**
 * Adapter: Supabase Credit Repository
 * Implémente ICreditRepository avec Supabase
 */
export class SupabaseCreditRepository implements ICreditRepository {
  private get supabase() {
    return getSupabaseAdmin();
  }

  /**
   * Convertit une row Supabase en entité CreditTransaction
   */
  private toEntity(row: CreditTransactionRow): CreditTransaction {
    return {
      id: row.id,
      userId: row.user_id,
      amount: row.amount,
      type: row.type as CreditTransaction['type'],
      description: row.description,
      stripeSessionId: row.stripe_session_id,
      generationId: row.generation_id,
      createdAt: new Date(row.created_at),
    };
  }

  async getBalance(userId: string): Promise<Result<number>> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (error) {
      return failure(new Error(`Failed to get balance: ${error.message}`));
    }

    return success(data?.credits ?? 0);
  }

  async addCredits(
    userId: string,
    amount: number,
    description: string,
    stripeSessionId?: string
  ): Promise<Result<number>> {
    // 1. Récupérer le solde actuel
    const balanceResult = await this.getBalance(userId);
    if (!balanceResult.success) {
      return balanceResult;
    }

    const newBalance = balanceResult.data + amount;

    // 2. Mettre à jour le profil
    const { error: updateError } = await this.supabase
      .from('profiles')
      .update({ 
        credits: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      return failure(new Error(`Failed to add credits: ${updateError.message}`));
    }

    // 3. Créer la transaction
    await this.createTransaction({
      userId,
      amount,
      type: 'purchase',
      description,
      stripeSessionId,
    });

    return success(newBalance);
  }

  async deductCredits(
    userId: string,
    amount: number,
    description: string,
    generationId?: string
  ): Promise<Result<number>> {
    // 1. Récupérer le solde actuel
    const balanceResult = await this.getBalance(userId);
    if (!balanceResult.success) {
      return balanceResult;
    }

    const currentBalance = balanceResult.data;
    
    if (currentBalance < amount) {
      return failure(new Error('Insufficient credits'));
    }

    const newBalance = currentBalance - amount;

    // 2. Mettre à jour le profil
    const { error: updateError } = await this.supabase
      .from('profiles')
      .update({ 
        credits: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      return failure(new Error(`Failed to deduct credits: ${updateError.message}`));
    }

    // 3. Créer la transaction
    await this.createTransaction({
      userId,
      amount: -amount, // Négatif pour déduction
      type: 'generation',
      description,
      generationId,
    });

    return success(newBalance);
  }

  async createTransaction(input: CreateCreditTransactionInput): Promise<Result<CreditTransaction>> {
    const { data, error } = await this.supabase
      .from('credit_transactions')
      .insert({
        user_id: input.userId,
        amount: input.amount,
        type: input.type,
        description: input.description,
        stripe_session_id: input.stripeSessionId || null,
        generation_id: input.generationId || null,
      })
      .select()
      .single();

    if (error) {
      return failure(new Error(`Failed to create transaction: ${error.message}`));
    }

    return success(this.toEntity(data as CreditTransactionRow));
  }

  async getTransactionHistory(userId: string, limit = 50): Promise<Result<CreditTransaction[]>> {
    const { data, error } = await this.supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return failure(new Error(`Failed to get transaction history: ${error.message}`));
    }

    const transactions = (data as CreditTransactionRow[]).map(row => this.toEntity(row));
    return success(transactions);
  }

  async hasEnoughCredits(userId: string, amount: number): Promise<Result<boolean>> {
    const balanceResult = await this.getBalance(userId);
    if (!balanceResult.success) {
      return balanceResult;
    }

    return success(balanceResult.data >= amount);
  }
}
