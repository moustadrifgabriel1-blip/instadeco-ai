/**
 * Erreur: ArticleGenerationError
 * 
 * Levée lorsque la génération d'un article échoue.
 */

import { DomainError } from './DomainError';

export class ArticleGenerationError extends DomainError {
  readonly code = 'ARTICLE_GENERATION_ERROR';
  readonly statusCode = 500;
  readonly theme: string;
  readonly reason: string;

  constructor(theme: string, reason: string) {
    super(`Échec de génération pour le thème "${theme}": ${reason}`);
    this.theme = theme;
    this.reason = reason;
  }

  /**
   * Erreur: Service IA indisponible
   */
  static serviceUnavailable(theme: string): ArticleGenerationError {
    return new ArticleGenerationError(theme, 'Le service IA est temporairement indisponible');
  }

  /**
   * Erreur: Quota API dépassé
   */
  static quotaExceeded(theme: string): ArticleGenerationError {
    return new ArticleGenerationError(theme, 'Quota API dépassé');
  }

  /**
   * Erreur: Contenu invalide généré
   */
  static invalidContent(theme: string): ArticleGenerationError {
    return new ArticleGenerationError(theme, 'Le contenu généré est invalide ou vide');
  }

  /**
   * Erreur: Timeout
   */
  static timeout(theme: string): ArticleGenerationError {
    return new ArticleGenerationError(theme, 'Timeout lors de la génération');
  }

  /**
   * Erreur: Post-processing échoué
   */
  static postProcessingFailed(theme: string, details: string): ArticleGenerationError {
    return new ArticleGenerationError(theme, `Post-processing échoué: ${details}`);
  }
}
