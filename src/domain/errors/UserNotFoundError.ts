import { DomainError } from './DomainError';

/**
 * Erreur: Utilisateur non trouvé
 */
export class UserNotFoundError extends DomainError {
  readonly code = 'USER_NOT_FOUND';
  readonly statusCode = 404;
  readonly userId: string;

  constructor(userId: string) {
    super(`Utilisateur non trouvé: ${userId}`);
    this.userId = userId;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      userId: this.userId,
    };
  }
}
