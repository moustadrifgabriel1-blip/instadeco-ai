/**
 * Repository: SupabaseBlogArticleRepository
 * 
 * Implémentation du port IBlogArticleRepository avec Supabase.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  IBlogArticleRepository,
  BlogArticleFilters,
  PaginationOptions,
  PaginatedResult,
} from '../../domain/ports/repositories/IBlogArticleRepository';
import { BlogArticle } from '../../domain/entities/BlogArticle';
import { BlogArticleMapper } from '../../application/mappers/BlogArticleMapper';

export class SupabaseBlogArticleRepository implements IBlogArticleRepository {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  async save(article: BlogArticle): Promise<BlogArticle> {
    const row = BlogArticleMapper.toSupabase(article);
    
    const { data, error } = await this.supabase
      .from('blog_articles')
      .insert(row)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la sauvegarde de l'article: ${error.message}`);
    }

    return BlogArticleMapper.fromSupabase(data);
  }

  async update(article: BlogArticle): Promise<BlogArticle> {
    const row = BlogArticleMapper.toSupabase(article);
    
    const { data, error } = await this.supabase
      .from('blog_articles')
      .update(row)
      .eq('id', article.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la mise à jour de l'article: ${error.message}`);
    }

    return BlogArticleMapper.fromSupabase(data);
  }

  async findById(id: string): Promise<BlogArticle | null> {
    const { data, error } = await this.supabase
      .from('blog_articles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Erreur lors de la recherche de l'article: ${error.message}`);
    }

    return data ? BlogArticleMapper.fromSupabase(data) : null;
  }

  async findBySlug(slug: string): Promise<BlogArticle | null> {
    const { data, error } = await this.supabase
      .from('blog_articles')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Erreur lors de la recherche de l'article: ${error.message}`);
    }

    return data ? BlogArticleMapper.fromSupabase(data) : null;
  }

  async findMany(
    filters?: BlogArticleFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<BlogArticle>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const offset = (page - 1) * limit;
    const sortBy = pagination?.sortBy || 'published_at';
    const sortOrder = pagination?.sortOrder === 'asc';

    // Construire la requête
    let query = this.supabase
      .from('blog_articles')
      .select('*', { count: 'exact' });

    // Appliquer les filtres
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.sessionType) {
      query = query.eq('session_type', filters.sessionType);
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }

    if (filters?.searchTitle) {
      query = query.ilike('title', `%${filters.searchTitle}%`);
    }

    if (filters?.publishedAfter) {
      query = query.gte('published_at', filters.publishedAfter.toISOString());
    }

    if (filters?.publishedBefore) {
      query = query.lte('published_at', filters.publishedBefore.toISOString());
    }

    // Mapper le champ de tri
    const sortColumn = sortBy === 'publishedAt' ? 'published_at' 
      : sortBy === 'createdAt' ? 'created_at'
      : sortBy === 'wordCount' ? 'word_count'
      : sortBy;

    // Appliquer tri et pagination
    query = query
      .order(sortColumn, { ascending: sortOrder })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Erreur lors de la recherche des articles: ${error.message}`);
    }

    const articles = (data || []).map((row) => BlogArticleMapper.fromSupabase(row));
    const total = count || 0;

    return {
      data: articles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async count(filters?: BlogArticleFilters): Promise<number> {
    let query = this.supabase
      .from('blog_articles')
      .select('*', { count: 'exact', head: true });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`Erreur lors du comptage des articles: ${error.message}`);
    }

    return count || 0;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('blog_articles')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erreur lors de la suppression de l'article: ${error.message}`);
    }
  }

  async slugExists(slug: string): Promise<boolean> {
    const { count, error } = await this.supabase
      .from('blog_articles')
      .select('*', { count: 'exact', head: true })
      .eq('slug', slug);

    if (error) {
      throw new Error(`Erreur lors de la vérification du slug: ${error.message}`);
    }

    return (count || 0) > 0;
  }

  async titleExistsSimilar(title: string, thresholdDays: number = 60): Promise<boolean> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - thresholdDays);

    // Normaliser le titre pour la comparaison
    const normalizedTitle = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    // Récupérer les titres récents
    const { data, error } = await this.supabase
      .from('blog_articles')
      .select('title')
      .eq('status', 'published')
      .gte('published_at', thresholdDate.toISOString());

    if (error) {
      throw new Error(`Erreur lors de la vérification du titre: ${error.message}`);
    }

    // Vérifier la similarité
    for (const row of data || []) {
      const existingNormalized = (row.title as string)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      // Calculer la similarité (mots en commun)
      const titleWords = new Set(normalizedTitle.split(/\s+/).filter((w) => w.length > 3));
      const existingWords = new Set(existingNormalized.split(/\s+/).filter((w) => w.length > 3));

      if (titleWords.size === 0) continue;

      let commonWords = 0;
      titleWords.forEach((word) => {
        if (existingWords.has(word)) commonWords++;
      });

      const similarity = commonWords / titleWords.size;

      if (similarity > 0.7) {
        return true;
      }
    }

    return false;
  }

  async keywordUsedRecently(keyword: string, thresholdDays: number = 30): Promise<boolean> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - thresholdDays);

    const normalizedKeyword = keyword.toLowerCase();

    const { data, error } = await this.supabase
      .from('blog_articles')
      .select('tags')
      .eq('status', 'published')
      .gte('published_at', thresholdDate.toISOString());

    if (error) {
      throw new Error(`Erreur lors de la vérification du mot-clé: ${error.message}`);
    }

    for (const row of data || []) {
      const tags = row.tags as string[];
      if (tags?.some((tag) => tag.toLowerCase() === normalizedKeyword)) {
        return true;
      }
    }

    return false;
  }

  async findLatest(limit: number = 5): Promise<BlogArticle[]> {
    const { data, error } = await this.supabase
      .from('blog_articles')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Erreur lors de la recherche des derniers articles: ${error.message}`);
    }

    return (data || []).map((row) => BlogArticleMapper.fromSupabase(row));
  }

  async findRelated(articleId: string, limit: number = 3): Promise<BlogArticle[]> {
    // Récupérer l'article source pour ses tags
    const article = await this.findById(articleId);
    if (!article || article.tags.length === 0) {
      return [];
    }

    // Chercher les articles avec des tags similaires
    const { data, error } = await this.supabase
      .from('blog_articles')
      .select('*')
      .eq('status', 'published')
      .neq('id', articleId)
      .overlaps('tags', article.tags)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Erreur lors de la recherche des articles liés: ${error.message}`);
    }

    return (data || []).map((row) => BlogArticleMapper.fromSupabase(row));
  }
}
