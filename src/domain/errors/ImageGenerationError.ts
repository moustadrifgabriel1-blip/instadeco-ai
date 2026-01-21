import { DomainError } from './DomainError';

/**
 * Erreur: Échec de génération d'image
 */
export class ImageGenerationError extends DomainError {
  readonly code = 'IMAGE_GENERATION_FAILED';
  readonly statusCode = 500;
  readonly reason: string;

  constructor(reason: string) {
    super(`Échec de la génération d'image: ${reason}`);
    this.reason = reason;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      reason: this.reason,
    };
  }
}
