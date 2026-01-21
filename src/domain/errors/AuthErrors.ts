import { DomainError } from './DomainError';

/**
 * Erreur: Accès non autorisé
 */
export class UnauthorizedError extends DomainError {
  readonly code = 'UNAUTHORIZED';
  readonly statusCode = 401;

  constructor(message = 'Accès non autorisé') {
    super(message);
  }
}

/**
 * Erreur: Accès interdit
 */
export class ForbiddenError extends DomainError {
  readonly code = 'FORBIDDEN';
  readonly statusCode = 403;

  constructor(message = 'Accès interdit') {
    super(message);
  }
}
