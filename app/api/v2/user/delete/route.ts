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
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function DELETE(req: Request) {
  try {
    // 1. Vérifier l'authentification
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

    // 3. Utiliser le service_role pour supprimer les données et le compte auth
    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 4. Supprimer les images du storage
    try {
      const { data: generations } = await supabaseAdmin
        .from('generations')
        .select('input_image_url, output_image_url')
        .eq('user_id', user.id);

      if (generations && generations.length > 0) {
        const storagePaths: string[] = [];
        for (const gen of generations) {
          // Extraire les chemins storage des URLs Supabase
          if (gen.input_image_url?.includes('storage/v1/object/')) {
            const match = gen.input_image_url.match(/\/storage\/v1\/object\/(?:public|sign)\/([^?]+)/);
            if (match) storagePaths.push(match[1]);
          }
          if (gen.output_image_url?.includes('storage/v1/object/')) {
            const match = gen.output_image_url.match(/\/storage\/v1\/object\/(?:public|sign)\/([^?]+)/);
            if (match) storagePaths.push(match[1]);
          }
        }

        if (storagePaths.length > 0) {
          // Les paths sont au format "bucket/path", on doit séparer
          const byBucket: Record<string, string[]> = {};
          for (const p of storagePaths) {
            const [bucket, ...rest] = p.split('/');
            if (!byBucket[bucket]) byBucket[bucket] = [];
            byBucket[bucket].push(rest.join('/'));
          }
          for (const [bucket, paths] of Object.entries(byBucket)) {
            await supabaseAdmin.storage.from(bucket).remove(paths);
          }
        }
      }
    } catch (storageErr) {
      // Ne pas bloquer la suppression si le storage échoue
      console.error('[Delete Account] Storage cleanup error:', storageErr);
    }

    // 5. Supprimer les leads associés à cet email (table optionnelle)
    try {
      await supabaseAdmin
        .from('leads')
        .delete()
        .eq('email', user.email);
    } catch {
      // Table leads peut ne pas exister
    }

    // 6. Supprimer le compte auth (cascade automatique sur profiles, generations, etc.)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error('[Delete Account] Error:', deleteError);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression du compte' },
        { status: 500 }
      );
    }

    console.log(`[Delete Account] ✅ User ${user.id} deleted successfully`);

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
