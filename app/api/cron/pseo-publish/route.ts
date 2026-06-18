/**
 * API Cron : drip-feed des pages pSEO.
 *
 * Publie un lot restreint de pages programmatiques chaque jour (au lieu de tout
 * d'un coup), pour une croissance Google-safe. Sélectionne des brouillons au
 * hasard et passe leur statut à 'published'.
 *
 * Déclenché par le VPS Hetzner (crontab) avec Authorization: Bearer CRON_SECRET.
 * Alternative possible : pg_cron côté Supabase (UPDATE direct), mais on reste
 * sur le pattern cron-route du projet (observable, sécurisé, logique centralisée).
 */
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin-client';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

// Nombre de pages publiées par exécution (drip-feed).
const PUBLISH_BATCH = 15;
// Profondeur de tirage avant mélange (pour varier l'ordre de publication).
const POOL = 80;

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('[CRON pseo-publish] CRON_SECRET non configuré');
    return false;
  }
  return request.headers.get('authorization') === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sb = getSupabaseAdmin();

    // Pool de brouillons (les plus anciens d'abord), puis tirage aléatoire.
    const { data: drafts, error } = await sb
      .from('pseo_pages')
      .select('id')
      .eq('status', 'draft')
      .order('created_at', { ascending: true })
      .limit(POOL);
    if (error) throw error;

    if (!drafts || drafts.length === 0) {
      return NextResponse.json({ published: 0, remaining: 0, message: 'Aucun brouillon à publier.' });
    }

    // Mélange (Fisher-Yates) puis on prend le lot.
    for (let i = drafts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [drafts[i], drafts[j]] = [drafts[j], drafts[i]];
    }
    const ids = drafts.slice(0, PUBLISH_BATCH).map((d) => d.id);

    const { error: upErr } = await sb
      .from('pseo_pages')
      .update({ status: 'published', published_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .in('id', ids);
    if (upErr) throw upErr;

    const { count: remaining } = await sb
      .from('pseo_pages')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'draft');

    console.log(`[CRON pseo-publish] ${ids.length} pages publiées, ${remaining ?? '?'} brouillons restants.`);
    return NextResponse.json({ published: ids.length, remaining: remaining ?? null });
  } catch (e) {
    console.error('[CRON pseo-publish] erreur:', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
