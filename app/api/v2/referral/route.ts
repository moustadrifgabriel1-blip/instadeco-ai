import { NextResponse } from 'next/server';
import { useCases } from '@/src/infrastructure/config/di-container';
import { requireAuth } from '@/lib/security/api-auth';
import { sendReferralNotificationEmail } from '@/lib/notifications/marketing-emails';
import { ApplyReferralFailureReason } from '@/src/application/use-cases/referral/ApplyReferralCodeUseCase';

/**
 * Mapping raison métier → code HTTP (préserve les codes de l'ancienne route).
 */
const REASON_STATUS: Record<ApplyReferralFailureReason, number> = {
  MISSING_CODE: 400,
  INVALID_CODE: 404,
  ALREADY_REFERRED: 409,
  SELF_REFERRAL: 400,
  INSERT_FAILED: 500,
};

/**
 * GET /api/v2/referral — Récupérer les infos de parrainage de l'utilisateur authentifié
 */
export async function GET(req: Request) {
  // ✅ Authentification obligatoire
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const userId = auth.user.id;

  try {
    const result = await useCases.getReferralInfo.execute({ userId });

    if (!result.success) {
      console.error('[Referral GET] Error:', result.error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({
      referralCode: result.data.referralCode,
      referrals: result.data.referrals,
      totalReferred: result.data.totalReferred,
      totalCreditsEarned: result.data.totalCreditsEarned,
    });
  } catch (error) {
    console.error('[Referral GET] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * POST /api/v2/referral — Appliquer un code de parrainage (lors de l'inscription)
 * L'utilisateur doit être authentifié. Le newUserId est extrait du token JWT.
 */
export async function POST(req: Request) {
  // ✅ Authentification obligatoire
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const newUserId = auth.user.id;

  try {
    const { referralCode } = await req.json();

    // Validation + création du parrainage via le use-case (data access).
    const result = await useCases.applyReferralCode.execute({
      newUserId,
      referralCode,
    });

    if (!result.success) {
      const status = REASON_STATUS[result.error.reason] ?? 500;
      if (result.error.reason === 'INSERT_FAILED') {
        console.error('[Referral] Insert error:', result.error);
      }
      return NextResponse.json({ error: result.error.message }, { status });
    }

    const {
      referrerId,
      referrerEmail,
      referrerFullName,
      referrerBonus,
      referredBonus,
    } = result.data;

    // Ajouter les crédits au parrain (RPC atomique via le repository).
    await useCases.addCredits.execute({
      userId: referrerId,
      amount: referrerBonus,
      description: 'Bonus parrainage',
    });

    // Ajouter les crédits au filleul (RPC atomique via le repository).
    await useCases.addCredits.execute({
      userId: newUserId,
      amount: referredBonus,
      description: 'Bonus de bienvenue (parrainage)',
    });

    // PII : ne jamais logger l'email en clair (RGPD), on masque la partie locale.
    const maskedReferrer = referrerEmail.replace(/^(.{2}).*(@.*)$/, '$1***$2');
    console.log(`[Referral] ✅ ${maskedReferrer} → new user ${newUserId} (${referrerBonus}+${referredBonus} crédits)`);

    // Notifier le parrain par email (en arrière-plan).
    sendReferralNotificationEmail(
      referrerEmail,
      referrerFullName || null,
      referrerBonus,
    ).catch((err) => {
      console.error('[Referral] Email notification failed:', err);
    });

    return NextResponse.json({
      success: true,
      creditsAwarded: {
        referrer: referrerBonus,
        referred: referredBonus,
      },
    });
  } catch (error) {
    console.error('[Referral POST] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
