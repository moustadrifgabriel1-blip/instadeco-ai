import { Result, success, failure } from '@/src/shared/types/Result';
import {
  IReferralRepository,
  ReferralRecord,
} from '@/src/domain/ports/repositories/IReferralRepository';
import { ILoggerService } from '@/src/domain/ports/services/ILoggerService';

export interface GetReferralInfoInput {
  userId: string;
}

export interface GetReferralInfoOutput {
  referralCode: string | null;
  referrals: ReferralRecord[];
  totalReferred: number;
  totalCreditsEarned: number;
}

/**
 * Use Case : récupère les infos de parrainage d'un utilisateur authentifié.
 *
 * Préserve le comportement legacy de GET /api/v2/referral :
 * - si le profil/colonne `referral_code` est indisponible → valeurs par défaut
 *   (referralCode null, listes vides, totaux à 0).
 * - sinon : code + liste des parrainages + agrégats (nombre, crédits gagnés).
 */
export class GetReferralInfoUseCase {
  constructor(
    private readonly referralRepo: IReferralRepository,
    private readonly logger: ILoggerService,
  ) {}

  async execute(input: GetReferralInfoInput): Promise<Result<GetReferralInfoOutput>> {
    const codeResult = await this.referralRepo.getReferralCode(input.userId);
    if (!codeResult.success) {
      return failure(codeResult.error);
    }

    // Fallback legacy : colonne/profil indisponible → réponse par défaut.
    if (codeResult.data.columnMissing) {
      return success({
        referralCode: null,
        referrals: [],
        totalReferred: 0,
        totalCreditsEarned: 0,
      });
    }

    const referralsResult = await this.referralRepo.listReferralsByReferrer(input.userId);
    if (!referralsResult.success) {
      return failure(referralsResult.error);
    }

    const referralList = referralsResult.data;
    const totalCreditsEarned = referralList.reduce(
      (sum, r) => sum + (r.referrer_credits_awarded || 0),
      0,
    );

    return success({
      referralCode: codeResult.data.referralCode,
      referrals: referralList,
      totalReferred: referralList.length,
      totalCreditsEarned,
    });
  }
}
