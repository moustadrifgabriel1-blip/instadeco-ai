/**
 * Erreur: DuplicateArticleError
 * 
 * Levée lorsqu'un article avec un titre ou slug similaire existe déjà.
 */

import { DomainError } from './DomainError';

export type DuplicateType = 'title' | 'slug' | 'keyword';

export class DuplicateArticleError extends DomainError {
  readonly code = 'DUPLICATE_ARTICLE_ERROR';
  readonly statusCode = 409;
  readonly duplicateType: DuplicateType;
  readonly duplicateValue: string;
  readonly existingArticleId?: string;

  constructor(
    duplicateType: DuplicateType,
    duplicateValue: string,
    existingArticleId?: string
  ) {
    const typeLabel = {
      title: 'titre',
      slug: 'slug',
      keyword: 'mot-clé',
    }[duplicateType];

    super(`Un article avec ce ${typeLabel} existe déjà: "${duplicateValue}"`);
    
    this.duplicateType = duplicateType;
    this.duplicateValue = duplicateValue;
    this.existingArticleId = existingArticleId;
  }

  /**
   * Erreur: Titre similaire existe
   */
  static titleExists(title: string, existingId?: string): DuplicateArticleError {
    return new DuplicateArticleError('title', title, existingId);
  }

  /**
   * Erreur: Slug existe déjà
   */
  static slugExists(slug: string, existingId?: string): DuplicateArticleError {
    return new DuplicateArticleError('slug', slug, existingId);
  }

  /**
   * Erreur: Mot-clé utilisé récemment
   */
  static keywordUsedRecently(keyword: string): DuplicateArticleError {
    return new DuplicateArticleError('keyword', keyword);
  }
}
