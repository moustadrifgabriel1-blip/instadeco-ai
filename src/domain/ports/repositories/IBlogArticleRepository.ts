/**
 * Port: IBlogArticleRepository
 * 
 * Interface définissant le contrat pour la persistance des articles de blog.
 * Fait partie de la couche Domain (aucune dépendance d'implémentation).
 */

import { BlogArticle, ArticleSessionType, ArticleStatusType } from '../../entities/BlogArticle';

export interface BlogArticleFilters {
  /** Filtrer par statut */
  status?: ArticleStatusType;
  /** Filtrer par session */
  sessionType?: ArticleSessionType;
  /** Filtrer par tags (au moins un match) */
  tags?: string[];
  /** Recherche dans le titre */
  searchTitle?: string;
  /** Date de publication minimale */
  publishedAfter?: Date;
  /** Date de publication maximale */
  publishedBefore?: Date;
}

export interface PaginationOptions {
  /** Numéro de page (1-indexed) */
  page?: number;
  /** Nombre d'éléments par page */
  limit?: number;
  /** Tri par champ */
  sortBy?: 'publishedAt' | 'createdAt' | 'title' | 'wordCount';
  /** Ordre de tri */
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IBlogArticleRepository {
  /**
   * Sauvegarde un nouvel article
   */
  save(article: BlogArticle): Promise<BlogArticle>;

  /**
   * Met à jour un article existant
   */
  update(article: BlogArticle): Promise<BlogArticle>;

  /**
   * Trouve un article par son ID
   */
  findById(id: string): Promise<BlogArticle | null>;

  /**
   * Trouve un article par son slug
   */
  findBySlug(slug: string): Promise<BlogArticle | null>;

  /**
   * Liste les articles avec filtres et pagination
   */
  findMany(
    filters?: BlogArticleFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<BlogArticle>>;

  /**
   * Compte le nombre d'articles correspondant aux filtres
   */
  count(filters?: BlogArticleFilters): Promise<number>;

  /**
   * Supprime un article
   */
  delete(id: string): Promise<void>;

  /**
   * Vérifie si un slug existe déjà
   */
  slugExists(slug: string): Promise<boolean>;

  /**
   * Vérifie si un titre similaire existe (pour déduplication)
   * @param title Le titre à vérifier
   * @param thresholdDays Nombre de jours à vérifier (défaut: 60)
   */
  titleExistsSimilar(title: string, thresholdDays?: number): Promise<boolean>;

  /**
   * Vérifie si un mot-clé/tag a été utilisé récemment
   * @param keyword Le mot-clé à vérifier
   * @param thresholdDays Nombre de jours à vérifier (défaut: 30)
   */
  keywordUsedRecently(keyword: string, thresholdDays?: number): Promise<boolean>;

  /**
   * Récupère les articles les plus récents
   */
  findLatest(limit?: number): Promise<BlogArticle[]>;

  /**
   * Récupère les articles liés (même tags)
   */
  findRelated(articleId: string, limit?: number): Promise<BlogArticle[]>;
}
