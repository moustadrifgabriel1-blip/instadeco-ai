import { Result, success, failure } from '@/src/shared/types/Result';
import { Generation, CreateGenerationInput, UpdateGenerationInput, PublicGalleryItem, PublicGalleryQuery } from '@/src/domain/entities/Generation';
import { IGenerationRepository } from '@/src/domain/ports/repositories/IGenerationRepository';
import { getSupabaseAdmin, GenerationRow } from './supabaseClient';

/**
 * Adapter: Supabase Generation Repository
 * Implémente IGenerationRepository avec Supabase
 */
export class SupabaseGenerationRepository implements IGenerationRepository {
  private get supabase() {
    return getSupabaseAdmin();
  }

  /**
   * Convertit une row Supabase en entité Generation
   */
  private toEntity(row: GenerationRow): Generation {
    // Hack: Récupérer le providerId stocké dans output_image_url pendant le pending
    let providerId: string | undefined;
    let outputImageUrl = row.output_image_url;
    
    if (outputImageUrl && outputImageUrl.startsWith('PENDING_PID:')) {
      providerId = outputImageUrl.replace('PENDING_PID:', '');
      outputImageUrl = null;
    }

    return {
      id: row.id,
      userId: row.user_id,
      styleSlug: row.style_slug,
      roomType: row.room_type_slug,
      inputImageUrl: row.input_image_url,
      outputImageUrl: outputImageUrl,
      status: row.status as Generation['status'],
      prompt: row.custom_prompt,
      stripeSessionId: row.stripe_session_id,
      providerId: providerId,
      errorMessage: row.error_message,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async create(input: CreateGenerationInput): Promise<Result<Generation>> {
    // Hack: Stocker le providerId dans output_image_url temporairement
    const outputOverview = input.providerId ? `PENDING_PID:${input.providerId}` : null;

    // FIX: La base de données a une contrainte CHECK stricte sur style_slug qui ne connaît pas les nouveaux styles (ex: 'ludique').
    // Pour éviter le crash 500, on mappe les styles inconnus sur 'moderne' dans la DB.
    // L'IA utilise le prompt complet donc le style visuel sera correct même si le slug DB est 'moderne'.
    const ALLOWED_DB_STYLES = ['moderne', 'minimaliste', 'boheme', 'industriel', 'classique', 'japandi', 'midcentury', 'coastal', 'farmhouse', 'artdeco'];
    const safeStyleSlug = ALLOWED_DB_STYLES.includes(input.styleSlug) ? input.styleSlug : 'moderne';

    const { data, error } = await this.supabase
      .from('generations')
      .insert({
        user_id: input.userId,
        style_slug: safeStyleSlug,
        room_type_slug: input.roomType,
        input_image_url: input.inputImageUrl,
        custom_prompt: input.prompt,
        status: 'pending',
        output_image_url: outputOverview,
      })
      .select()
      .single();

    if (error) {
      return failure(new Error(`Failed to create generation: ${error.message}`));
    }

    return success(this.toEntity(data as GenerationRow));
  }

  async findById(id: string): Promise<Result<Generation | null>> {
    const { data, error } = await this.supabase
      .from('generations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return success(null);
      }
      return failure(new Error(`Failed to find generation: ${error.message}`));
    }

    return success(this.toEntity(data as GenerationRow));
  }

  async findByUserId(userId: string, limit = 50): Promise<Result<Generation[]>> {
    const { data, error } = await this.supabase
      .from('generations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return failure(new Error(`Failed to find generations: ${error.message}`));
    }

    const generations = (data as GenerationRow[]).map(row => this.toEntity(row));
    return success(generations);
  }

  async update(id: string, input: UpdateGenerationInput): Promise<Result<Generation>> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.status !== undefined) updateData.status = input.status;
    if (input.outputImageUrl !== undefined) updateData.output_image_url = input.outputImageUrl;
    if (input.stripeSessionId !== undefined) updateData.stripe_session_id = input.stripeSessionId;
    if (input.errorMessage !== undefined) updateData.error_message = input.errorMessage;

    // Hack: Stocker le providerId dans output_image_url si fourni et pas d'image finale
    if (input.providerId && !input.outputImageUrl) {
       updateData.output_image_url = `PENDING_PID:${input.providerId}`;
    }

    const { data, error } = await this.supabase
      .from('generations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return failure(new Error(`Failed to update generation: ${error.message}`));
    }

    return success(this.toEntity(data as GenerationRow));
  }

  async markFailedIfPending(
    id: string,
  ): Promise<Result<{ transitioned: boolean; generation: Generation }>> {
    // UPDATE conditionnel atomique : ne transite que si le statut est encore
    // 'pending'/'processing'. On utilise .select() SANS .single() pour que
    // 0 ligne affectée ne lève pas d'erreur PGRST116 mais retourne [].
    const { data, error } = await this.supabase
      .from('generations')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .in('status', ['pending', 'processing'])
      .select();

    if (error) {
      return failure(new Error(`Failed to mark generation as failed: ${error.message}`));
    }

    // Au moins une ligne affectée → CET appel a réellement effectué la transition.
    if (data && data.length > 0) {
      return success({ transitioned: true, generation: this.toEntity(data[0] as GenerationRow) });
    }

    // Aucune ligne affectée : la génération n'était plus 'pending'/'processing'
    // (déjà transité par un appel concurrent, ou déjà completed/failed).
    // On recharge l'état courant pour le retourner sans déclencher de remboursement.
    const current = await this.findById(id);
    if (!current.success) {
      return failure(current.error as Error);
    }
    if (!current.data) {
      return failure(new Error(`Generation not found: ${id}`));
    }

    return success({ transitioned: false, generation: current.data });
  }

  async findStuck(olderThanMs: number, limit = 100): Promise<Result<Generation[]>> {
    const threshold = new Date(Date.now() - olderThanMs).toISOString();
    const { data, error } = await this.supabase
      .from('generations')
      .select('*')
      .in('status', ['pending', 'processing'])
      .lt('updated_at', threshold)
      .order('updated_at', { ascending: true })
      .limit(limit);

    if (error) {
      return failure(new Error(`Failed to find stuck generations: ${error.message}`));
    }

    const generations = (data as GenerationRow[]).map((row) => this.toEntity(row));
    return success(generations);
  }

  async findPublicGallery(
    query: PublicGalleryQuery,
  ): Promise<Result<{ items: PublicGalleryItem[]; total: number }>> {
    const limit = Math.max(1, Math.min(query.limit ?? 24, 50));
    const offset = Math.max(0, query.offset ?? 0);

    // RGPD : la galerie est une page INDEXÉE. On n'expose QUE les rendus du compte
    // démo (curés, libres de droits), jamais ceux de vrais utilisateurs dont la
    // structure de pièce serait reconnaissable sans consentement.
    const DEMO_GALLERY_USER = 'f88c9b68-eda4-4d67-bfb4-f631d21b37c6';

    // ANONYMISATION au niveau data : on ne SELECT JAMAIS user_id ni input_image_url
    // (on filtre dessus sans le retourner).
    let dataQuery = this.supabase
      .from('generations')
      .select('id, style_slug, room_type_slug, output_image_url, created_at')
      .eq('status', 'completed')
      .eq('user_id', DEMO_GALLERY_USER)
      .not('output_image_url', 'is', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    let countQuery = this.supabase
      .from('generations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed')
      .eq('user_id', DEMO_GALLERY_USER)
      .not('output_image_url', 'is', null);

    if (query.styleSlug) {
      dataQuery = dataQuery.eq('style_slug', query.styleSlug);
      countQuery = countQuery.eq('style_slug', query.styleSlug);
    }
    if (query.roomType) {
      dataQuery = dataQuery.eq('room_type_slug', query.roomType);
      countQuery = countQuery.eq('room_type_slug', query.roomType);
    }

    const { data, error } = await dataQuery;
    if (error) {
      return failure(new Error(`Failed to load public gallery: ${error.message}`));
    }

    const { count } = await countQuery;

    const rows = (data ?? []) as Array<{
      id: string;
      style_slug: string;
      room_type_slug: string;
      output_image_url: string;
      created_at: string;
    }>;

    const items: PublicGalleryItem[] = rows.map((row) => ({
      id: row.id,
      styleSlug: row.style_slug,
      roomType: row.room_type_slug,
      outputImageUrl: row.output_image_url,
      createdAt: new Date(row.created_at),
    }));

    return success({ items, total: count ?? 0 });
  }

  async delete(id: string): Promise<Result<void>> {
    const { error } = await this.supabase
      .from('generations')
      .delete()
      .eq('id', id);

    if (error) {
      return failure(new Error(`Failed to delete generation: ${error.message}`));
    }

    return success(undefined);
  }

  async countByUserId(userId: string): Promise<Result<number>> {
    const { count, error } = await this.supabase
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      return failure(new Error(`Failed to count generations: ${error.message}`));
    }

    return success(count ?? 0);
  }
}
