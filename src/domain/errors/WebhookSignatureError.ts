import { DomainError } from './DomainError';

/**
 * Erreur : signature de webhook Stripe invalide.
 *
 * Doit produire un HTTP 400 (et NON 200) : une signature invalide signifie une
 * requête forgée ou une mauvaise config — il ne faut pas répondre "received:true"
 * (sinon Stripe considère l'event livré et l'attaque/erreur passe inaperçue).
 * Le code est consommé par app/api/v2/webhooks/stripe/route.ts.
 */
export class WebhookSignatureError extends DomainError {
  readonly code = 'WEBHOOK_SIGNATURE_INVALID';
  readonly statusCode = 400;

  constructor(message = 'Signature webhook invalide') {
    super(message);
  }
}
