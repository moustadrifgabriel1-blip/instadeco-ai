/**
 * API Route: /api/v2/user/export
 *
 * Export de toutes les données utilisateur (RGPD Art. 15 & 20).
 * Retourne un JSON complet de toutes les données personnelles.
 *
 * Migré vers la clean architecture : l'agrégation des données et la
 * construction du document d'export sont déléguées à ExportUserDataUseCase
 * (via le DI container). La route conserve uniquement le transport :
 * authentification, codes HTTP et en-têtes de téléchargement.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { useCases } from '@/src/infrastructure/config/di-container';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // 1. Vérifier l'authentification (userId issu de la session, jamais du body)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // 2. Agréger les données + construire le document d'export via le use-case
    const result = await useCases.exportUserData.execute({
      userId: user.id,
      email: user.email,
      fullName: user.user_metadata?.full_name || null,
      displayName: user.user_metadata?.display_name || null,
      provider: user.app_metadata?.provider || 'email',
      createdAt: user.created_at,
      lastSignIn: user.last_sign_in_at,
    });

    if (!result.success) {
      console.error('[Export Data] Error:', result.error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    // 3. Retourner en JSON avec le bon Content-Type pour le téléchargement
    return new NextResponse(JSON.stringify(result.data.exportData, null, 2), {
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
