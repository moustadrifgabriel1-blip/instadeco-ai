import { Result, success, failure } from '@/src/shared/types/Result';
import { Generation } from '@/src/domain/entities/Generation';
import { IGenerationRepository } from '@/src/domain/ports/repositories/IGenerationRepository';
import { ILoggerService } from '@/src/domain/ports/services/ILoggerService';
import { DomainError } from '@/src/domain/errors/DomainError';
import { ValidationError } from '@/src/domain/errors/ValidationError';

/**
 * Input pour lister les générations
 */
export interface ListUserGenerationsInput {
  userId: string;
  limit?: number;
}

/**
 * Use Case: Lister les générations d'un utilisateur
 */
export class ListUserGenerationsUseCase {
  constructor(
    private readonly generationRepo: IGenerationRepository,
    private readonly logger: ILoggerService,
  ) {}

  async execute(input: ListUserGenerationsInput): Promise<Result<Generation[], DomainError>> {
    if (!input.userId) {
      return failure(new ValidationError('userId est requis'));
    }

    this.logger.debug('Listing user generations', {
      userId: input.userId,
      limit: input.limit,
    });

    const result = await this.generationRepo.findByUserId(
      input.userId,
      input.limit ?? 50,
    );

    if (!result.success) {
      this.logger.error('Failed to list generations', result.error as Error, {
        userId: input.userId,
      });
      return failure(new ValidationError('Échec de la récupération des générations'));
    }

    this.logger.debug('Generations retrieved', {
      userId: input.userId,
      count: result.data.length,
    });

    return success(result.data);
  }
}
