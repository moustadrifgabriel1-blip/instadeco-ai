import { Result, success, failure } from '@/src/shared/types/Result';
import { IUserDeletionRepository } from '@/src/domain/ports/repositories/IUserDeletionRepository';
import { getSupabaseAdmin } from './supabaseClient';

/**
 * Adapter: Supabase User Deletion Repository.
 *
 * Reproduit fidèlement la cascade de suppression RGPD :
 *   1. nettoyage storage (input/output des générations) — best effort
 *   2. suppression des leads par email — best effort (table optionnelle)
 *   3. suppression du compte auth (cascade SQL) — bloquant
 *
 * Utilise le client admin (service_role). Toutes les opérations sont scopées
 * sur l'identifiant fourni par l'appelant (qui provient TOUJOURS de la session).
 */
export class SupabaseUserDeletionRepository implements IUserDeletionRepository {
  private get supabase() {
    return getSupabaseAdmin();
  }

  async deleteUserStorage(userId: string): Promise<Result<void>> {
    try {
      const { data: generations, error } = await this.supabase
        .from('generations')
        .select('input_image_url, output_image_url')
        .eq('user_id', userId);

      if (error) {
        return failure(new Error(`Failed to list generations for storage cleanup: ${error.message}`));
      }

      if (generations && generations.length > 0) {
        const storagePaths: string[] = [];
        for (const gen of generations) {
          // Extraire les chemins storage des URLs Supabase
          if (gen.input_image_url?.includes('storage/v1/object/')) {
            const match = gen.input_image_url.match(/\/storage\/v1\/object\/(?:public|sign)\/([^?]+)/);
            if (match) storagePaths.push(match[1]);
          }
          if (gen.output_image_url?.includes('storage/v1/object/')) {
            const match = gen.output_image_url.match(/\/storage\/v1\/object\/(?:public|sign)\/([^?]+)/);
            if (match) storagePaths.push(match[1]);
          }
        }

        if (storagePaths.length > 0) {
          // Les paths sont au format "bucket/path", on doit séparer
          const byBucket: Record<string, string[]> = {};
          for (const p of storagePaths) {
            const [bucket, ...rest] = p.split('/');
            if (!byBucket[bucket]) byBucket[bucket] = [];
            byBucket[bucket].push(rest.join('/'));
          }
          for (const [bucket, paths] of Object.entries(byBucket)) {
            await this.supabase.storage.from(bucket).remove(paths);
          }
        }
      }

      return success(undefined);
    } catch (err) {
      return failure(err instanceof Error ? err : new Error('Storage cleanup failed'));
    }
  }

  async deleteLeadsByEmail(email: string): Promise<Result<void>> {
    try {
      const { error } = await this.supabase
        .from('leads')
        .delete()
        .eq('email', email);

      if (error) {
        return failure(new Error(`Failed to delete leads: ${error.message}`));
      }
      return success(undefined);
    } catch (err) {
      // Table leads peut ne pas exister
      return failure(err instanceof Error ? err : new Error('Leads deletion failed'));
    }
  }

  async deleteAuthUser(userId: string): Promise<Result<void>> {
    const { error } = await this.supabase.auth.admin.deleteUser(userId);

    if (error) {
      return failure(new Error(`Failed to delete auth user: ${error.message}`));
    }
    return success(undefined);
  }
}
