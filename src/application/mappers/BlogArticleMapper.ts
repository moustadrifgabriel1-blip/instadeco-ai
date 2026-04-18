/**
 * Mapper: BlogArticleMapper
 * 
 * Convertit entre l'entité BlogArticle et les DTOs.
 */

import { BlogArticle } from '../../domain/entities/BlogArticle';
import {
  BlogArticleDTO,
  BlogArticleListDTO,
} from '../dtos/BlogArticleDTO';

function parseSupabaseDate(value: unknown, fallback: Date): Date {
  if (value == null || value === '') return fallback;
  const d = new Date(value as string | number | Date);
  return Number.isFinite(d.getTime()) ? d : fallback;
}

function toIsoStringSafe(d: Date, fallback: Date): string {
  const t = d.getTime();
  return Number.isFinite(t) ? d.toISOString() : fallback.toISOString();
}

export class BlogArticleMapper {
  /**
   * Convertit une entité en DTO complet
   */
  static toDTO(article: BlogArticle): BlogArticleDTO {
    const now = new Date();
    const created = toIsoStringSafe(article.createdAt, now);
    const updated = toIsoStringSafe(article.updatedAt, new Date(created));
    const published = toIsoStringSafe(article.publishedAt, new Date(created));
    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      content: article.content,
      metaDescription: article.metaDescription,
      tags: article.tags,
      status: article.status,
      wordCount: article.wordCount,
      readingTimeMinutes: article.readingTimeMinutes,
      antiAIScore: article.antiAIScore,
      sessionType: article.sessionType,
      source: article.source,
      publishedAt: published,
      createdAt: created,
      updatedAt: updated,
    };
  }

  /**
   * Convertit une entité en DTO de liste (version allégée)
   */
  static toListDTO(article: BlogArticle): BlogArticleListDTO {
    const fallback = toIsoStringSafe(article.createdAt, new Date());
    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      metaDescription: article.metaDescription,
      tags: article.tags,
      status: article.status,
      wordCount: article.wordCount,
      readingTimeMinutes: article.readingTimeMinutes,
      publishedAt: toIsoStringSafe(article.publishedAt, new Date(fallback)),
    };
  }

  /**
   * Convertit une liste d'entités en DTOs de liste
   */
  static toListDTOArray(articles: BlogArticle[]): BlogArticleListDTO[] {
    return articles.map((article) => BlogArticleMapper.toListDTO(article));
  }

  /**
   * Convertit un DTO en entité
   */
  static toEntity(dto: BlogArticleDTO): BlogArticle {
    return {
      id: dto.id,
      title: dto.title,
      slug: dto.slug,
      content: dto.content,
      metaDescription: dto.metaDescription,
      tags: dto.tags,
      status: dto.status,
      wordCount: dto.wordCount,
      readingTimeMinutes: dto.readingTimeMinutes,
      antiAIScore: dto.antiAIScore,
      sessionType: dto.sessionType,
      source: dto.source,
      publishedAt: new Date(dto.publishedAt),
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    };
  }

  /**
   * Convertit les données brutes de Supabase en entité
   */
  static fromSupabase(row: Record<string, unknown>): BlogArticle {
    const createdAt = parseSupabaseDate(row.created_at, new Date());
    const updatedAt = parseSupabaseDate(row.updated_at, createdAt);
    const publishedAt = parseSupabaseDate(
      row.published_at ?? row.created_at,
      createdAt
    );
    return {
      id: row.id as string,
      title: row.title as string,
      slug: row.slug as string,
      content: row.content as string,
      metaDescription: (row.meta_description as string) || '',
      tags: (row.tags as string[]) || [],
      status: row.status as BlogArticle['status'],
      wordCount: (row.word_count as number) || 0,
      readingTimeMinutes: (row.reading_time_minutes as number) || 1,
      antiAIScore: (row.anti_ai_score as number) || 0,
      sessionType: (row.session_type as BlogArticle['sessionType']) || 'morning',
      source: (row.source as string) || 'automation',
      publishedAt,
      createdAt,
      updatedAt,
    };
  }

  /**
   * Convertit une entité en format Supabase pour insertion
   */
  static toSupabase(article: BlogArticle): Record<string, unknown> {
    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      content: article.content,
      meta_description: article.metaDescription,
      tags: article.tags,
      status: article.status,
      word_count: article.wordCount,
      reading_time_minutes: article.readingTimeMinutes,
      anti_ai_score: article.antiAIScore,
      session_type: article.sessionType,
      source: article.source,
      published_at: article.publishedAt.toISOString(),
      created_at: article.createdAt.toISOString(),
      updated_at: article.updatedAt.toISOString(),
    };
  }
}
