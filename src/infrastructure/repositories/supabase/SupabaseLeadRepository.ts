import { Result, success, failure } from '@/src/shared/types/Result';
import { ILeadRepository, CaptureLeadInput } from '@/src/domain/ports/repositories/ILeadRepository';
import { getSupabaseAdmin } from './supabaseClient';

/**
 * Adapter: Supabase Lead Repository (table `leads`).
 */
export class SupabaseLeadRepository implements ILeadRepository {
  private get supabase() {
    return getSupabaseAdmin();
  }

  async existsByEmail(email: string): Promise<Result<boolean>> {
    const { data, error } = await this.supabase
      .from('leads')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error) {
      return failure(new Error(`Failed to check lead: ${error.message}`));
    }
    return success(!!data);
  }

  async create(input: CaptureLeadInput): Promise<Result<void>> {
    const { error } = await this.supabase.from('leads').insert({
      email: input.email.toLowerCase(),
      source: input.source,
      ...(input.name ? { name: input.name } : {}),
      ...(input.metadata ? { metadata: input.metadata } : {}),
      created_at: new Date().toISOString(),
    });

    if (error) {
      return failure(new Error(`Failed to create lead: ${error.message}`));
    }
    return success(undefined);
  }

  async markUnsubscribed(email: string): Promise<Result<void>> {
    const { error } = await this.supabase
      .from('leads')
      .update({ unsubscribed: true })
      .eq('email', email.toLowerCase());

    if (error) {
      return failure(new Error(`Failed to unsubscribe lead: ${error.message}`));
    }
    return success(undefined);
  }
}
