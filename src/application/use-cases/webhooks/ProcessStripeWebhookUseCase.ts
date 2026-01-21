import { Result, success, failure } from '@/src/shared/types/Result';
import { ICreditRepository } from '@/src/domain/ports/repositories/ICreditRepository';
import { IPaymentService, PaymentWebhookEvent } from '@/src/domain/ports/services/IPaymentService';
import { IGenerationRepository } from '@/src/domain/ports/repositories/IGenerationRepository';
import { ILoggerService } from '@/src/domain/ports/services/ILoggerService';
import { DomainError } from '@/src/domain/errors/DomainError';
import { PaymentError } from '@/src/domain/errors/PaymentError';

/**
 * Input pour le traitement du webhook
 */
export interface ProcessWebhookInput {
  payload: string;
  signature: string;
}

/**
 * Output
 */
export interface ProcessWebhookOutput {
  processed: boolean;
  eventType: string;
  action?: string;
}

/**
 * Use Case: Traiter les webhooks Stripe
 * 
 * Gère les événements:
 * - checkout.session.completed (crédits ou HD unlock)
 */
export class ProcessStripeWebhookUseCase {
  constructor(
    private readonly creditRepo: ICreditRepository,
    private readonly generationRepo: IGenerationRepository,
    private readonly paymentService: IPaymentService,
    private readonly logger: ILoggerService,
  ) {}

  async execute(input: ProcessWebhookInput): Promise<Result<ProcessWebhookOutput, DomainError>> {
    // 1. Vérifier et parser le webhook
    const verifyResult = await this.paymentService.verifyWebhook(
      input.payload,
      input.signature,
    );

    if (!verifyResult.success) {
      this.logger.error('Webhook verification failed', verifyResult.error as Error);
      return failure(new PaymentError('Signature webhook invalide'));
    }

    const event = verifyResult.data;

    this.logger.info('Processing webhook event', {
      type: event.type,
      sessionId: event.sessionId,
    });

    // 2. Traiter selon le type d'événement
    switch (event.type) {
      case 'checkout.session.completed':
        return this.handleCheckoutCompleted(event);

      default:
        this.logger.debug('Unhandled webhook event', { type: event.type });
        return success({
          processed: false,
          eventType: event.type,
        });
    }
  }

  private async handleCheckoutCompleted(
    event: PaymentWebhookEvent
  ): Promise<Result<ProcessWebhookOutput, DomainError>> {
    const { metadata } = event;
    const type = metadata.type;

    this.logger.info('Handling checkout completed', {
      type,
      userId: metadata.userId,
    });

    if (type === 'credits_purchase') {
      // Achat de crédits
      const credits = parseInt(metadata.credits, 10);
      const userId = metadata.userId;

      const addResult = await this.creditRepo.addCredits(
        userId,
        credits,
        `Achat de ${credits} crédits`,
        event.sessionId,
      );

      if (!addResult.success) {
        this.logger.error('Failed to add credits from webhook', addResult.error as Error);
        return failure(new PaymentError('Échec de l\'ajout des crédits'));
      }

      this.logger.info('Credits added from webhook', {
        userId,
        credits,
        newBalance: addResult.data,
      });

      return success({
        processed: true,
        eventType: event.type,
        action: 'credits_added',
      });

    } else if (type === 'hd_unlock') {
      // Déblocage HD
      const generationId = metadata.generationId;

      const updateResult = await this.generationRepo.update(generationId, {
        hdUnlocked: true,
        stripeSessionId: event.sessionId,
      });

      if (!updateResult.success) {
        this.logger.error('Failed to unlock HD from webhook', updateResult.error as Error);
        return failure(new PaymentError('Échec du déblocage HD'));
      }

      this.logger.info('HD unlocked from webhook', {
        generationId,
      });

      return success({
        processed: true,
        eventType: event.type,
        action: 'hd_unlocked',
      });
    }

    return success({
      processed: false,
      eventType: event.type,
    });
  }
}
