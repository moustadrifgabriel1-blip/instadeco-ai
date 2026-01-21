import { Result, success, failure } from '@/src/shared/types/Result';
import { Generation, CreateGenerationInput, UpdateGenerationInput } from '@/src/domain/entities/Generation';
import { IGenerationRepository } from '@/src/domain/ports/repositories/IGenerationRepository';
import { getSupabaseAdmin, GenerationRow } from './supabaseClient';

/**
 * Adapter: Supabase Generation Repository
 * Implémente IGenerationRepository avec Supabase
 */
export class SupabaseGenerationRepository implements IGenerationRepository {
  private get supabase() {
    return getSupabaseAdmin();
  }

  /**
   * Convertit une row Supabase en entité Generation
   */
  private toEntity(row: GenerationRow): Generation {
    return {
      id: row.id,
      userId: row.user_id,
      styleSlug: row.style_slug,
      roomType: row.room_type,
      inputImageUrl: row.input_image_url,
      outputImageUrl: row.output_image_url,
      status: row.status as Generation['status'],
      prompt: row.prompt,
      hdUnlocked: row.hd_unlocked,
      stripeSessionId: row.stripe_session_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async create(input: CreateGenerationInput): Promise<Result<Generation>> {
    const { data, error } = await this.supabase
      .from('generations')
      .insert({
        user_id: input.userId,
        style_slug: input.styleSlug,
        room_type: input.roomType,
        input_image_url: input.inputImageUrl,
        prompt: input.prompt,
        status: 'pending',
        hd_unlocked: false,
      })
      .select()
      .single();

    if (error) {
      return failure(new Error(`Failed to create generation: ${error.message}`));
    }

    return success(this.toEntity(data as GenerationRow));
  }

  async findById(id: string): Promise<Result<Generation | null>> {
    const { data, error } = await this.supabase
      .from('generations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return success(null);
      }
      return failure(new Error(`Failed to find generation: ${error.message}`));
    }

    return success(this.toEntity(data as GenerationRow));
  }

  async findByUserId(userId: string, limit = 50): Promise<Result<Generation[]>> {
    const { data, error } = await this.supabase
      .from('generations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return failure(new Error(`Failed to find generations: ${error.message}`));
    }

    const generations = (data as GenerationRow[]).map(row => this.toEntity(row));
    return success(generations);
  }

  async update(id: string, input: UpdateGenerationInput): Promise<Result<Generation>> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.status !== undefined) updateData.status = input.status;
    if (input.outputImageUrl !== undefined) updateData.output_image_url = input.outputImageUrl;
    if (input.hdUnlocked !== undefined) updateData.hd_unlocked = input.hdUnlocked;
    if (input.stripeSessionId !== undefined) updateData.stripe_session_id = input.stripeSessionId;

    const { data, error } = await this.supabase
      .from('generations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return failure(new Error(`Failed to update generation: ${error.message}`));
    }

    return success(this.toEntity(data as GenerationRow));
  }

  async delete(id: string): Promise<Result<void>> {
    const { error } = await this.supabase
      .from('generations')
      .delete()
      .eq('id', id);

    if (error) {
      return failure(new Error(`Failed to delete generation: ${error.message}`));
    }

    return success(undefined);
  }

  async countByUserId(userId: string): Promise<Result<number>> {
    const { count, error } = await this.supabase
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      return failure(new Error(`Failed to count generations: ${error.message}`));
    }

    return success(count ?? 0);
  }
}
