import { DomainError } from './DomainError';

/**
 * Erreur : plafond d'usage équitable (fair-use) de l'abonnement illimité atteint.
 *
 * Levée sur le chemin illimité (Pro/Agence) quand l'utilisateur dépasse le volume
 * raisonnable sur la période glissante. Ce n'est pas un manque de crédits : c'est
 * un garde-fou COGS + l'application de bonne foi du fair-use des CGV.
 */
export class FairUseLimitError extends DomainError {
  readonly code = 'FAIR_USE_LIMIT';
  readonly statusCode = 429;
  readonly used: number;
  readonly cap: number;

  constructor(used: number, cap: number) {
    super(
      `Usage exceptionnellement élevé ce mois-ci (${used}/${cap}). Contactez-nous pour adapter votre formule.`,
    );
    this.used = used;
    this.cap = cap;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      used: this.used,
      cap: this.cap,
    };
  }
}
