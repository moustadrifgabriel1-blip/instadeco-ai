import { DomainError } from './DomainError';

/**
 * Erreur : re-roll gratuit refusé.
 *
 * Le re-roll gratuit rejoue une génération jugée ratée par l'utilisateur sans
 * débiter de crédit. Règles : la génération d'origine doit exister, appartenir
 * à l'utilisateur, être terminée, ne pas être elle-même un re-roll, et ne pas
 * avoir déjà été refaite (1 seul re-roll gratuit par génération).
 */
export class RerollNotAllowedError extends DomainError {
  readonly code = 'REROLL_NOT_ALLOWED';
  readonly statusCode = 400;

  constructor(message = 'Régénération gratuite indisponible pour ce rendu.') {
    super(message);
  }
}
