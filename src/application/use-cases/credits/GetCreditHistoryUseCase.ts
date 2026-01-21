import { Result, success, failure } from '@/src/shared/types/Result';
import { CreditTransaction } from '@/src/domain/entities/Credit';
import { ICreditRepository } from '@/src/domain/ports/repositories/ICreditRepository';
import { ILoggerService } from '@/src/domain/ports/services/ILoggerService';
import { DomainError } from '@/src/domain/errors/DomainError';
import { ValidationError } from '@/src/domain/errors/ValidationError';

/**
 * Input
 */
export interface GetCreditHistoryInput {
  userId: string;
  limit?: number;
}

/**
 * Use Case: Récupérer l'historique des transactions de crédits
 */
export class GetCreditHistoryUseCase {
  constructor(
    private readonly creditRepo: ICreditRepository,
    private readonly logger: ILoggerService,
  ) {}

  async execute(input: GetCreditHistoryInput): Promise<Result<CreditTransaction[], DomainError>> {
    if (!input.userId) {
      return failure(new ValidationError('userId est requis'));
    }

    this.logger.debug('Getting credit history', { 
      userId: input.userId,
      limit: input.limit,
    });

    const result = await this.creditRepo.getTransactionHistory(
      input.userId,
      input.limit ?? 50,
    );

    if (!result.success) {
      this.logger.error('Failed to get credit history', result.error as Error, {
        userId: input.userId,
      });
      return failure(new ValidationError('Échec de la récupération de l\'historique'));
    }

    return success(result.data);
  }
}
