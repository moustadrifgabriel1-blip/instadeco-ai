import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

/**
 * Schéma de validation
 */
const hdUnlockCreditSchema = z.object({
  generationId: z.string().uuid('ID de génération invalide'),
});

/**
 * POST /api/v2/hd-unlock/with-credit
 * 
 * Débloque HD en utilisant 1 crédit (pas de paiement Stripe)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validation
    const validation = hdUnlockCreditSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation échouée', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { generationId } = validation.data;
    const supabase = await createClient();

    // 1. Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // 2. Vérifier que la génération appartient à l'utilisateur
    const { data: generation, error: genError } = await supabase
      .from('generations')
      .select('id, user_id, hd_unlocked, status')
      .eq('id', generationId)
      .single();

    if (genError || !generation) {
      return NextResponse.json({ error: 'Génération introuvable' }, { status: 404 });
    }

    if (generation.user_id !== user.id) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    // 3. Si déjà débloqué, retourner succès
    if (generation.hd_unlocked) {
      return NextResponse.json({
        success: true,
        alreadyUnlocked: true,
        message: 'Cette image est déjà débloquée en HD',
      });
    }

    // 4. Vérifier les crédits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });
    }

    if (profile.credits < 1) {
      return NextResponse.json({ 
        error: 'Crédits insuffisants',
        creditsRequired: 1,
        creditsAvailable: profile.credits,
      }, { status: 402 });
    }

    // 5. Déduire le crédit via RPC (atomique)
    const { data: deductResult, error: deductError } = await supabase
      .rpc('deduct_credits', {
        p_user_id: user.id,
        p_amount: 1,
        p_generation_id: generationId,
      });

    if (deductError) {
      console.error('[HD Unlock Credit] Erreur déduction:', deductError);
      return NextResponse.json({ error: 'Erreur lors de la déduction du crédit' }, { status: 500 });
    }

    // 6. Marquer la génération comme HD débloquée
    const { error: updateError } = await supabase
      .from('generations')
      .update({
        hd_unlocked: true,
        hd_unlocked_at: new Date().toISOString(),
      })
      .eq('id', generationId);

    if (updateError) {
      console.error('[HD Unlock Credit] Erreur update:', updateError);
      // TODO: Rembourser le crédit en cas d'erreur
      return NextResponse.json({ error: 'Erreur lors du déblocage HD' }, { status: 500 });
    }

    console.log('[HD Unlock Credit] ✅ Succès:', {
      generationId,
      userId: user.id,
      newCredits: deductResult?.new_credits,
    });

    return NextResponse.json({
      success: true,
      creditsRemaining: deductResult?.new_credits ?? profile.credits - 1,
      message: 'Image HD débloquée avec succès',
    });

  } catch (error) {
    console.error('[HD Unlock Credit] ❌ Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}
