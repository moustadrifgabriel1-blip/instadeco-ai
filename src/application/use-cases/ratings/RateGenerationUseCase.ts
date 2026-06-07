import { Result, success, failure } from '@/src/shared/types/Result';
import { GenerationRating, RatingValue } from '@/src/domain/entities/GenerationRating';
import { IGenerationRatingRepository } from '@/src/domain/ports/repositories/IGenerationRatingRepository';
import { IGenerationRepository } from '@/src/domain/ports/repositories/IGenerationRepository';
import { ILoggerService } from '@/src/domain/ports/services/ILoggerService';
import { DomainError } from '@/src/domain/errors/DomainError';
import { ValidationError } from '@/src/domain/errors/ValidationError';
import { GenerationNotFoundError } from '@/src/domain/errors/GenerationNotFoundError';

/**
 * Input pour noter une génération.
 * Le userId provient TOUJOURS de la session serveur, jamais du body client.
 */
export interface RateGenerationInput {
  generationId: string;
  userId: string;
  rating: RatingValue;
  feedbackText?: string | null;
}

/**
 * Use Case: Noter une génération (qualité perçue 1-5 + feedback).
 *
 * - Vérifie que la génération existe et appartient bien à l'utilisateur.
 * - Idempotent par (generationId, userId) via upsert : re-noter écrase la note.
 */
export class RateGenerationUseCase {
  constructor(
    private readonly ratingRepo: IGenerationRatingRepository,
    private readonly generationRepo: IGenerationRepository,
    private readonly logger: ILoggerService,
  ) {}

  async execute(input: RateGenerationInput): Promise<Result<GenerationRating, DomainError>> {
    if (!input.userId) {
      return failure(new ValidationError('userId est requis'));
    }
    if (!input.generationId) {
      return failure(new ValidationError('generationId est requis'));
    }
    if (![1, 2, 3, 4, 5].includes(input.rating)) {
      return failure(new ValidationError('La note doit être comprise entre 1 et 5'));
    }

    // Vérifier l'existence + l'appartenance de la génération.
    const genResult = await this.generationRepo.findById(input.generationId);
    if (!genResult.success) {
      this.logger.error('Failed to load generation for rating', genResult.error as Error, {
        generationId: input.generationId,
      });
      return failure(new ValidationError('Échec de la récupération de la génération'));
    }
    if (!genResult.data) {
      return failure(new GenerationNotFoundError(input.generationId));
    }
    if (genResult.data.userId !== input.userId) {
      // On ne révèle pas l'existence de la ressource d'un autre utilisateur.
      return failure(new GenerationNotFoundError(input.generationId));
    }

    const result = await this.ratingRepo.upsert({
      generationId: input.generationId,
      userId: input.userId,
      rating: input.rating,
      feedbackText: input.feedbackText ?? null,
    });

    if (!result.success) {
      this.logger.error('Failed to upsert generation rating', result.error as Error, {
        generationId: input.generationId,
        userId: input.userId,
      });
      return failure(new ValidationError("Échec de l'enregistrement de la note"));
    }

    this.logger.debug('Generation rated', {
      generationId: input.generationId,
      userId: input.userId,
      rating: input.rating,
    });

    return success(result.data);
  }
}
