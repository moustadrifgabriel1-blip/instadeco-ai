import { DomainError } from './DomainError';

/**
 * Erreur: Paiement échoué
 */
export class PaymentError extends DomainError {
  readonly code = 'PAYMENT_FAILED';
  readonly statusCode = 402;
  readonly reason: string;

  constructor(reason: string) {
    super(`Erreur de paiement: ${reason}`);
    this.reason = reason;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      reason: this.reason,
    };
  }
}
