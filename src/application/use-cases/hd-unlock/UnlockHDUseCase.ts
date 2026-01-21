import { Result, success, failure } from '@/src/shared/types/Result';
import { Generation } from '@/src/domain/entities/Generation';
import { IGenerationRepository } from '@/src/domain/ports/repositories/IGenerationRepository';
import { IPaymentService } from '@/src/domain/ports/services/IPaymentService';
import { ILoggerService } from '@/src/domain/ports/services/ILoggerService';
import { DomainError } from '@/src/domain/errors/DomainError';
import { GenerationNotFoundError } from '@/src/domain/errors/GenerationNotFoundError';
import { ForbiddenError } from '@/src/domain/errors/AuthErrors';
import { PaymentError } from '@/src/domain/errors/PaymentError';

/**
 * Input pour créer une session HD unlock
 */
export interface UnlockHDInput {
  generationId: string;
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Output
 */
export interface UnlockHDOutput {
  checkoutUrl: string;
  sessionId: string;
  alreadyUnlocked: boolean;
}

/**
 * Use Case: Débloquer l'image HD
 * 
 * Crée une session Stripe pour le paiement unique de l'image HD
 */
export class UnlockHDUseCase {
  constructor(
    private readonly generationRepo: IGenerationRepository,
    private readonly paymentService: IPaymentService,
    private readonly logger: ILoggerService,
  ) {}

  async execute(input: UnlockHDInput): Promise<Result<UnlockHDOutput, DomainError>> {
    this.logger.info('Creating HD unlock session', {
      generationId: input.generationId,
      userId: input.userId,
    });

    // 1. Récupérer la génération
    const genResult = await this.generationRepo.findById(input.generationId);

    if (!genResult.success || !genResult.data) {
      return failure(new GenerationNotFoundError(input.generationId));
    }

    const generation = genResult.data;

    // 2. Vérifier que l'utilisateur est le propriétaire
    if (generation.userId !== input.userId) {
      this.logger.warn('Unauthorized HD unlock attempt', {
        generationId: input.generationId,
        requestedBy: input.userId,
        ownedBy: generation.userId,
      });
      return failure(new ForbiddenError('Vous n\'êtes pas le propriétaire de cette image'));
    }

    // 3. Si déjà débloqué, retourner directement
    if (generation.hdUnlocked) {
      this.logger.info('Generation already unlocked', {
        generationId: input.generationId,
      });
      return success({
        checkoutUrl: '',
        sessionId: generation.stripeSessionId || '',
        alreadyUnlocked: true,
      });
    }

    // 4. Créer la session de paiement
    const sessionResult = await this.paymentService.createCheckoutSession({
      userId: input.userId,
      userEmail: input.userEmail,
      priceId: process.env.STRIPE_PRICE_HD_UNLOCK || '',
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      metadata: {
        type: 'hd_unlock',
        generationId: input.generationId,
        userId: input.userId,
      },
    });

    if (!sessionResult.success) {
      this.logger.error('Failed to create HD unlock session', sessionResult.error as Error);
      return failure(new PaymentError('Impossible de créer la session de paiement'));
    }

    this.logger.info('HD unlock session created', {
      generationId: input.generationId,
      sessionId: sessionResult.data.sessionId,
    });

    return success({
      checkoutUrl: sessionResult.data.url,
      sessionId: sessionResult.data.sessionId,
      alreadyUnlocked: false,
    });
  }
}
