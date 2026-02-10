import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/v2/gallery — Récupérer les générations publiques pour la galerie
 * Retourne les meilleures générations complétées (anonymisées, sans input_image_url)
 */
export async function GET(req: Request) {
  try {
    const supabaseAdmin = await createAdminClient();
    const url = new URL(req.url);
    const style = url.searchParams.get('style');
    const room = url.searchParams.get('room');
    // ✅ Limit capé à 50 maximum pour éviter les abus
    const rawLimit = parseInt(url.searchParams.get('limit') || '24');
    const limit = Math.max(1, Math.min(rawLimit, 50));
    const rawOffset = parseInt(url.searchParams.get('offset') || '0');
    const offset = Math.max(0, rawOffset);

    // ✅ input_image_url retiré : les photos des intérieurs des utilisateurs sont privées
    let query = supabaseAdmin
      .from('generations')
      .select('id, style_slug, room_type_slug, output_image_url, created_at')
      .eq('status', 'completed')
      .not('output_image_url', 'is', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (style) query = query.eq('style_slug', style);
    if (room) query = query.eq('room_type_slug', room);

    const { data, error } = await query;

    if (error) {
      console.error('[Gallery] Query error:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    // Compteur total
    const { count } = await supabaseAdmin
      .from('generations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed')
      .not('output_image_url', 'is', null);

    return NextResponse.json({
      generations: data || [],
      total: count || 0,
    });
  } catch (error) {
    console.error('[Gallery] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
