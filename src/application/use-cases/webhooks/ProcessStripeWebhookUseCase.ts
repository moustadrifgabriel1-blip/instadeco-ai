import { Result, success, failure } from '@/src/shared/types/Result';
import { ICreditRepository } from '@/src/domain/ports/repositories/ICreditRepository';
import { IProcessedEventRepository } from '@/src/domain/ports/repositories/IProcessedEventRepository';
import { IPaymentService, PaymentWebhookEvent } from '@/src/domain/ports/services/IPaymentService';
import { IGenerationRepository } from '@/src/domain/ports/repositories/IGenerationRepository';
import { IUserRepository } from '@/src/domain/ports/repositories/IUserRepository';
import { IOrganizationRepository } from '@/src/domain/ports/repositories/IOrganizationRepository';
import { ILoggerService } from '@/src/domain/ports/services/ILoggerService';
import { IAuthService } from '@/src/domain/ports/services/IAuthService';
import type { ProPlan } from '@/src/domain/entities/User';
import { DomainError } from '@/src/domain/errors/DomainError';
import { PaymentError } from '@/src/domain/errors/PaymentError';
import { WebhookSignatureError } from '@/src/domain/errors/WebhookSignatureError';

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
  /**
   * Intention d'email de confirmation. Le use-case reste pur (ne fait pas l'envoi) :
   * c'est la route webhook (frontière infra) qui envoie l'email en best-effort.
   */
  confirmationEmail?: {
    to: string;
    kind: 'credits' | 'subscription';
    credits?: number;
    planName?: string;
  };
}

/** Libellés des plans pour l'email de confirmation. */
const PLAN_LABEL: Record<string, string> = { solo: 'Solo', pro: 'Pro', agence: 'Agence' };

/**
 * Mapping plan d'abonnement → profil.
 * Solo = quota mensuel crédité (ledger) ; Pro/Agence = illimité (pas de débit à la génération).
 */
const SUBSCRIPTION_PLANS: Record<string, { proPlan: ProPlan; monthlyCredits: number; unlimited: boolean }> = {
  solo: { proPlan: 'solo', monthlyCredits: 40, unlimited: false },
  pro: { proPlan: 'pro', monthlyCredits: 0, unlimited: true },
  agence: { proPlan: 'agence', monthlyCredits: 0, unlimited: true },
};

/**
 * Quantités de crédits valides = les seuls packs vendus (pack_10/25/50/100).
 * Defense en profondeur : même si l'event est signé, on ne crédite jamais une
 * quantité hors de cet ensemble (rempart contre une metadata.credits forgée ou
 * un futur mauvais mapping pack -> crédits). Coupon-safe (la quantité de crédits
 * ne dépend pas du montant payé).
 */
const VALID_CREDIT_AMOUNTS = new Set([10, 25, 50, 100]);

/**
 * Use Case: Traiter les webhooks Stripe
 *
 * Gère les événements:
 * - checkout.session.completed (crédits, HD unlock, ou abonnement)
 * - invoice.paid (renouvellement d'abonnement)
 * - customer.subscription.deleted (annulation)
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
    /** Optionnel : requis pour les abonnements (activation/renouvellement/annulation). */
    private readonly userRepo?: IUserRepository,
    /** Optionnel : requis pour l'offre Agence (création/maj de l'organisation). */
    private readonly orgRepo?: IOrganizationRepository,
  ) {}

  async execute(input: ProcessWebhookInput): Promise<Result<ProcessWebhookOutput, DomainError>> {
    // 1. Vérifier et parser le webhook
    const verifyResult = await this.paymentService.verifyWebhook(
      input.payload,
      input.signature,
    );

    if (!verifyResult.success) {
      this.logger.error('Webhook verification failed', verifyResult.error as Error);
      // Signature invalide → HTTP 400 (code dédié consommé par la route), pas 200.
      return failure(new WebhookSignatureError());
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

      case 'invoice.paid':
        return this.withIdempotency(event, () => this.handleInvoicePaid(event));

      case 'customer.subscription.deleted':
        return this.withIdempotency(event, () => this.handleSubscriptionDeleted(event));

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

    // Abonnement immobilier (Solo / Pro illimité / Agence)
    if (type === 'subscription') {
      return this.handleSubscriptionActivation(event);
    }

    if (type === 'credits_purchase') {
      // Achat de crédits
      const credits = parseInt(metadata.credits, 10);
      const userId = metadata.userId;

      // Defense en profondeur : ne jamais créditer une quantité hors des packs connus.
      if (!VALID_CREDIT_AMOUNTS.has(credits)) {
        this.logger.error('Webhook crédits: quantité hors packs connus, rejetée', undefined as unknown as Error, { userId, credits });
        return failure(new PaymentError('Quantité de crédits invalide'));
      }

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

      let to = (event.customerEmail || '').trim();
      if (!to && this.userRepo) {
        const u = await this.userRepo.findById(userId);
        if (u.success && u.data) to = u.data.email;
      }

      return success({
        processed: true,
        eventType: event.type,
        action: 'credits_added',
        confirmationEmail: to ? { to, kind: 'credits', credits } : undefined,
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

      if (!email || !VALID_CREDIT_AMOUNTS.has(credits)) {
        this.logger.error('Guest checkout : email ou crédits invalides', undefined as unknown as Error, { credits });
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
        // L'email guest reçoit déjà le magic link (compte créé) ; sinon, confirmation d'achat.
        confirmationEmail: created ? undefined : { to: email, kind: 'credits', credits },
      });
    }

    return success({
      processed: false,
      eventType: event.type,
    });
  }

  /** Activation initiale d'un abonnement (checkout.session.completed, type=subscription). */
  private async handleSubscriptionActivation(
    event: PaymentWebhookEvent,
  ): Promise<Result<ProcessWebhookOutput, DomainError>> {
    if (!this.userRepo) {
      this.logger.error('Abonnement reçu mais userRepo non configuré', undefined as unknown as Error);
      return failure(new PaymentError('Service utilisateur indisponible'));
    }

    const userId = event.metadata.userId;
    const planId = event.metadata.planId;
    const cfg = SUBSCRIPTION_PLANS[planId];

    if (!userId || !cfg) {
      this.logger.error('Abonnement: userId ou plan invalide', undefined as unknown as Error, { userId, planId });
      return failure(new PaymentError('Données abonnement invalides'));
    }

    // Mapping Stripe + statut actif (Pro/Agence = illimité).
    const upd = await this.userRepo.update(userId, {
      stripeCustomerId: event.customerId || undefined,
      stripeSubscriptionId: event.subscriptionId ?? null,
      proPlan: cfg.proPlan,
      proStatus: 'active',
    });
    if (!upd.success) {
      this.logger.error('Échec activation abonnement (update profil)', upd.error as Error, { userId });
      return failure(new PaymentError('Échec de l\'activation de l\'abonnement'));
    }

    // Solo : créditer le quota du mois. Pro/Agence : illimité → aucun crédit.
    if (cfg.monthlyCredits > 0) {
      const credit = await this.creditRepo.addCredits(
        userId,
        cfg.monthlyCredits,
        `Abonnement ${cfg.proPlan} — crédits du mois`,
        event.subscriptionId,
        'purchase',
      );
      if (!credit.success) {
        // Abonnement actif quand même ; régularisation possible au prochain cycle.
        this.logger.error('CRITICAL: abonnement activé mais crédits non accordés', credit.error as Error, { userId, planId });
      }
    }

    // Agence : provisionner l'organisation (idempotent : une seule org par subscription).
    if (cfg.proPlan === 'agence' && this.orgRepo && event.subscriptionId) {
      const existing = await this.orgRepo.findBySubscriptionId(event.subscriptionId);
      if (existing.success && !existing.data) {
        let ownerEmail = event.customerEmail;
        if (!ownerEmail && this.userRepo) {
          const u = await this.userRepo.findById(userId);
          ownerEmail = u.success && u.data ? u.data.email : '';
        }
        const created = await this.orgRepo.create({
          ownerId: userId,
          ownerEmail: ownerEmail || `${userId}@no-email.local`,
          name: 'Mon agence',
          seats: 3,
          stripeCustomerId: event.customerId || null,
          stripeSubscriptionId: event.subscriptionId,
        });
        if (!created.success) {
          // L'abonnement reste actif ; non bloquant (org recréable au renouvellement).
          this.logger.error('Agence: échec création organisation', created.error as Error, { userId });
        } else {
          this.logger.info('Organisation Agence créée', { userId, orgId: created.data.id });
        }
      }
    }

    let subEmail = (event.customerEmail || '').trim();
    if (!subEmail && this.userRepo) {
      const u = await this.userRepo.findById(userId);
      if (u.success && u.data) subEmail = u.data.email;
    }

    this.logger.info('Abonnement activé', { userId, plan: cfg.proPlan, unlimited: cfg.unlimited });
    return success({
      processed: true,
      eventType: event.type,
      action: `subscription_activated_${cfg.proPlan}`,
      confirmationEmail: subEmail
        ? { to: subEmail, kind: 'subscription', planName: PLAN_LABEL[cfg.proPlan] ?? cfg.proPlan }
        : undefined,
    });
  }

  /** Renouvellement (invoice.paid). billingReason distingue initial vs cycle. */
  private async handleInvoicePaid(
    event: PaymentWebhookEvent,
  ): Promise<Result<ProcessWebhookOutput, DomainError>> {
    if (!this.userRepo) {
      return failure(new PaymentError('Service utilisateur indisponible'));
    }
    if (!event.subscriptionId) {
      return success({ processed: false, eventType: event.type, action: 'no_subscription' });
    }

    const found = await this.userRepo.findByStripeSubscriptionId(event.subscriptionId);
    if (!found.success) {
      return failure(new PaymentError('Échec lecture abonnement'));
    }
    const user = found.data;
    if (!user || !user.proPlan) {
      // Mapping pas encore posé (l'activation checkout le fera) → ignoré sans erreur.
      this.logger.info('invoice.paid sans profil mappé (ignoré)', { subscriptionId: event.subscriptionId });
      return success({ processed: false, eventType: event.type, action: 'unmapped' });
    }

    const cfg = SUBSCRIPTION_PLANS[user.proPlan];
    const renewsAt = event.periodEnd ? new Date(event.periodEnd * 1000) : undefined;

    const upd = await this.userRepo.update(user.id, {
      proStatus: 'active',
      ...(renewsAt ? { proRenewsAt: renewsAt } : {}),
    });
    if (!upd.success) {
      this.logger.error('Échec maj renouvellement', upd.error as Error, { userId: user.id });
      return failure(new PaymentError('Échec du renouvellement'));
    }

    // Recharge crédits UNIQUEMENT sur un cycle (l'initial a déjà été crédité à l'activation)
    // et seulement pour les plans à quota (Solo).
    if (event.billingReason === 'subscription_cycle' && cfg && cfg.monthlyCredits > 0) {
      const credit = await this.creditRepo.addCredits(
        user.id,
        cfg.monthlyCredits,
        `Abonnement ${cfg.proPlan} — renouvellement mensuel`,
        event.subscriptionId,
        'purchase',
      );
      if (!credit.success) {
        this.logger.error('CRITICAL: renouvellement sans recharge crédits', credit.error as Error, { userId: user.id });
        return failure(new PaymentError('Échec de la recharge mensuelle'));
      }
    }

    // Agence : prolonger l'organisation (statut actif + date de renouvellement).
    if (user.proPlan === 'agence' && this.orgRepo && event.subscriptionId) {
      const org = await this.orgRepo.findBySubscriptionId(event.subscriptionId);
      if (org.success && org.data) {
        await this.orgRepo.update(org.data.id, { status: 'active', ...(renewsAt ? { renewsAt } : {}) });
      }
    }

    this.logger.info('Abonnement renouvelé', { userId: user.id, plan: user.proPlan, reason: event.billingReason });
    return success({ processed: true, eventType: event.type, action: `subscription_renewed_${user.proPlan}` });
  }

  /** Annulation (customer.subscription.deleted) → statut canceled. */
  private async handleSubscriptionDeleted(
    event: PaymentWebhookEvent,
  ): Promise<Result<ProcessWebhookOutput, DomainError>> {
    if (!this.userRepo) {
      return failure(new PaymentError('Service utilisateur indisponible'));
    }
    if (!event.subscriptionId) {
      return success({ processed: false, eventType: event.type });
    }

    const found = await this.userRepo.findByStripeSubscriptionId(event.subscriptionId);
    if (!found.success) {
      return failure(new PaymentError('Échec lecture abonnement'));
    }
    if (!found.data) {
      return success({ processed: false, eventType: event.type, action: 'unmapped' });
    }

    const upd = await this.userRepo.update(found.data.id, { proStatus: 'canceled' });
    if (!upd.success) {
      this.logger.error('Échec annulation abonnement', upd.error as Error, { userId: found.data.id });
      return failure(new PaymentError('Échec de l\'annulation'));
    }

    // Agence : désactiver l'organisation (les membres perdent l'illimité).
    if (this.orgRepo && event.subscriptionId) {
      const org = await this.orgRepo.findBySubscriptionId(event.subscriptionId);
      if (org.success && org.data) {
        await this.orgRepo.update(org.data.id, { status: 'canceled' });
      }
    }

    this.logger.info('Abonnement annulé', { userId: found.data.id });
    return success({ processed: true, eventType: event.type, action: 'subscription_canceled' });
  }
}
