/**
 * API Route: /api/v2/user/delete
 *
 * Suppression de compte utilisateur (RGPD Art. 17 - Droit à l'effacement).
 * Supprime toutes les données associées à l'utilisateur.
 *
 * La cascade SQL (ON DELETE CASCADE) supprime automatiquement :
 * - profiles
 * - generations
 * - credit_transactions
 * - projects
 * - referrals
 *
 * Transport (parsing body, confirmation, codes HTTP) géré ici ;
 * la cascade (storage / leads / auth user) passe par DeleteAccountUseCase via le DI.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { useCases } from '@/src/infrastructure/config/di-container';

export const dynamic = 'force-dynamic';

export async function DELETE(req: Request) {
  try {
    // 1. Vérifier l'authentification (le userId provient TOUJOURS de la session)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // 2. Vérifier la confirmation dans le body
    const body = await req.json().catch(() => ({}));
    if (body.confirmation !== 'SUPPRIMER MON COMPTE') {
      return NextResponse.json(
        { error: 'Confirmation requise. Envoyez { "confirmation": "SUPPRIMER MON COMPTE" }' },
        { status: 400 }
      );
    }

    // 3. Exécuter la suppression en cascade (storage → leads → auth user) via le Use Case.
    //    L'utilisateur ne peut supprimer que SON propre compte : l'id vient de la session.
    const result = await useCases.deleteAccount.execute({
      userId: user.id,
      email: user.email,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Erreur lors de la suppression du compte' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Votre compte et toutes vos données ont été supprimés.',
    });
  } catch (error) {
    console.error('[Delete Account] Error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
