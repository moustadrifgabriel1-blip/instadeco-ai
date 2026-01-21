/**
 * Value Object: ArticleStatus
 * 
 * Représente le statut de publication d'un article.
 */

export type ArticleStatusValue = 'draft' | 'published' | 'archived';

export class ArticleStatus {
  private readonly value: ArticleStatusValue;

  private constructor(status: ArticleStatusValue) {
    this.value = status;
  }

  /**
   * Crée un ArticleStatus
   */
  static create(status: string): ArticleStatus {
    if (!ArticleStatus.isValid(status)) {
      throw new Error(`Statut d'article invalide: "${status}"`);
    }
    return new ArticleStatus(status as ArticleStatusValue);
  }

  /**
   * Statut brouillon
   */
  static draft(): ArticleStatus {
    return new ArticleStatus('draft');
  }

  /**
   * Statut publié
   */
  static published(): ArticleStatus {
    return new ArticleStatus('published');
  }

  /**
   * Statut archivé
   */
  static archived(): ArticleStatus {
    return new ArticleStatus('archived');
  }

  /**
   * Vérifie si un statut est valide
   */
  static isValid(status: string): boolean {
    return ['draft', 'published', 'archived'].includes(status);
  }

  /**
   * Retourne la valeur
   */
  getValue(): ArticleStatusValue {
    return this.value;
  }

  /**
   * Vérifie si l'article est publié
   */
  isPublished(): boolean {
    return this.value === 'published';
  }

  /**
   * Vérifie si l'article est un brouillon
   */
  isDraft(): boolean {
    return this.value === 'draft';
  }

  /**
   * Vérifie si l'article est archivé
   */
  isArchived(): boolean {
    return this.value === 'archived';
  }

  /**
   * Compare avec un autre ArticleStatus
   */
  equals(other: ArticleStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
