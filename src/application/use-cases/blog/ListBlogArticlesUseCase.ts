/**
 * Use Case: ListBlogArticlesUseCase
 * 
 * Liste les articles de blog avec pagination et filtres.
 */

import { IBlogArticleRepository, BlogArticleFilters, PaginationOptions } from '../../../domain/ports/repositories/IBlogArticleRepository';
import { PaginatedBlogArticlesDTO } from '../../dtos/BlogArticleDTO';
import { BlogArticleMapper } from '../../mappers/BlogArticleMapper';

export interface ListBlogArticlesInput {
  /** Filtrer par statut */
  status?: 'draft' | 'published' | 'archived';
  /** Filtrer par tags */
  tags?: string[];
  /** Recherche dans le titre */
  search?: string;
  /** Numéro de page (1-indexed) */
  page?: number;
  /** Nombre d'éléments par page */
  limit?: number;
  /** Tri par champ */
  sortBy?: 'publishedAt' | 'createdAt' | 'title';
  /** Ordre de tri */
  sortOrder?: 'asc' | 'desc';
}

export class ListBlogArticlesUseCase {
  constructor(
    private readonly articleRepository: IBlogArticleRepository
  ) {}

  async execute(input: ListBlogArticlesInput = {}): Promise<PaginatedBlogArticlesDTO> {
    const {
      status = 'published',
      tags,
      search,
      page = 1,
      limit = 10,
      sortBy = 'publishedAt',
      sortOrder = 'desc',
    } = input;

    // Construire les filtres
    const filters: BlogArticleFilters = {
      status,
    };

    if (tags && tags.length > 0) {
      filters.tags = tags;
    }

    if (search) {
      filters.searchTitle = search;
    }

    // Construire les options de pagination
    const pagination: PaginationOptions = {
      page,
      limit,
      sortBy,
      sortOrder,
    };

    // Exécuter la requête
    const result = await this.articleRepository.findMany(filters, pagination);

    // Convertir en DTOs
    const articleDTOs = BlogArticleMapper.toListDTOArray(result.data);

    return {
      articles: articleDTOs,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}
