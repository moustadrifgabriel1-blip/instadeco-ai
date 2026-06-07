import { Result, success, failure } from '@/src/shared/types/Result';
import { IPaymentService } from '@/src/domain/ports/services/IPaymentService';
import { ILoggerService } from '@/src/domain/ports/services/ILoggerService';
import { DomainError } from '@/src/domain/errors/DomainError';
import { PaymentError } from '@/src/domain/errors/PaymentError';
import { ValidationError } from '@/src/domain/errors/ValidationError';

/**
 * Input pour un achat de crédits SANS compte (guest checkout).
 */
export interface CreateGuestCheckoutInput {
  email: string;
  packId: string;
  credits: number;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  couponId?: string;
}

export interface CreateGuestCheckoutOutput {
  checkoutUrl: string;
  sessionId: string;
}

/**
 * Use Case: Achat de crédits invité.
 *
 * Crée une session Stripe SANS userId. Le compte sera matérialisé par le webhook
 * (`ProcessStripeWebhookUseCase`) à la réception de `checkout.session.completed`,
 * via l'email du client, puis crédité — de façon idempotente.
 */
export class CreateGuestCheckoutUseCase {
  constructor(
    private readonly paymentService: IPaymentService,
    private readonly logger: ILoggerService,
  ) {}

  async execute(
    input: CreateGuestCheckoutInput,
  ): Promise<Result<CreateGuestCheckoutOutput, DomainError>> {
    const email = input.email?.trim().toLowerCase();

    if (!email) {
      return failure(new ValidationError('email est requis'));
    }
    if (!input.priceId) {
      return failure(new ValidationError('priceId est requis'));
    }
    if (input.credits <= 0) {
      return failure(new ValidationError('Le nombre de crédits doit être positif'));
    }

    this.logger.info('Creating guest checkout session', {
      packId: input.packId,
      credits: input.credits,
    });

    const result = await this.paymentService.createCheckoutSession({
      // userId volontairement absent (guest).
      userEmail: email,
      priceId: input.priceId,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      couponId: input.couponId,
      metadata: {
        type: 'guest_credits_purchase',
        email,
        packId: input.packId,
        credits: input.credits.toString(),
      },
    });

    if (!result.success) {
      this.logger.error('Failed to create guest checkout session', result.error as Error);
      return failure(new PaymentError('Impossible de créer la session de paiement'));
    }

    return success({
      checkoutUrl: result.data.url,
      sessionId: result.data.sessionId,
    });
  }
}
