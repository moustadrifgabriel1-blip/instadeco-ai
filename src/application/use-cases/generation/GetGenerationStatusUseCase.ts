import { Result, success, failure } from '@/src/shared/types/Result';
import { Generation } from '@/src/domain/entities/Generation';
import { IGenerationRepository } from '@/src/domain/ports/repositories/IGenerationRepository';
import { ILoggerService } from '@/src/domain/ports/services/ILoggerService';
import { GenerationNotFoundError } from '@/src/domain/errors/GenerationNotFoundError';
import { DomainError } from '@/src/domain/errors/DomainError';

/**
 * Input pour récupérer le statut
 */
export interface GetGenerationStatusInput {
  generationId: string;
  userId?: string; // Optionnel pour vérification de propriété
}

/**
 * Use Case: Récupérer le statut d'une génération
 */
export class GetGenerationStatusUseCase {
  constructor(
    private readonly generationRepo: IGenerationRepository,
    private readonly logger: ILoggerService,
  ) {}

  async execute(input: GetGenerationStatusInput): Promise<Result<Generation, DomainError>> {
    this.logger.debug('Getting generation status', {
      generationId: input.generationId,
    });

    const result = await this.generationRepo.findById(input.generationId);

    if (!result.success) {
      this.logger.error('Failed to get generation', result.error as Error);
      return failure(new GenerationNotFoundError(input.generationId));
    }

    const generation = result.data;

    if (!generation) {
      return failure(new GenerationNotFoundError(input.generationId));
    }

    // Vérifier la propriété si userId fourni
    if (input.userId && generation.userId !== input.userId) {
      this.logger.warn('Unauthorized access attempt', {
        generationId: input.generationId,
        requestedBy: input.userId,
        ownedBy: generation.userId,
      });
      return failure(new GenerationNotFoundError(input.generationId));
    }

    return success(generation);
  }
}
