import { DomainError } from './DomainError';

/**
 * Erreur: Validation échouée
 */
export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;
  readonly field?: string;
  readonly details?: Record<string, string[]>;

  constructor(message: string, field?: string, details?: Record<string, string[]>) {
    super(message);
    this.field = field;
    this.details = details;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      field: this.field,
      details: this.details,
    };
  }
}
