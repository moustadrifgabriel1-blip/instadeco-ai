import { Result, success, failure } from '@/src/shared/types/Result';
import { ICreditRepository } from '@/src/domain/ports/repositories/ICreditRepository';
import { IPaymentService, CreateCheckoutSessionOptions } from '@/src/domain/ports/services/IPaymentService';
import { ILoggerService } from '@/src/domain/ports/services/ILoggerService';
import { DomainError } from '@/src/domain/errors/DomainError';
import { PaymentError } from '@/src/domain/errors/PaymentError';
import { ValidationError } from '@/src/domain/errors/ValidationError';

/**
 * Input pour l'achat de crédits
 */
export interface PurchaseCreditsInput {
  userId: string;
  userEmail: string;
  packId: string;
  credits: number;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  /** Stripe coupon ID for discounts */
  couponId?: string;
}

/**
 * Output de l'achat
 */
export interface PurchaseCreditsOutput {
  checkoutUrl: string;
  sessionId: string;
}

/**
 * Use Case: Acheter des crédits
 * 
 * Crée une session Stripe Checkout pour l'achat de crédits
 */
export class PurchaseCreditsUseCase {
  constructor(
    private readonly creditRepo: ICreditRepository,
    private readonly paymentService: IPaymentService,
    private readonly logger: ILoggerService,
  ) {}

  async execute(input: PurchaseCreditsInput): Promise<Result<PurchaseCreditsOutput, DomainError>> {
    this.logger.info('Creating credits purchase session', {
      userId: input.userId,
      packId: input.packId,
      credits: input.credits,
    });

    // Validation
    if (!input.userId || !input.userEmail) {
      return failure(new ValidationError('userId et userEmail sont requis'));
    }

    if (!input.priceId) {
      return failure(new ValidationError('priceId est requis'));
    }

    if (input.credits <= 0) {
      return failure(new ValidationError('Le nombre de crédits doit être positif'));
    }

    // Créer la session de paiement
    const sessionOptions: CreateCheckoutSessionOptions = {
      userId: input.userId,
      userEmail: input.userEmail,
      priceId: input.priceId,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      couponId: input.couponId,
      metadata: {
        type: 'credits_purchase',
        userId: input.userId,
        packId: input.packId,
        credits: input.credits.toString(),
      },
    };

    const result = await this.paymentService.createCheckoutSession(sessionOptions);

    if (!result.success) {
      this.logger.error('Failed to create checkout session', result.error as Error, {
        userId: input.userId,
      });
      return failure(new PaymentError('Impossible de créer la session de paiement'));
    }

    this.logger.info('Checkout session created', {
      userId: input.userId,
      sessionId: result.data.sessionId,
    });

    return success({
      checkoutUrl: result.data.url,
      sessionId: result.data.sessionId,
    });
  }
}
