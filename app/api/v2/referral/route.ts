import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { addCredits } from '@/lib/supabase/credits';
import { requireAuth } from '@/lib/security/api-auth';

/**
 * GET /api/v2/referral — Récupérer les infos de parrainage de l'utilisateur authentifié
 */
export async function GET(req: Request) {
  // ✅ Authentification obligatoire
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const userId = auth.user.id;

  const supabaseAdmin = await createAdminClient();

  try {

    // Récupérer le code de parrainage
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('referral_code')
      .eq('id', userId)
      .single();

    if (profileError) {
      // Si la colonne n'existe pas encore, retourner un code par défaut
      return NextResponse.json({
        referralCode: null,
        referrals: [],
        totalReferred: 0,
        totalCreditsEarned: 0,
      });
    }

    // Récupérer les parrainages
    const { data: referrals, error: refError } = await supabaseAdmin
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

    const referralList = referrals || [];
    const totalCreditsEarned = referralList.reduce(
      (sum: number, r: any) => sum + (r.referrer_credits_awarded || 0), 0
    );

    return NextResponse.json({
      referralCode: profile?.referral_code || null,
      referrals: referralList,
      totalReferred: referralList.length,
      totalCreditsEarned,
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

  const supabaseAdmin = await createAdminClient();

  try {
    const { referralCode } = await req.json();

    if (!referralCode) {
      return NextResponse.json(
        { error: 'referralCode requis' },
        { status: 400 }
      );
    }

    // 1. Trouver le parrain via le code
    const { data: referrer, error: refError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('referral_code', referralCode.toUpperCase().trim())
      .single();

    if (refError || !referrer) {
      return NextResponse.json(
        { error: 'Code de parrainage invalide' },
        { status: 404 }
      );
    }

    // 2. Vérifier que le filleul n'a pas déjà été parrainé
    const { data: existing } = await supabaseAdmin
      .from('referrals')
      .select('id')
      .eq('referred_id', newUserId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Ce compte a déjà utilisé un code de parrainage' },
        { status: 409 }
      );
    }

    // 3. Vérifier que le parrain ne se parraine pas lui-même
    if (referrer.id === newUserId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas utiliser votre propre code' },
        { status: 400 }
      );
    }

    // 4. Créer le parrainage
    const REFERRER_BONUS = 5;
    const REFERRED_BONUS = 5;

    const { error: insertError } = await supabaseAdmin
      .from('referrals')
      .insert({
        referrer_id: referrer.id,
        referred_id: newUserId,
        referrer_credits_awarded: REFERRER_BONUS,
        referred_credits_awarded: REFERRED_BONUS,
        status: 'completed',
      });

    if (insertError) {
      console.error('[Referral] Insert error:', insertError);
      return NextResponse.json({ error: 'Erreur création parrainage' }, { status: 500 });
    }

    // 5. Ajouter les crédits au parrain
    await addCredits(referrer.id, REFERRER_BONUS, undefined, undefined, 'referral_bonus');

    // 6. Ajouter les crédits au filleul
    await addCredits(newUserId, REFERRED_BONUS, undefined, undefined, 'referral_welcome');

    // 7. Mettre à jour referred_by sur le profil du filleul
    await supabaseAdmin
      .from('profiles')
      .update({ referred_by: referrer.id })
      .eq('id', newUserId);

    console.log(`[Referral] ✅ ${referrer.email} → new user ${newUserId} (${REFERRER_BONUS}+${REFERRED_BONUS} crédits)`);

    return NextResponse.json({
      success: true,
      creditsAwarded: {
        referrer: REFERRER_BONUS,
        referred: REFERRED_BONUS,
      },
    });
  } catch (error) {
    console.error('[Referral POST] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
