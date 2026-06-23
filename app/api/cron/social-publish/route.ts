import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin-client';

export const dynamic = 'force-dynamic';

/**
 * CRON: Auto-publication Instagram + Facebook
 *
 * Sélectionne des rendus avant/après de la galerie démo (compte public, RGPD) non
 * encore publiés, génère une légende, et publie sur Instagram + la page Facebook via
 * l'API Graph de Meta. Déduplication via la table `social_posts` (unique generation/plateforme).
 *
 * Gratuit : tout passe par l'API Graph officielle (pas de scraping, pas de SaaS payant).
 *
 * Prérequis (secrets, à poser dans Vercel + .env.local) :
 *  - META_PAGE_ACCESS_TOKEN : token longue durée de la page (publie IG + FB).
 *  - META_IG_USER_ID : ID du compte Instagram Business lié à la page.
 *  - META_FB_PAGE_ID : ID de la page Facebook.
 * Sans ces secrets, la route prépare le contenu mais ne publie pas (mode dry-run).
 *
 * Auth : Bearer CRON_SECRET. Fréquence : pilotée par le cron VPS (ex : 1 à 3x/jour
 * pour viser 50 à 100 publications/mois). Limite par exécution via ?limit=N (max 5).
 */

const DEMO_GALLERY_USER = 'f88c9b68-eda4-4d67-bfb4-f631d21b37c6';
const GRAPH = 'https://graph.facebook.com/v21.0';

const STYLE_LABELS: Record<string, string> = {
  moderne: 'moderne', minimaliste: 'minimaliste', boheme: 'bohème',
  industriel: 'industriel', classique: 'classique', japandi: 'japandi',
  midcentury: 'mid-century', coastal: 'coastal', scandinave: 'scandinave',
  artdeco: 'art déco', luxe: 'luxe', haussmannien: 'haussmannien', contemporain: 'contemporain',
};
const ROOM_LABELS: Record<string, string> = {
  salon: 'salon', chambre: 'chambre', cuisine: 'cuisine',
  'salle-de-bain': 'salle de bain', bureau: 'bureau',
  'salle-a-manger': 'salle à manger', entree: 'entrée', terrasse: 'terrasse',
};
const HASHTAGS = [
  '#homestaging', '#homestagingvirtuel', '#immobilier', '#decoration',
  '#decorationinterieur', '#avantapres', '#agentimmobilier', '#instadeco',
];

type GenRow = {
  id: string;
  style_slug: string | null;
  room_type_slug: string | null;
  output_image_url: string | null;
};

function buildCaption(gen: GenRow): string {
  const style = (gen.style_slug && STYLE_LABELS[gen.style_slug]) || gen.style_slug || '';
  const room = (gen.room_type_slug && ROOM_LABELS[gen.room_type_slug]) || gen.room_type_slug || 'pièce';
  const styleBit = style ? ` en style ${style}` : '';
  return [
    `Home staging virtuel${styleBit} pour ${room}.`,
    '',
    'Une photo, un style, un rendu prêt pour votre annonce en 30 secondes. Le home staging virtuel par IA, pensé pour les agents immobiliers.',
    '',
    'Essai gratuit sur instadeco.app',
    '',
    HASHTAGS.join(' '),
  ].join('\n');
}

async function postForm(url: string, params: Record<string, string>) {
  const body = new URLSearchParams(params);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, json };
}

async function publishInstagram(igUserId: string, token: string, imageUrl: string, caption: string) {
  // 1. Créer le conteneur média.
  const container = await postForm(`${GRAPH}/${igUserId}/media`, {
    image_url: imageUrl,
    caption,
    access_token: token,
  });
  if (!container.ok || !container.json.id) {
    return { ok: false, error: JSON.stringify(container.json) };
  }
  // 2. Publier le conteneur (les images se traitent quasi instantanément).
  const publish = await postForm(`${GRAPH}/${igUserId}/media_publish`, {
    creation_id: container.json.id,
    access_token: token,
  });
  if (!publish.ok || !publish.json.id) {
    return { ok: false, error: JSON.stringify(publish.json) };
  }
  return { ok: true, id: publish.json.id as string };
}

async function publishFacebook(pageId: string, token: string, imageUrl: string, caption: string) {
  const res = await postForm(`${GRAPH}/${pageId}/photos`, {
    url: imageUrl,
    caption,
    access_token: token,
  });
  if (!res.ok || !(res.json.post_id || res.json.id)) {
    return { ok: false, error: JSON.stringify(res.json) };
  }
  return { ok: true, id: (res.json.post_id || res.json.id) as string };
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.max(1, Math.min(5, parseInt(searchParams.get('limit') || '1', 10) || 1));

    // Candidats : rendus démo publics complétés. On exclut ceux déjà publiés sur Instagram.
    const { data: candidates, error } = await supabaseAdmin
      .from('generations')
      .select('id, style_slug, room_type_slug, output_image_url')
      .eq('status', 'completed')
      .eq('user_id', DEMO_GALLERY_USER)
      .not('output_image_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(60);

    if (error || !candidates?.length) {
      return NextResponse.json({ success: false, message: 'Aucune génération disponible' });
    }

    const { data: alreadyPosted } = await supabaseAdmin
      .from('social_posts')
      .select('generation_id')
      .eq('platform', 'instagram');
    const postedIds = new Set((alreadyPosted || []).map((p) => p.generation_id));

    const toPost = (candidates as GenRow[])
      .filter((g) => g.output_image_url && !postedIds.has(g.id))
      .slice(0, limit);

    if (!toPost.length) {
      return NextResponse.json({ success: true, message: 'Tout est déjà publié', posted: 0 });
    }

    const token = process.env.META_PAGE_ACCESS_TOKEN;
    const igUserId = process.env.META_IG_USER_ID;
    const fbPageId = process.env.META_FB_PAGE_ID;
    const configured = Boolean(token && igUserId && fbPageId);

    const results: Array<Record<string, unknown>> = [];

    for (const gen of toPost) {
      const caption = buildCaption(gen);
      const imageUrl = gen.output_image_url as string;

      if (!configured) {
        results.push({ generationId: gen.id, dryRun: true, caption });
        continue;
      }

      const ig = await publishInstagram(igUserId as string, token as string, imageUrl, caption);
      const fb = await publishFacebook(fbPageId as string, token as string, imageUrl, caption);

      // Trace anti-doublon (une ligne par plateforme ; le unique protège des courses).
      await supabaseAdmin.from('social_posts').insert([
        { generation_id: gen.id, platform: 'instagram', status: ig.ok ? 'posted' : 'failed', external_id: ig.ok ? ig.id : null, error: ig.ok ? null : ig.error },
        { generation_id: gen.id, platform: 'facebook', status: fb.ok ? 'posted' : 'failed', external_id: fb.ok ? fb.id : null, error: fb.ok ? null : fb.error },
      ]);

      results.push({ generationId: gen.id, instagram: ig, facebook: fb });
    }

    return NextResponse.json({
      success: true,
      configured,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error('[social-publish] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
