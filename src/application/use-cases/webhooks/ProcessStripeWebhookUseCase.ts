import { Result, success, failure } from '@/src/shared/types/Result';
import { ICreditRepository } from '@/src/domain/ports/repositories/ICreditRepository';
import { IProcessedEventRepository } from '@/src/domain/ports/repositories/IProcessedEventRepository';
import { IPaymentService, PaymentWebhookEvent } from '@/src/domain/ports/services/IPaymentService';
import { IGenerationRepository } from '@/src/domain/ports/repositories/IGenerationRepository';
import { ILoggerService } from '@/src/domain/ports/services/ILoggerService';
import { IAuthService } from '@/src/domain/ports/services/IAuthService';
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
    private readonly processedEventRepo: IProcessedEventRepository,
    /** Optionnel : requis uniquement pour le guest checkout (création de compte). */
    private readonly authService?: IAuthService,
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

    // 2. Traiter selon le type d'événement.
    //    Les événements à effet de bord (crédit) passent par le verrou
    //    d'idempotence afin que les rejeux Stripe ne re-créditent jamais.
    switch (event.type) {
      case 'checkout.session.completed':
        return this.withIdempotency(event, () => this.handleCheckoutCompleted(event));

      // case 'invoice.paid':  // abonnements : même protection via withIdempotency

      default:
        this.logger.debug('Unhandled webhook event', { type: event.type });
        return success({
          processed: false,
          eventType: event.type,
        });
    }
  }

  /**
   * Garde d'idempotence.
   *
   * Insère event.id dans `processed_stripe_events` AVANT de créditer.
   * L'insert sert de verrou atomique :
   *  - conflit (déjà présent) → rejeu légitime, on court-circuite (200, aucun re-crédit).
   *  - succès → on exécute le handler ; si celui-ci échoue, on annule le verrou
   *    pour qu'un futur rejeu Stripe puisse retraiter l'événement.
   */
  private async withIdempotency(
    event: PaymentWebhookEvent,
    handler: () => Promise<Result<ProcessWebhookOutput, DomainError>>,
  ): Promise<Result<ProcessWebhookOutput, DomainError>> {
    const markResult = await this.processedEventRepo.markProcessed(event.eventId, event.type);

    if (!markResult.success) {
      this.logger.error('Failed to acquire idempotency lock', markResult.error as Error);
      return failure(new PaymentError('Échec du verrou d\'idempotence'));
    }

    // false = événement déjà traité → on ne recrédite pas.
    if (!markResult.data) {
      this.logger.info('Duplicate webhook event ignored (idempotency)', {
        eventId: event.eventId,
        type: event.type,
      });
      return success({
        processed: false,
        eventType: event.type,
        action: 'duplicate_ignored',
      });
    }

    const result = await handler();

    // Le traitement a échoué : annuler le verrou pour permettre un rejeu.
    if (!result.success) {
      const unmark = await this.processedEventRepo.unmarkProcessed(event.eventId);
      if (!unmark.success) {
        this.logger.error('Failed to release idempotency lock after error', unmark.error as Error);
      }
    }

    return result;
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

    }

    if (type === 'guest_credits_purchase') {
      // Achat SANS compte : on matérialise/lie un compte par email, puis on crédite.
      if (!this.authService) {
        this.logger.error('Guest checkout reçu mais authService non configuré', undefined as unknown as Error);
        return failure(new PaymentError('Service d\'authentification indisponible'));
      }

      const credits = parseInt(metadata.credits, 10);
      const email = (metadata.email || event.customerEmail || '').trim().toLowerCase();

      if (!email || Number.isNaN(credits) || credits <= 0) {
        this.logger.error('Guest checkout : email ou crédits invalides', undefined as unknown as Error);
        return failure(new PaymentError('Données guest checkout invalides'));
      }

      // 1. Provisionner le compte (idempotent : réutilise un compte existant).
      const provision = await this.authService.provisionGuestForPurchase(email, credits);
      if (!provision.success) {
        this.logger.error('Échec provisionnement compte guest', provision.error as Error);
        return failure(new PaymentError('Échec de la création du compte'));
      }

      const { userId, created } = provision.data;

      // 2. Créditer (l'idempotence event-level empêche tout double crédit).
      const addResult = await this.creditRepo.addCredits(
        userId,
        credits,
        `Achat invité de ${credits} crédits`,
        event.sessionId,
      );

      if (!addResult.success) {
        this.logger.error('Échec ajout crédits (guest)', addResult.error as Error);
        return failure(new PaymentError('Échec de l\'ajout des crédits'));
      }

      this.logger.info('Crédits ajoutés (guest checkout)', {
        userId,
        credits,
        accountCreated: created,
        newBalance: addResult.data,
      });

      return success({
        processed: true,
        eventType: event.type,
        action: created ? 'guest_account_created_credits_added' : 'guest_credits_added',
      });
    }

    return success({
      processed: false,
      eventType: event.type,
    });
  }
}
