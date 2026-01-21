/**
 * DTO: BlogArticleDTO
 * 
 * Data Transfer Object pour les articles de blog.
 * Utilisé pour la communication entre couches.
 */

export interface BlogArticleDTO {
  id: string;
  title: string;
  slug: string;
  content: string;
  metaDescription: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  wordCount: number;
  readingTimeMinutes: number;
  antiAIScore: number;
  sessionType: 'morning' | 'afternoon' | 'evening';
  source: string;
  publishedAt: string; // ISO string
  createdAt: string;   // ISO string
  updatedAt: string;   // ISO string
}

/**
 * DTO pour la liste d'articles (version allégée)
 */
export interface BlogArticleListDTO {
  id: string;
  title: string;
  slug: string;
  metaDescription: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  wordCount: number;
  readingTimeMinutes: number;
  publishedAt: string;
}

/**
 * DTO pour la création d'article
 */
export interface CreateBlogArticleDTO {
  title: string;
  slug?: string;
  content: string;
  metaDescription: string;
  tags?: string[];
  status?: 'draft' | 'published';
  sessionType: 'morning' | 'afternoon' | 'evening';
  source?: string;
}

/**
 * DTO pour la mise à jour d'article
 */
export interface UpdateBlogArticleDTO {
  title?: string;
  content?: string;
  metaDescription?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
}

/**
 * DTO pour les résultats paginés
 */
export interface PaginatedBlogArticlesDTO {
  articles: BlogArticleListDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * DTO pour les paramètres de génération
 */
export interface GenerateArticleRequestDTO {
  theme: string;
  sessionType: 'morning' | 'afternoon' | 'evening';
}

/**
 * DTO pour le résultat de génération
 */
export interface GenerateArticleResponseDTO {
  success: boolean;
  article?: BlogArticleDTO;
  error?: string;
}
