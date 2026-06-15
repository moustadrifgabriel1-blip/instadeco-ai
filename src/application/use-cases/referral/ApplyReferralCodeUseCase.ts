import { Result, success, failure } from '@/src/shared/types/Result';
import { IReferralRepository } from '@/src/domain/ports/repositories/IReferralRepository';
import { ILoggerService } from '@/src/domain/ports/services/ILoggerService';

/**
 * Bonus crédités au parrain et au filleul (= argent → constantes figées).
 */
export const REFERRER_BONUS = 5;
export const REFERRED_BONUS = 5;

export interface ApplyReferralCodeInput {
  /** Filleul = utilisateur authentifié (vient TOUJOURS de la session, jamais du body). */
  newUserId: string;
  /** Code saisi (sera normalisé MAJUSCULES + trim par le repository). */
  referralCode: string;
}

/**
 * Raisons d'échec métier — permettent à la route de mapper les codes HTTP
 * exactement comme l'ancienne implémentation.
 */
export type ApplyReferralFailureReason =
  | 'MISSING_CODE'        // 400
  | 'INVALID_CODE'        // 404
  | 'ALREADY_REFERRED'    // 409
  | 'SELF_REFERRAL'       // 400
  | 'INSERT_FAILED';      // 500

export class ApplyReferralCodeError extends Error {
  constructor(public readonly reason: ApplyReferralFailureReason, message: string) {
    super(message);
    this.name = 'ApplyReferralCodeError';
  }
}

export interface ApplyReferralCodeOutput {
  referrerId: string;
  referrerEmail: string;
  referrerFullName: string | null;
  referrerBonus: number;
  referredBonus: number;
}

/**
 * Use Case : applique un code de parrainage pour le filleul authentifié.
 *
 * Reproduit la logique de POST /api/v2/referral (hors transport) :
 *  1. code requis
 *  2. trouver le parrain via le code
 *  3. le filleul ne doit pas déjà avoir été parrainé
 *  4. interdiction de s'auto-parrainer
 *  5. créer la ligne `referrals` (status 'completed')
 *  6. renseigner `referred_by` sur le profil du filleul
 *
 * L'attribution des crédits (= argent) et la notification email restent gérées
 * par la route (via le use-case AddCredits idempotent existant) : ce use-case
 * renvoie les montants et infos parrain nécessaires, sans dupliquer la logique crédit.
 */
export class ApplyReferralCodeUseCase {
  constructor(
    private readonly referralRepo: IReferralRepository,
    private readonly logger: ILoggerService,
  ) {}

  async execute(
    input: ApplyReferralCodeInput,
  ): Promise<Result<ApplyReferralCodeOutput, ApplyReferralCodeError>> {
    if (!input.referralCode) {
      return failure(new ApplyReferralCodeError('MISSING_CODE', 'referralCode requis'));
    }

    // 1. Trouver le parrain via le code.
    const referrerResult = await this.referralRepo.findReferrerByCode(input.referralCode);
    if (!referrerResult.success) {
      return failure(new ApplyReferralCodeError('INVALID_CODE', 'Code de parrainage invalide'));
    }
    const referrer = referrerResult.data;
    if (!referrer) {
      return failure(new ApplyReferralCodeError('INVALID_CODE', 'Code de parrainage invalide'));
    }

    // 2. Vérifier que le filleul n'a pas déjà été parrainé.
    const alreadyResult = await this.referralRepo.hasBeenReferred(input.newUserId);
    if (!alreadyResult.success) {
      return failure(
        new ApplyReferralCodeError('INSERT_FAILED', 'Erreur création parrainage'),
      );
    }
    if (alreadyResult.data) {
      return failure(
        new ApplyReferralCodeError(
          'ALREADY_REFERRED',
          'Ce compte a déjà utilisé un code de parrainage',
        ),
      );
    }

    // 3. Interdire l'auto-parrainage.
    if (referrer.id === input.newUserId) {
      return failure(
        new ApplyReferralCodeError(
          'SELF_REFERRAL',
          'Vous ne pouvez pas utiliser votre propre code',
        ),
      );
    }

    // 4. Créer la ligne de parrainage.
    const createResult = await this.referralRepo.createReferral({
      referrerId: referrer.id,
      referredId: input.newUserId,
      referrerCreditsAwarded: REFERRER_BONUS,
      referredCreditsAwarded: REFERRED_BONUS,
      status: 'completed',
    });
    if (!createResult.success) {
      this.logger.error('Referral insert failed', createResult.error as Error, {
        referrerId: referrer.id,
        referredId: input.newUserId,
      });
      return failure(new ApplyReferralCodeError('INSERT_FAILED', 'Erreur création parrainage'));
    }

    // 5. Renseigner referred_by sur le profil du filleul (legacy : best-effort).
    const setResult = await this.referralRepo.setReferredBy(input.newUserId, referrer.id);
    if (!setResult.success) {
      // L'ancienne route ne bloquait pas sur cette étape : on log sans échouer.
      this.logger.warn('Failed to set referred_by (non-blocking)', {
        referredId: input.newUserId,
        referrerId: referrer.id,
      });
    }

    this.logger.info('Referral applied', {
      referrerId: referrer.id,
      referredId: input.newUserId,
      referrerBonus: REFERRER_BONUS,
      referredBonus: REFERRED_BONUS,
    });

    return success({
      referrerId: referrer.id,
      referrerEmail: referrer.email,
      referrerFullName: referrer.full_name,
      referrerBonus: REFERRER_BONUS,
      referredBonus: REFERRED_BONUS,
    });
  }
}
