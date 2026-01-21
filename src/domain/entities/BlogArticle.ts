/**
 * Entité BlogArticle
 * 
 * Représente un article de blog généré automatiquement pour le SEO.
 * Fait partie de la couche Domain (aucune dépendance externe).
 */

export type ArticleSessionType = 'morning' | 'afternoon' | 'evening';
export type ArticleStatusType = 'draft' | 'published' | 'archived';

export interface BlogArticle {
  /** Identifiant unique (UUID) */
  id: string;
  
  /** Titre de l'article (SEO optimisé, 55-65 caractères) */
  title: string;
  
  /** Slug URL-friendly (lowercase, tirets) */
  slug: string;
  
  /** Contenu HTML de l'article */
  content: string;
  
  /** Meta description pour SEO (150-160 caractères) */
  metaDescription: string;
  
  /** Tags/mots-clés de l'article */
  tags: string[];
  
  /** Statut de publication */
  status: ArticleStatusType;
  
  /** Nombre de mots */
  wordCount: number;
  
  /** Temps de lecture estimé en minutes */
  readingTimeMinutes: number;
  
  /** Score anti-IA (0-100, plus c'est haut mieux c'est) */
  antiAIScore: number;
  
  /** Type de session de génération */
  sessionType: ArticleSessionType;
  
  /** Source de l'article (ex: 'automation', 'manual') */
  source: string;
  
  /** Date de publication */
  publishedAt: Date;
  
  /** Date de création */
  createdAt: Date;
  
  /** Date de dernière modification */
  updatedAt: Date;
}

/**
 * Crée une nouvelle instance de BlogArticle
 */
export function createBlogArticle(params: {
  id: string;
  title: string;
  slug: string;
  content: string;
  metaDescription: string;
  tags?: string[];
  status?: ArticleStatusType;
  sessionType: ArticleSessionType;
  source?: string;
  antiAIScore?: number;
}): BlogArticle {
  const wordCount = countWords(params.content);
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 250));
  const now = new Date();

  return {
    id: params.id,
    title: params.title,
    slug: params.slug,
    content: params.content,
    metaDescription: params.metaDescription,
    tags: params.tags || [],
    status: params.status || 'published',
    wordCount,
    readingTimeMinutes,
    antiAIScore: params.antiAIScore || 0,
    sessionType: params.sessionType,
    source: params.source || 'automation',
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Compte les mots dans un contenu HTML
 */
function countWords(htmlContent: string): number {
  // Retirer les balises HTML
  const textContent = htmlContent.replace(/<[^>]*>/g, ' ');
  // Compter les mots
  return textContent
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Génère un slug à partir d'un titre
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Retirer les accents
    .replace(/[^a-z0-9\s-]/g, '') // Garder uniquement alphanum, espaces, tirets
    .replace(/\s+/g, '-') // Remplacer espaces par tirets
    .replace(/-+/g, '-') // Éviter tirets multiples
    .replace(/^-|-$/g, ''); // Retirer tirets début/fin
}
