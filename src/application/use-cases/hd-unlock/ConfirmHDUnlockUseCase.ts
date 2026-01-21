import { Result, success, failure } from '@/src/shared/types/Result';
import { IGenerationRepository } from '@/src/domain/ports/repositories/IGenerationRepository';
import { IPaymentService } from '@/src/domain/ports/services/IPaymentService';
import { ILoggerService } from '@/src/domain/ports/services/ILoggerService';
import { DomainError } from '@/src/domain/errors/DomainError';
import { GenerationNotFoundError } from '@/src/domain/errors/GenerationNotFoundError';
import { PaymentError } from '@/src/domain/errors/PaymentError';

/**
 * Input pour confirmer le déblocage HD après paiement
 */
export interface ConfirmHDUnlockInput {
  sessionId: string;
  generationId: string;
}

/**
 * Output
 */
export interface ConfirmHDUnlockOutput {
  success: boolean;
  imageUrl: string;
  downloadUrl: string;
}

/**
 * Use Case: Confirmer le déblocage HD après paiement
 * 
 * Vérifie le paiement Stripe et marque la génération comme débloquée
 */
export class ConfirmHDUnlockUseCase {
  constructor(
    private readonly generationRepo: IGenerationRepository,
    private readonly paymentService: IPaymentService,
    private readonly logger: ILoggerService,
  ) {}

  async execute(input: ConfirmHDUnlockInput): Promise<Result<ConfirmHDUnlockOutput, DomainError>> {
    this.logger.info('Confirming HD unlock', {
      sessionId: input.sessionId,
      generationId: input.generationId,
    });

    // 1. Vérifier la session Stripe
    const sessionResult = await this.paymentService.retrieveSession(input.sessionId);

    if (!sessionResult.success) {
      this.logger.error('Failed to retrieve session', sessionResult.error as Error);
      return failure(new PaymentError('Session de paiement invalide'));
    }

    const session = sessionResult.data;

    // 2. Vérifier que le paiement est complété
    if (session.paymentStatus !== 'paid') {
      return failure(new PaymentError('Paiement non complété'));
    }

    // 3. Vérifier que la session correspond à la génération
    if (session.metadata.generationId !== input.generationId) {
      return failure(new PaymentError('Session non valide pour cette génération'));
    }

    // 4. Récupérer la génération
    const genResult = await this.generationRepo.findById(input.generationId);

    if (!genResult.success || !genResult.data) {
      return failure(new GenerationNotFoundError(input.generationId));
    }

    const generation = genResult.data;

    // 5. Si déjà débloqué, retourner le résultat
    if (generation.hdUnlocked) {
      return success({
        success: true,
        imageUrl: generation.outputImageUrl || '',
        downloadUrl: `/api/hd-unlock/download?sessionId=${input.sessionId}&generationId=${input.generationId}`,
      });
    }

    // 6. Marquer comme débloqué
    const updateResult = await this.generationRepo.update(input.generationId, {
      hdUnlocked: true,
      stripeSessionId: input.sessionId,
    });

    if (!updateResult.success) {
      this.logger.error('Failed to update generation', updateResult.error as Error);
      return failure(new PaymentError('Échec de la mise à jour'));
    }

    this.logger.info('HD unlock confirmed', {
      generationId: input.generationId,
    });

    return success({
      success: true,
      imageUrl: generation.outputImageUrl || '',
      downloadUrl: `/api/hd-unlock/download?sessionId=${input.sessionId}&generationId=${input.generationId}`,
    });
  }
}
