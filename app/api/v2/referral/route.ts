import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { addCredits } from '@/lib/supabase/credits';

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/v2/referral — Récupérer les infos de parrainage de l'utilisateur
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

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
      (sum, r) => sum + (r.referrer_credits_awarded || 0), 0
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
 */
export async function POST(req: Request) {
  try {
    const { referralCode, newUserId } = await req.json();

    if (!referralCode || !newUserId) {
      return NextResponse.json(
        { error: 'referralCode et newUserId requis' },
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
    const REFERRER_BONUS = 3;
    const REFERRED_BONUS = 3;

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
