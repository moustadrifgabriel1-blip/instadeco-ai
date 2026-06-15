import { Result, success, failure } from '@/src/shared/types/Result';
import { CreditTransaction, CreateCreditTransactionInput, CreditTransactionType } from '@/src/domain/entities/Credit';
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
      stripeSessionId: row.stripe_payment_intent,
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
    stripeSessionId?: string,
    type: CreditTransactionType = 'purchase'
  ): Promise<Result<number>> {
    // Atomique : solde + ligne de grand livre (credit_transactions) dans UNE transaction.
    const { data, error } = await this.supabase.rpc('add_credits_with_ledger', {
      user_id_input: userId,
      amount_input: amount,
      type_input: type,
      description_input: description,
      stripe_ref_input: stripeSessionId ?? null,
      generation_id_input: null,
    });

    if (error) {
      return failure(new Error(`Failed to add credits: ${error.message}`));
    }

    return success(data as number);
  }

  async deductCredits(
    userId: string,
    amount: number,
    description: string,
    generationId?: string
  ): Promise<Result<number>> {
    // Atomique : solde + grand livre dans UNE transaction. -1 = crédits insuffisants.
    const { data, error } = await this.supabase.rpc('deduct_credits_with_ledger', {
      user_id_input: userId,
      amount_input: amount,
      type_input: 'generation',
      description_input: description,
      generation_id_input: generationId ?? null,
    });

    if (error) {
      return failure(new Error(`Failed to deduct credits: ${error.message}`));
    }

    if (data === -1) {
      return failure(new Error('Insufficient credits'));
    }

    return success(data as number);
  }

  async createTransaction(input: CreateCreditTransactionInput): Promise<Result<CreditTransaction>> {
    const { data, error } = await this.supabase
      .from('credit_transactions')
      .insert({
        user_id: input.userId,
        amount: input.amount,
        type: input.type,
        description: input.description,
        stripe_payment_intent: input.stripeSessionId || null,
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
