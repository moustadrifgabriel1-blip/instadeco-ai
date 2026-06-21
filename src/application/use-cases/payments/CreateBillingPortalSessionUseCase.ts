import { Result, success, failure } from '@/src/shared/types/Result';
import { IUserRepository } from '@/src/domain/ports/repositories/IUserRepository';
import { IPaymentService } from '@/src/domain/ports/services/IPaymentService';

/** Pas (encore) client Stripe → la route répond 400 (rediriger vers /pro). */
export class NoStripeCustomerError extends Error {
  readonly code = 'NO_STRIPE_CUSTOMER';
}

export interface CreateBillingPortalSessionInput {
  /** Toujours issu de la session. */
  userId: string;
  returnUrl: string;
}

/**
 * Use Case : ouvrir le portail de facturation Stripe pour l'utilisateur connecté.
 * Le customerId vient TOUJOURS du profil serveur (jamais du client). Sans client
 * Stripe (jamais abonné/acheté), on renvoie une erreur typée → la route invite à
 * découvrir les offres.
 */
export class CreateBillingPortalSessionUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly paymentService: IPaymentService,
  ) {}

  async execute(input: CreateBillingPortalSessionInput): Promise<Result<{ url: string }>> {
    const userResult = await this.userRepo.findById(input.userId);
    if (!userResult.success || !userResult.data) {
      return failure(new NoStripeCustomerError('Compte introuvable'));
    }

    const customerId = userResult.data.stripeCustomerId;
    if (!customerId) {
      return failure(new NoStripeCustomerError('Aucun abonnement ou achat associé à ce compte'));
    }

    return this.paymentService.createBillingPortalSession(customerId, input.returnUrl);
  }
}
