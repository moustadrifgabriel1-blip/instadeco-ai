import { Result, success, failure } from '@/src/shared/types/Result';
import {
  GenerationRating,
  RatingValue,
  UpsertGenerationRatingInput,
} from '@/src/domain/entities/GenerationRating';
import { IGenerationRatingRepository } from '@/src/domain/ports/repositories/IGenerationRatingRepository';
import { getSupabaseAdmin } from './supabaseClient';

/**
 * Row Supabase de la table generation_ratings.
 */
interface GenerationRatingRow {
  id: string;
  generation_id: string;
  user_id: string;
  rating: number;
  feedback_text: string | null;
  created_at: string;
}

/**
 * Adapter: Supabase GenerationRating Repository
 * Implémente IGenerationRatingRepository avec Supabase.
 */
export class SupabaseGenerationRatingRepository implements IGenerationRatingRepository {
  private get supabase() {
    return getSupabaseAdmin();
  }

  private toEntity(row: GenerationRatingRow): GenerationRating {
    return {
      id: row.id,
      generationId: row.generation_id,
      userId: row.user_id,
      rating: row.rating as RatingValue,
      feedbackText: row.feedback_text,
      createdAt: new Date(row.created_at),
    };
  }

  async upsert(input: UpsertGenerationRatingInput): Promise<Result<GenerationRating>> {
    // Idempotent par (generation_id, user_id) grâce à l'index unique.
    const { data, error } = await this.supabase
      .from('generation_ratings')
      .upsert(
        {
          generation_id: input.generationId,
          user_id: input.userId,
          rating: input.rating,
          feedback_text: input.feedbackText ?? null,
        },
        { onConflict: 'generation_id,user_id' },
      )
      .select()
      .single();

    if (error) {
      return failure(new Error(`Failed to upsert generation rating: ${error.message}`));
    }

    return success(this.toEntity(data as GenerationRatingRow));
  }

  async findByGenerationAndUser(
    generationId: string,
    userId: string,
  ): Promise<Result<GenerationRating | null>> {
    const { data, error } = await this.supabase
      .from('generation_ratings')
      .select('*')
      .eq('generation_id', generationId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return success(null);
      }
      return failure(new Error(`Failed to find generation rating: ${error.message}`));
    }

    return success(this.toEntity(data as GenerationRatingRow));
  }
}
