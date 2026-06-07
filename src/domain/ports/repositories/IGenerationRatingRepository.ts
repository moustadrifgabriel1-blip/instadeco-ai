import { GenerationRating, UpsertGenerationRatingInput } from '../../entities/GenerationRating';
import { Result } from '@/src/shared/types/Result';

/**
 * Port Repository - GenerationRating
 * Interface pour la persistance des notes de générations.
 */
export interface IGenerationRatingRepository {
  /**
   * Insère ou met à jour la note d'un utilisateur pour une génération.
   * Idempotent par (generationId, userId) via upsert.
   */
  upsert(input: UpsertGenerationRatingInput): Promise<Result<GenerationRating>>;

  /**
   * Récupère la note d'un utilisateur pour une génération (ou null).
   */
  findByGenerationAndUser(
    generationId: string,
    userId: string,
  ): Promise<Result<GenerationRating | null>>;
}
