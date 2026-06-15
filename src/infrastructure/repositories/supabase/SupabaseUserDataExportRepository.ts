import { Result, success, failure } from '@/src/shared/types/Result';
import {
  IUserDataExportRepository,
  UserDataExportRaw,
} from '@/src/domain/ports/repositories/IUserDataExportRepository';
import { getSupabaseAdmin } from './supabaseClient';

/**
 * Adapter: Supabase - lecture seule des données utilisateur pour l'export RGPD.
 *
 * Réplique à l'identique les requêtes de la route historique
 * (`app/api/v2/user/export/route.ts`) : mêmes tables, mêmes colonnes
 * sélectionnées, mêmes tris. Toute divergence modifierait le format
 * d'export observable.
 */
export class SupabaseUserDataExportRepository implements IUserDataExportRepository {
  private get supabase() {
    return getSupabaseAdmin();
  }

  async fetchAll(userId: string): Promise<Result<UserDataExportRaw>> {
    try {
      const [
        profileResult,
        generationsResult,
        transactionsResult,
        projectsResult,
        referralsGivenResult,
        referralsReceivedResult,
      ] = await Promise.all([
        this.supabase.from('profiles').select('*').eq('id', userId).single(),
        this.supabase
          .from('generations')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        this.supabase
          .from('credit_transactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        this.supabase
          .from('projects')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        this.supabase
          .from('referrals')
          .select('referred_id, credits_awarded, created_at')
          .eq('referrer_id', userId),
        this.supabase
          .from('referrals')
          .select('referrer_id, credits_awarded, created_at')
          .eq('referred_id', userId),
      ]);

      // Comme la route historique : une erreur de lecture sur l'une des tables
      // n'interrompt PAS l'export (les données disponibles sont renvoyées,
      // les manquantes deviennent vides/null). On préserve ce comportement.
      return success({
        profile: (profileResult.data as Record<string, unknown> | null) ?? null,
        generations: (generationsResult.data ?? []) as Array<Record<string, unknown>>,
        creditTransactions: (transactionsResult.data ?? []) as Array<Record<string, unknown>>,
        projects: (projectsResult.data ?? []) as Array<Record<string, unknown>>,
        referralsGiven: (referralsGivenResult.data ?? []) as Array<Record<string, unknown>>,
        referralsReceived: (referralsReceivedResult.data ?? []) as Array<Record<string, unknown>>,
      });
    } catch (error) {
      return failure(
        error instanceof Error ? error : new Error('Failed to fetch user export data'),
      );
    }
  }
}
