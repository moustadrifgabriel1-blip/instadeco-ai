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
    // Opération atomique : incrémenter les crédits avec RPC ou update SQL
    const { data, error: updateError } = await this.supabase
      .rpc('increment_credits', { user_id_input: userId, amount_input: amount });

    if (updateError) {
      // Fallback si la function RPC n'existe pas encore
      console.warn('[Credits] RPC increment_credits failed, using fallback:', updateError.message);
      
      // Fallback : utiliser update avec subquery (moins atomique mais fonctionnel)
      const balanceResult = await this.getBalance(userId);
      if (!balanceResult.success) return balanceResult;
      
      const newBalance = balanceResult.data + amount;
      const { error: fallbackError } = await this.supabase
        .from('profiles')
        .update({ credits: newBalance, updated_at: new Date().toISOString() })
        .eq('id', userId);
      
      if (fallbackError) {
        return failure(new Error(`Failed to add credits: ${fallbackError.message}`));
      }
      
      // Créer la transaction
      await this.createTransaction({ userId, amount, type: 'purchase', description, stripeSessionId });
      return success(newBalance);
    }

    const newBalance = data as number;

    // Créer la transaction
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
    // Opération atomique : décrémenter les crédits avec RPC
    const { data, error: rpcError } = await this.supabase
      .rpc('deduct_credits', { user_id_input: userId, amount_input: amount });

    if (rpcError) {
      // Fallback si la function RPC n'existe pas encore
      console.warn('[Credits] RPC deduct_credits failed, using fallback:', rpcError.message);
      
      const balanceResult = await this.getBalance(userId);
      if (!balanceResult.success) return balanceResult;
      
      const currentBalance = balanceResult.data;
      if (currentBalance < amount) {
        return failure(new Error('Insufficient credits'));
      }
      
      const newBalance = currentBalance - amount;
      const { error: fallbackError } = await this.supabase
        .from('profiles')
        .update({ credits: newBalance, updated_at: new Date().toISOString() })
        .eq('id', userId);
      
      if (fallbackError) {
        return failure(new Error(`Failed to deduct credits: ${fallbackError.message}`));
      }
      
      await this.createTransaction({ userId, amount: -amount, type: 'generation', description, generationId });
      return success(newBalance);
    }

    // Si data est -1, c'est que les crédits sont insuffisants (convention de la RPC)
    if (data === -1) {
      return failure(new Error('Insufficient credits'));
    }

    const newBalance = data as number;

    // Créer la transaction
    await this.createTransaction({
      userId,
      amount: -amount,
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
