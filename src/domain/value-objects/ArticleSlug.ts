/**
 * Value Object: ArticleSlug
 * 
 * Représente un slug d'URL valide pour un article.
 * Garantit que le slug est toujours en format valide.
 */

export class ArticleSlug {
  private readonly value: string;

  private constructor(slug: string) {
    this.value = slug;
  }

  /**
   * Crée un ArticleSlug à partir d'une chaîne
   * @throws Error si le slug est invalide
   */
  static create(slug: string): ArticleSlug {
    const normalized = ArticleSlug.normalize(slug);
    
    if (!ArticleSlug.isValid(normalized)) {
      throw new Error(`Slug invalide: "${slug}"`);
    }
    
    return new ArticleSlug(normalized);
  }

  /**
   * Crée un ArticleSlug à partir d'un titre
   */
  static fromTitle(title: string): ArticleSlug {
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Retirer accents
      .replace(/[^a-z0-9\s-]/g, '')    // Garder alphanum + espaces + tirets
      .replace(/\s+/g, '-')            // Espaces → tirets
      .replace(/-+/g, '-')             // Éviter tirets multiples
      .replace(/^-|-$/g, '');          // Retirer tirets début/fin

    return new ArticleSlug(slug);
  }

  /**
   * Normalise un slug
   */
  private static normalize(slug: string): string {
    return slug
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Vérifie si un slug est valide
   */
  static isValid(slug: string): boolean {
    // Doit contenir uniquement lettres minuscules, chiffres et tirets
    // Doit avoir au moins 3 caractères
    // Ne doit pas commencer ou finir par un tiret
    const slugRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
    return slug.length >= 3 && slugRegex.test(slug);
  }

  /**
   * Retourne la valeur du slug
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Retourne la valeur sous forme de chaîne
   */
  toString(): string {
    return this.value;
  }

  /**
   * Compare avec un autre ArticleSlug
   */
  equals(other: ArticleSlug): boolean {
    return this.value === other.value;
  }
}
