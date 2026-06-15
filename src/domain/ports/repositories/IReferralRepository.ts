import { Result } from '@/src/shared/types/Result';

/**
 * Une ligne de parrainage telle qu'exposée par l'API (forme stable côté client).
 */
export interface ReferralRecord {
  id: string;
  referred_id: string;
  referrer_credits_awarded: number | null;
  status: string;
  created_at: string;
}

/**
 * Infos minimales d'un parrain identifié par son code.
 */
export interface ReferrerProfile {
  id: string;
  email: string;
  full_name: string | null;
}

/**
 * Données nécessaires pour créer une ligne de parrainage.
 */
export interface CreateReferralInput {
  referrerId: string;
  referredId: string;
  referrerCreditsAwarded: number;
  referredCreditsAwarded: number;
  status: string;
}

/**
 * Port Repository - Parrainage (tables `profiles.referral_code` + `referrals`).
 *
 * Note : la distinction entre "colonne referral_code absente" et autre erreur DB
 * se fait via le booléen `columnMissing` retourné par `getReferralCode` afin de
 * préserver le comportement de la route (fallback en réponse par défaut).
 */
export interface IReferralRepository {
  /**
   * Récupère le code de parrainage d'un utilisateur.
   * `columnMissing: true` indique que la lecture du profil a échoué
   * (colonne absente / profil introuvable) → la route renvoie les valeurs par défaut.
   */
  getReferralCode(
    userId: string,
  ): Promise<Result<{ referralCode: string | null; columnMissing: boolean }>>;

  /** Liste les parrainages dont `userId` est le parrain (tri décroissant par date). */
  listReferralsByReferrer(userId: string): Promise<Result<ReferralRecord[]>>;

  /** Trouve un parrain via son code (normalisé en MAJUSCULES sans espaces). Null si introuvable. */
  findReferrerByCode(code: string): Promise<Result<ReferrerProfile | null>>;

  /** Vrai si ce filleul a déjà été parrainé (une ligne `referrals` existe pour lui). */
  hasBeenReferred(referredId: string): Promise<Result<boolean>>;

  /** Crée la ligne de parrainage. */
  createReferral(input: CreateReferralInput): Promise<Result<void>>;

  /** Renseigne `referred_by` sur le profil du filleul. */
  setReferredBy(referredId: string, referrerId: string): Promise<Result<void>>;
}
