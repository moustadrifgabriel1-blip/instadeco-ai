import { DomainError } from './DomainError';

/**
 * Erreur: Crédits insuffisants
 */
export class InsufficientCreditsError extends DomainError {
  readonly code = 'INSUFFICIENT_CREDITS';
  readonly statusCode = 402;
  readonly currentCredits: number;
  readonly requiredCredits: number;

  constructor(currentCredits: number, requiredCredits: number) {
    super(
      `Crédits insuffisants: ${currentCredits} disponibles, ${requiredCredits} requis`
    );
    this.currentCredits = currentCredits;
    this.requiredCredits = requiredCredits;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      currentCredits: this.currentCredits,
      requiredCredits: this.requiredCredits,
    };
  }
}
