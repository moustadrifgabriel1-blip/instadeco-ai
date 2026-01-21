import { DomainError } from './DomainError';

/**
 * Erreur: Génération non trouvée
 */
export class GenerationNotFoundError extends DomainError {
  readonly code = 'GENERATION_NOT_FOUND';
  readonly statusCode = 404;
  readonly generationId: string;

  constructor(generationId: string) {
    super(`Génération non trouvée: ${generationId}`);
    this.generationId = generationId;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      generationId: this.generationId,
    };
  }
}
