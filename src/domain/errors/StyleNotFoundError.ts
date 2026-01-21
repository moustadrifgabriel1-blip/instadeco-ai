import { DomainError } from './DomainError';

/**
 * Erreur: Style non trouvé
 */
export class StyleNotFoundError extends DomainError {
  readonly code = 'STYLE_NOT_FOUND';
  readonly statusCode = 404;
  readonly styleSlug: string;

  constructor(styleSlug: string) {
    super(`Style non trouvé: ${styleSlug}`);
    this.styleSlug = styleSlug;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      styleSlug: this.styleSlug,
    };
  }
}
