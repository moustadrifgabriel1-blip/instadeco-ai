/**
 * API Route: /api/v2/user/export
 * 
 * Export de toutes les données utilisateur (RGPD Art. 15 & 20).
 * Retourne un JSON complet de toutes les données personnelles.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // 1. Vérifier l'authentification
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2. Récupérer toutes les données utilisateur
    const [
      profileResult,
      generationsResult,
      transactionsResult,
      projectsResult,
      referralsGivenResult,
      referralsReceivedResult,
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').eq('id', user.id).single(),
      supabaseAdmin.from('generations').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabaseAdmin.from('credit_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabaseAdmin.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabaseAdmin.from('referrals').select('referred_id, credits_awarded, created_at').eq('referrer_id', user.id),
      supabaseAdmin.from('referrals').select('referrer_id, credits_awarded, created_at').eq('referred_id', user.id),
    ]);

    // 3. Construire le document d'export
    const exportData = {
      _metadata: {
        exportDate: new Date().toISOString(),
        format: 'JSON',
        service: 'InstaDeco AI',
        website: 'https://instadeco.app',
        description: 'Export complet de vos données personnelles conformément au RGPD (Art. 15 & 20)',
      },
      account: {
        id: user.id,
        email: user.email,
        fullName: user.user_metadata?.full_name || null,
        displayName: user.user_metadata?.display_name || null,
        provider: user.app_metadata?.provider || 'email',
        createdAt: user.created_at,
        lastSignIn: user.last_sign_in_at,
      },
      profile: profileResult.data ? {
        credits: profileResult.data.credits,
        role: profileResult.data.role,
        referralCode: profileResult.data.referral_code,
        stripeCustomerId: profileResult.data.stripe_customer_id ? '***masqué***' : null,
        createdAt: profileResult.data.created_at,
        updatedAt: profileResult.data.updated_at,
      } : null,
      generations: (generationsResult.data || []).map((g: any) => ({
        id: g.id,
        style: g.style,
        roomType: g.room_type,
        status: g.status,
        inputImageUrl: g.input_image_url,
        outputImageUrl: g.output_image_url,
        prompt: g.prompt,
        createdAt: g.created_at,
        updatedAt: g.updated_at,
      })),
      creditTransactions: (transactionsResult.data || []).map((t: any) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        createdAt: t.created_at,
      })),
      projects: (projectsResult.data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        createdAt: p.created_at,
      })),
      referrals: {
        given: (referralsGivenResult.data || []).map((r: any) => ({
          creditsAwarded: r.credits_awarded,
          createdAt: r.created_at,
        })),
        received: (referralsReceivedResult.data || []).map((r: any) => ({
          creditsAwarded: r.credits_awarded,
          createdAt: r.created_at,
        })),
      },
      _dataCategories: {
        accountData: 'Informations de connexion et profil',
        generationData: 'Images uploadées et générées',
        transactionData: 'Historique des achats de crédits',
        referralData: 'Parrainages effectués et reçus',
      },
    };

    // 4. Retourner en JSON avec le bon Content-Type pour le téléchargement
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="instadeco-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('[Export Data] Error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
