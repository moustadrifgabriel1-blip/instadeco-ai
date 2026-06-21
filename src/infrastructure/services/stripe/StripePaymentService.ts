import Stripe from 'stripe';
import { Result, success, failure } from '@/src/shared/types/Result';
import {
  IPaymentService,
  CreateCheckoutSessionOptions,
  CreateSubscriptionSessionOptions,
  CheckoutSessionResult,
  PaymentWebhookEvent
} from '@/src/domain/ports/services/IPaymentService';

/**
 * Adapter: Stripe Payment Service
 * Implémente IPaymentService avec Stripe API
 */
export class StripePaymentService implements IPaymentService {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }

    // Note: webhookSecret est optionnel pour les opérations de checkout
    // mais requis pour la vérification des webhooks
    if (!webhookSecret) {
      console.warn('[StripePaymentService] STRIPE_WEBHOOK_SECRET not set - webhook verification disabled');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });

    this.webhookSecret = webhookSecret;
  }

  async createCheckoutSession(options: CreateCheckoutSessionOptions): Promise<Result<CheckoutSessionResult>> {
    try {
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: options.userEmail,
        line_items: [
          {
            price: options.priceId,
            quantity: 1,
          },
        ],
        success_url: options.successUrl,
        cancel_url: options.cancelUrl,
        // Facturation B2B : adresse de facturation + numéro de TVA, et facture
        // conforme téléchargeable (indispensable pour qu'une agence déduise l'achat).
        billing_address_collection: 'required',
        tax_id_collection: { enabled: true },
        customer_creation: 'always',
        invoice_creation: { enabled: true },
        // Stripe Tax (TVA/autoliquidation B2B) : gaté par env, requiert une config
        // Stripe Tax dans le compte. Off par défaut pour ne jamais casser le checkout.
        automatic_tax: { enabled: process.env.STRIPE_TAX_ENABLED === 'true' },
        metadata: {
          ...options.metadata,
          // userId absent pour un achat invité : on n'écrit pas une clé vide.
          ...(options.userId ? { userId: options.userId } : {}),
        },
      };

      // Appliquer le coupon de réduction si fourni
      if (options.couponId) {
        sessionParams.discounts = [{ coupon: options.couponId }];
      }

      const session = await this.stripe.checkout.sessions.create(sessionParams);

      if (!session.url) {
        return failure(new Error('Checkout session URL not generated'));
      }

      return success({
        sessionId: session.id,
        url: session.url,
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return failure(new Error(`Failed to create checkout session: ${message}`));
    }
  }

  async createSubscriptionSession(options: CreateSubscriptionSessionOptions): Promise<Result<CheckoutSessionResult>> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer_email: options.userEmail,
        line_items: [{ price: options.priceId, quantity: 1 }],
        success_url: options.successUrl,
        cancel_url: options.cancelUrl,
        allow_promotion_codes: true,
        // Facturation B2B : adresse + numéro de TVA. Les abonnements génèrent
        // déjà une facture conforme à chaque cycle.
        billing_address_collection: 'required',
        tax_id_collection: { enabled: true },
        automatic_tax: { enabled: process.env.STRIPE_TAX_ENABLED === 'true' },
        metadata: options.metadata,
        subscription_data: { metadata: options.subscriptionMetadata },
      });

      if (!session.url) {
        return failure(new Error('Subscription session URL not generated'));
      }

      return success({ sessionId: session.id, url: session.url });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return failure(new Error(`Failed to create subscription session: ${message}`));
    }
  }

  async createBillingPortalSession(
    customerId: string,
    returnUrl: string,
  ): Promise<Result<{ url: string }>> {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
      return success({ url: session.url });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return failure(new Error(`Failed to create billing portal session: ${message}`));
    }
  }

  async retrieveSession(sessionId: string): Promise<Result<{
    id: string;
    paymentStatus: string;
    customerEmail: string;
    metadata: Record<string, string>;
  }>> {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);

      return success({
        id: session.id,
        paymentStatus: session.payment_status || 'unknown',
        customerEmail: session.customer_email || '',
        metadata: (session.metadata || {}) as Record<string, string>,
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return failure(new Error(`Failed to retrieve session: ${message}`));
    }
  }

  async verifyWebhook(payload: string, signature: string): Promise<Result<PaymentWebhookEvent>> {
    try {
      // Tolérant : STRIPE_WEBHOOK_SECRET peut contenir PLUSIEURS secrets séparés par
      // des virgules (plusieurs endpoints Stripe), avec d'éventuels espaces. On essaie
      // chacun ; l'event est valide dès qu'un secret correspond.
      const secrets = this.webhookSecret.split(',').map((s) => s.trim()).filter(Boolean);
      let event: Stripe.Event | null = null;
      for (const secret of secrets) {
        try {
          event = this.stripe.webhooks.constructEvent(payload, signature, secret);
          break;
        } catch {
          /* essaie le secret suivant */
        }
      }
      if (!event) {
        throw new Error('Signature webhook invalide (aucun secret ne correspond)');
      }

      const base = {
        eventId: event.id,
        type: event.type,
        sessionId: '',
        customerId: '',
        customerEmail: '',
        amountTotal: 0,
        metadata: {} as Record<string, string>,
      };

      // Achat / abonnement initial : checkout.session.completed (crédits OU subscription).
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        return success({
          ...base,
          sessionId: session.id,
          customerId: (session.customer as string) || '',
          customerEmail: session.customer_email || '',
          amountTotal: session.amount_total || 0,
          metadata: (session.metadata || {}) as Record<string, string>,
          subscriptionId: (session.subscription as string) || undefined,
        });
      }

      // Renouvellement d'abonnement (initial + cycles). billingReason distingue les deux.
      if (event.type === 'invoice.paid') {
        const invoice = event.data.object as Stripe.Invoice;
        const sub = (invoice as unknown as { subscription?: string | { id: string } }).subscription;
        const subscriptionId = typeof sub === 'string' ? sub : sub?.id;
        return success({
          ...base,
          customerId: (invoice.customer as string) || '',
          customerEmail: invoice.customer_email || '',
          amountTotal: invoice.amount_paid || 0,
          metadata: (invoice.metadata || {}) as Record<string, string>,
          subscriptionId: subscriptionId || undefined,
          billingReason: invoice.billing_reason || undefined,
          periodEnd: invoice.lines?.data?.[0]?.period?.end,
        });
      }

      // Annulation d'abonnement.
      if (event.type === 'customer.subscription.deleted') {
        const sub = event.data.object as Stripe.Subscription;
        return success({
          ...base,
          customerId: (sub.customer as string) || '',
          metadata: (sub.metadata || {}) as Record<string, string>,
          subscriptionId: sub.id,
        });
      }

      // Autres events : ignorés en amont (use-case), event minimal pour l'idempotence.
      return success(base);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return failure(new Error(`Webhook verification failed: ${message}`));
    }
  }

  async getOrCreateCustomer(email: string, userId: string): Promise<Result<string>> {
    try {
      // Chercher un client existant
      const existingCustomers = await this.stripe.customers.list({
        email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        return success(existingCustomers.data[0].id);
      }

      // Créer un nouveau client
      const customer = await this.stripe.customers.create({
        email,
        metadata: {
          userId,
        },
      });

      return success(customer.id);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return failure(new Error(`Failed to get/create customer: ${message}`));
    }
  }
}
