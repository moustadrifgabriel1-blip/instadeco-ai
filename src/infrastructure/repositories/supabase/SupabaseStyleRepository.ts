import { Result, success, failure } from '@/src/shared/types/Result';
import { Style, CreateStyleInput } from '@/src/domain/entities/Style';
import { IStyleRepository } from '@/src/domain/ports/repositories/IStyleRepository';
import { getSupabaseAdmin, StyleRow } from './supabaseClient';

/**
 * Adapter: Supabase Style Repository
 * Implémente IStyleRepository avec Supabase
 */
export class SupabaseStyleRepository implements IStyleRepository {
  private get supabase() {
    return getSupabaseAdmin();
  }

  /**
   * Convertit une row Supabase en entité Style
   */
  private toEntity(row: StyleRow): Style {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      promptTemplate: row.prompt_template,
      thumbnailUrl: row.thumbnail_url,
      category: row.category as Style['category'],
      isPremium: row.is_premium,
      sortOrder: row.sort_order,
      createdAt: new Date(row.created_at),
    };
  }

  async findAll(): Promise<Result<Style[]>> {
    const { data, error } = await this.supabase
      .from('styles')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      return failure(new Error(`Failed to find styles: ${error.message}`));
    }

    const styles = (data as StyleRow[]).map(row => this.toEntity(row));
    return success(styles);
  }

  async findBySlug(slug: string): Promise<Result<Style | null>> {
    const { data, error } = await this.supabase
      .from('styles')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return success(null);
      }
      return failure(new Error(`Failed to find style: ${error.message}`));
    }

    return success(this.toEntity(data as StyleRow));
  }

  async findById(id: string): Promise<Result<Style | null>> {
    const { data, error } = await this.supabase
      .from('styles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return success(null);
      }
      return failure(new Error(`Failed to find style: ${error.message}`));
    }

    return success(this.toEntity(data as StyleRow));
  }

  async create(input: CreateStyleInput): Promise<Result<Style>> {
    const { data, error } = await this.supabase
      .from('styles')
      .insert({
        slug: input.slug,
        name: input.name,
        description: input.description,
        prompt_template: input.promptTemplate,
        thumbnail_url: input.thumbnailUrl,
        category: input.category,
        is_premium: input.isPremium ?? false,
        sort_order: input.sortOrder ?? 0,
      })
      .select()
      .single();

    if (error) {
      return failure(new Error(`Failed to create style: ${error.message}`));
    }

    return success(this.toEntity(data as StyleRow));
  }

  async findByCategory(category: string): Promise<Result<Style[]>> {
    const { data, error } = await this.supabase
      .from('styles')
      .select('*')
      .eq('category', category)
      .order('sort_order', { ascending: true });

    if (error) {
      return failure(new Error(`Failed to find styles by category: ${error.message}`));
    }

    const styles = (data as StyleRow[]).map(row => this.toEntity(row));
    return success(styles);
  }

  async findPremiumStyles(): Promise<Result<Style[]>> {
    const { data, error } = await this.supabase
      .from('styles')
      .select('*')
      .eq('is_premium', true)
      .order('sort_order', { ascending: true });

    if (error) {
      return failure(new Error(`Failed to find premium styles: ${error.message}`));
    }

    const styles = (data as StyleRow[]).map(row => this.toEntity(row));
    return success(styles);
  }
}
