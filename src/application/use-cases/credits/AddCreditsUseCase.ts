import { Result, success, failure } from '@/src/shared/types/Result';
import { ICreditRepository } from '@/src/domain/ports/repositories/ICreditRepository';
import { ILoggerService } from '@/src/domain/ports/services/ILoggerService';
import { DomainError } from '@/src/domain/errors/DomainError';
import { ValidationError } from '@/src/domain/errors/ValidationError';

/**
 * Input pour ajouter des crédits (après paiement confirmé)
 */
export interface AddCreditsInput {
  userId: string;
  amount: number;
  description: string;
  stripeSessionId?: string;
}

/**
 * Output
 */
export interface AddCreditsOutput {
  newBalance: number;
  creditsAdded: number;
}

/**
 * Use Case: Ajouter des crédits après confirmation de paiement
 * 
 * Appelé par le webhook Stripe après paiement réussi
 */
export class AddCreditsUseCase {
  constructor(
    private readonly creditRepo: ICreditRepository,
    private readonly logger: ILoggerService,
  ) {}

  async execute(input: AddCreditsInput): Promise<Result<AddCreditsOutput, DomainError>> {
    this.logger.info('Adding credits to user', {
      userId: input.userId,
      amount: input.amount,
      stripeSessionId: input.stripeSessionId,
    });

    // Validation
    if (!input.userId) {
      return failure(new ValidationError('userId est requis'));
    }

    if (input.amount <= 0) {
      return failure(new ValidationError('Le montant doit être positif'));
    }

    // Ajouter les crédits
    const result = await this.creditRepo.addCredits(
      input.userId,
      input.amount,
      input.description,
      input.stripeSessionId,
    );

    if (!result.success) {
      this.logger.error('Failed to add credits', result.error as Error, {
        userId: input.userId,
        amount: input.amount,
      });
      return failure(new ValidationError('Échec de l\'ajout des crédits'));
    }

    this.logger.info('Credits added successfully', {
      userId: input.userId,
      creditsAdded: input.amount,
      newBalance: result.data,
    });

    return success({
      newBalance: result.data,
      creditsAdded: input.amount,
    });
  }
}
