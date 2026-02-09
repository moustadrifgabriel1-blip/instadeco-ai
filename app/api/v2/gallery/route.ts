import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/v2/gallery — Récupérer les générations publiques pour la galerie
 * Retourne les meilleures générations complétées (anonymisées)
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const style = url.searchParams.get('style');
    const room = url.searchParams.get('room');
    const limit = parseInt(url.searchParams.get('limit') || '24');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = supabaseAdmin
      .from('generations')
      .select('id, style_slug, room_type_slug, input_image_url, output_image_url, created_at')
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
