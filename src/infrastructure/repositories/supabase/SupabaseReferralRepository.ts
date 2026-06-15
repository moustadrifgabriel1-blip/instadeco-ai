import { Result, success, failure } from '@/src/shared/types/Result';
import {
  IReferralRepository,
  ReferralRecord,
  ReferrerProfile,
  CreateReferralInput,
} from '@/src/domain/ports/repositories/IReferralRepository';
import { getSupabaseAdmin } from './supabaseClient';

/**
 * Adapter: Supabase Referral Repository.
 * Tables : `profiles` (colonnes `referral_code`, `referred_by`) + `referrals`.
 *
 * Reproduit fidèlement les requêtes de l'ancienne route `app/api/v2/referral`.
 */
export class SupabaseReferralRepository implements IReferralRepository {
  private get supabase() {
    return getSupabaseAdmin();
  }

  async getReferralCode(
    userId: string,
  ): Promise<Result<{ referralCode: string | null; columnMissing: boolean }>> {
    const { data: profile, error } = await this.supabase
      .from('profiles')
      .select('referral_code')
      .eq('id', userId)
      .single();

    // Comportement legacy : toute erreur (colonne absente, profil introuvable…)
    // déclenche le fallback "valeurs par défaut" côté route.
    if (error) {
      return success({ referralCode: null, columnMissing: true });
    }

    return success({
      referralCode: (profile?.referral_code as string | null) ?? null,
      columnMissing: false,
    });
  }

  async listReferralsByReferrer(userId: string): Promise<Result<ReferralRecord[]>> {
    const { data: referrals, error } = await this.supabase
      .from('referrals')
      .select(`
        id,
        referred_id,
        referrer_credits_awarded,
        status,
        created_at
      `)
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false });

    // Legacy : une erreur de lecture est silencieuse (referrals || []).
    if (error) {
      return success([]);
    }

    return success((referrals as ReferralRecord[]) || []);
  }

  async findReferrerByCode(code: string): Promise<Result<ReferrerProfile | null>> {
    const { data: referrer, error } = await this.supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('referral_code', code.toUpperCase().trim())
      .single();

    // Legacy : erreur OU absence → code invalide (null), pas une erreur serveur.
    if (error || !referrer) {
      return success(null);
    }

    return success(referrer as ReferrerProfile);
  }

  async hasBeenReferred(referredId: string): Promise<Result<boolean>> {
    const { data: existing } = await this.supabase
      .from('referrals')
      .select('id')
      .eq('referred_id', referredId)
      .single();

    // Legacy : seule la présence d'une ligne compte (l'erreur "0 row" de .single() est ignorée).
    return success(!!existing);
  }

  async createReferral(input: CreateReferralInput): Promise<Result<void>> {
    const { error } = await this.supabase.from('referrals').insert({
      referrer_id: input.referrerId,
      referred_id: input.referredId,
      referrer_credits_awarded: input.referrerCreditsAwarded,
      referred_credits_awarded: input.referredCreditsAwarded,
      status: input.status,
    });

    if (error) {
      return failure(new Error(`Failed to create referral: ${error.message}`));
    }
    return success(undefined);
  }

  async setReferredBy(referredId: string, referrerId: string): Promise<Result<void>> {
    const { error } = await this.supabase
      .from('profiles')
      .update({ referred_by: referrerId })
      .eq('id', referredId);

    if (error) {
      return failure(new Error(`Failed to set referred_by: ${error.message}`));
    }
    return success(undefined);
  }
}
