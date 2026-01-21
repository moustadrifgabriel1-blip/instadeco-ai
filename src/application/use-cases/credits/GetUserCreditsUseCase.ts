import { Result, success, failure } from '@/src/shared/types/Result';
import { ICreditRepository } from '@/src/domain/ports/repositories/ICreditRepository';
import { ILoggerService } from '@/src/domain/ports/services/ILoggerService';
import { DomainError } from '@/src/domain/errors/DomainError';
import { ValidationError } from '@/src/domain/errors/ValidationError';

/**
 * Input
 */
export interface GetUserCreditsInput {
  userId: string;
}

/**
 * Output
 */
export interface GetUserCreditsOutput {
  balance: number;
}

/**
 * Use Case: Récupérer le solde de crédits d'un utilisateur
 */
export class GetUserCreditsUseCase {
  constructor(
    private readonly creditRepo: ICreditRepository,
    private readonly logger: ILoggerService,
  ) {}

  async execute(input: GetUserCreditsInput): Promise<Result<GetUserCreditsOutput, DomainError>> {
    if (!input.userId) {
      return failure(new ValidationError('userId est requis'));
    }

    this.logger.debug('Getting user credits', { userId: input.userId });

    const result = await this.creditRepo.getBalance(input.userId);

    if (!result.success) {
      this.logger.error('Failed to get credits', result.error as Error, {
        userId: input.userId,
      });
      return failure(new ValidationError('Échec de la récupération des crédits'));
    }

    return success({
      balance: result.data,
    });
  }
}
