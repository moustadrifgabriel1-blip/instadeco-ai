/**
 * Use Case: GetBlogArticleBySlugUseCase
 * 
 * Récupère un article de blog par son slug.
 */

import { IBlogArticleRepository } from '../../../domain/ports/repositories/IBlogArticleRepository';
import { BlogArticleDTO, BlogArticleListDTO } from '../../dtos/BlogArticleDTO';
import { BlogArticleMapper } from '../../mappers/BlogArticleMapper';

export interface GetBlogArticleBySlugInput {
  slug: string;
  /** Inclure les articles liés */
  includeRelated?: boolean;
  /** Nombre d'articles liés à récupérer */
  relatedLimit?: number;
}

export interface GetBlogArticleBySlugOutput {
  article: BlogArticleDTO | null;
  relatedArticles?: BlogArticleListDTO[];
}

export class GetBlogArticleBySlugUseCase {
  constructor(
    private readonly articleRepository: IBlogArticleRepository
  ) {}

  async execute(input: GetBlogArticleBySlugInput): Promise<GetBlogArticleBySlugOutput> {
    const { slug, includeRelated = false, relatedLimit = 3 } = input;

    // Récupérer l'article
    const article = await this.articleRepository.findBySlug(slug);

    if (!article) {
      return { article: null };
    }

    // Convertir en DTO
    const articleDTO = BlogArticleMapper.toDTO(article);

    // Récupérer les articles liés si demandé
    let relatedArticles: BlogArticleListDTO[] | undefined;

    if (includeRelated) {
      const related = await this.articleRepository.findRelated(article.id, relatedLimit);
      relatedArticles = BlogArticleMapper.toListDTOArray(related);
    }

    return {
      article: articleDTO,
      relatedArticles,
    };
  }
}
