import Stripe from 'stripe';
import { Result, success, failure } from '@/src/shared/types/Result';
import { 
  IPaymentService, 
  CreateCheckoutSessionOptions, 
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
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is required');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });

    this.webhookSecret = webhookSecret;
  }

  async createCheckoutSession(options: CreateCheckoutSessionOptions): Promise<Result<CheckoutSessionResult>> {
    try {
      const session = await this.stripe.checkout.sessions.create({
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
        metadata: {
          ...options.metadata,
          userId: options.userId,
        },
      });

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
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );

      // On ne traite que checkout.session.completed
      if (event.type !== 'checkout.session.completed') {
        return success({
          type: event.type,
          sessionId: '',
          customerId: '',
          customerEmail: '',
          amountTotal: 0,
          metadata: {},
        });
      }

      const session = event.data.object as Stripe.Checkout.Session;

      return success({
        type: event.type,
        sessionId: session.id,
        customerId: (session.customer as string) || '',
        customerEmail: session.customer_email || '',
        amountTotal: session.amount_total || 0,
        metadata: (session.metadata || {}) as Record<string, string>,
      });

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
