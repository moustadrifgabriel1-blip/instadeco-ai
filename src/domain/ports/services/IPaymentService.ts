import { Result } from '@/src/shared/types/Result';

/**
 * Options de création de session de paiement
 */
export interface CreateCheckoutSessionOptions {
  userId: string;
  userEmail: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

/**
 * Résultat de la création de session
 */
export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

/**
 * Événement de webhook Stripe
 */
export interface PaymentWebhookEvent {
  type: string;
  sessionId: string;
  customerId: string;
  customerEmail: string;
  amountTotal: number;
  metadata: Record<string, string>;
}

/**
 * Port Service - Payment
 * Interface pour la gestion des paiements (Stripe)
 */
export interface IPaymentService {
  /**
   * Crée une session de paiement
   */
  createCheckoutSession(options: CreateCheckoutSessionOptions): Promise<Result<CheckoutSessionResult>>;

  /**
   * Récupère une session de paiement
   */
  retrieveSession(sessionId: string): Promise<Result<{
    id: string;
    paymentStatus: string;
    customerEmail: string;
    metadata: Record<string, string>;
  }>>;

  /**
   * Vérifie et parse un webhook
   */
  verifyWebhook(payload: string, signature: string): Promise<Result<PaymentWebhookEvent>>;

  /**
   * Crée ou récupère un client Stripe
   */
  getOrCreateCustomer(email: string, userId: string): Promise<Result<string>>;
}
