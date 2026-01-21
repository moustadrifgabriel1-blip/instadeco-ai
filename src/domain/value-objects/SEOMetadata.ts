/**
 * Value Object: SEOMetadata
 * 
 * Encapsule les métadonnées SEO d'un article.
 */

export interface SEOMetadataProps {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl?: string;
  ogImage?: string;
}

export class SEOMetadata {
  readonly title: string;
  readonly description: string;
  readonly keywords: string[];
  readonly canonicalUrl?: string;
  readonly ogImage?: string;

  private constructor(props: SEOMetadataProps) {
    this.title = props.title;
    this.description = props.description;
    this.keywords = props.keywords;
    this.canonicalUrl = props.canonicalUrl;
    this.ogImage = props.ogImage;
  }

  /**
   * Crée des métadonnées SEO avec validation
   */
  static create(props: SEOMetadataProps): SEOMetadata {
    const errors: string[] = [];

    // Validation du titre (55-65 caractères idéal)
    if (!props.title || props.title.length < 10) {
      errors.push('Le titre SEO doit avoir au moins 10 caractères');
    }
    if (props.title && props.title.length > 70) {
      errors.push('Le titre SEO ne doit pas dépasser 70 caractères');
    }

    // Validation de la description (150-160 caractères idéal)
    if (!props.description || props.description.length < 50) {
      errors.push('La meta description doit avoir au moins 50 caractères');
    }
    if (props.description && props.description.length > 170) {
      errors.push('La meta description ne doit pas dépasser 170 caractères');
    }

    // Validation des keywords
    if (!props.keywords || props.keywords.length === 0) {
      errors.push('Au moins un mot-clé est requis');
    }

    if (errors.length > 0) {
      throw new Error(`SEO Metadata invalide: ${errors.join(', ')}`);
    }

    return new SEOMetadata(props);
  }

  /**
   * Crée des métadonnées SEO sans validation stricte
   * (utile pour les données existantes)
   */
  static createUnsafe(props: SEOMetadataProps): SEOMetadata {
    return new SEOMetadata({
      title: props.title || '',
      description: props.description || '',
      keywords: props.keywords || [],
      canonicalUrl: props.canonicalUrl,
      ogImage: props.ogImage,
    });
  }

  /**
   * Retourne le titre tronqué si nécessaire
   */
  getTruncatedTitle(maxLength: number = 60): string {
    if (this.title.length <= maxLength) {
      return this.title;
    }
    return this.title.substring(0, maxLength - 3) + '...';
  }

  /**
   * Retourne la description tronquée si nécessaire
   */
  getTruncatedDescription(maxLength: number = 160): string {
    if (this.description.length <= maxLength) {
      return this.description;
    }
    return this.description.substring(0, maxLength - 3) + '...';
  }

  /**
   * Retourne les keywords sous forme de chaîne
   */
  getKeywordsString(): string {
    return this.keywords.join(', ');
  }
}
