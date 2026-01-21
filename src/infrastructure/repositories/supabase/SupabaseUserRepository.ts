import { Result, success, failure } from '@/src/shared/types/Result';
import { User, CreateUserInput, UpdateUserInput } from '@/src/domain/entities/User';
import { IUserRepository } from '@/src/domain/ports/repositories/IUserRepository';
import { getSupabaseAdmin, ProfileRow } from './supabaseClient';

/**
 * Adapter: Supabase User Repository
 * Implémente IUserRepository avec Supabase (table profiles)
 */
export class SupabaseUserRepository implements IUserRepository {
  private get supabase() {
    return getSupabaseAdmin();
  }

  /**
   * Convertit une row Supabase en entité User
   */
  private toEntity(row: ProfileRow): User {
    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      avatarUrl: row.avatar_url,
      credits: row.credits,
      stripeCustomerId: row.stripe_customer_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async create(input: CreateUserInput): Promise<Result<User>> {
    const { data, error } = await this.supabase
      .from('profiles')
      .insert({
        id: input.id,
        email: input.email,
        full_name: input.fullName || null,
        avatar_url: input.avatarUrl || null,
        credits: 3, // Crédits de bienvenue
      })
      .select()
      .single();

    if (error) {
      return failure(new Error(`Failed to create user: ${error.message}`));
    }

    return success(this.toEntity(data as ProfileRow));
  }

  async findById(id: string): Promise<Result<User | null>> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return success(null);
      }
      return failure(new Error(`Failed to find user: ${error.message}`));
    }

    return success(this.toEntity(data as ProfileRow));
  }

  async findByEmail(email: string): Promise<Result<User | null>> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return success(null);
      }
      return failure(new Error(`Failed to find user by email: ${error.message}`));
    }

    return success(this.toEntity(data as ProfileRow));
  }

  async update(id: string, input: UpdateUserInput): Promise<Result<User>> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.fullName !== undefined) updateData.full_name = input.fullName;
    if (input.avatarUrl !== undefined) updateData.avatar_url = input.avatarUrl;
    if (input.credits !== undefined) updateData.credits = input.credits;
    if (input.stripeCustomerId !== undefined) updateData.stripe_customer_id = input.stripeCustomerId;

    const { data, error } = await this.supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return failure(new Error(`Failed to update user: ${error.message}`));
    }

    return success(this.toEntity(data as ProfileRow));
  }

  async delete(id: string): Promise<Result<void>> {
    const { error } = await this.supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) {
      return failure(new Error(`Failed to delete user: ${error.message}`));
    }

    return success(undefined);
  }

  async exists(id: string): Promise<Result<boolean>> {
    const { count, error } = await this.supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('id', id);

    if (error) {
      return failure(new Error(`Failed to check user existence: ${error.message}`));
    }

    return success((count ?? 0) > 0);
  }
}
