/**
 * API : flux RSS d'auto-publication Pinterest.
 *
 * URL : /api/pinterest-feed
 *
 * Pourquoi ce flux plutôt que l'API Pinterest : l'app du projet est en accès
 * « Trial », donc tout pin créé par l'API part en bac à sable, visible du
 * seul propriétaire, pour une valeur d'acquisition nulle. L'auto-publication
 * par flux RSS ne passe pas par l'API : elle demande seulement un compte
 * professionnel et un site revendiqué, et publie de vraies épingles publiques.
 *
 * Contraintes Pinterest respectées ici :
 *  - RSS 2.0 (Atom n'est pas supporté)
 *  - image portée par <enclosure> ET <media:content>
 *  - chaque item pointe vers une URL du domaine revendiqué
 *  - 200 épingles par jour au maximum, publication sous 24 h
 *
 * Le flux ne montre pas tout d'un coup : il révèle les épingles au compte
 * gouttes, dans un ordre qui espace les destinations. Voir
 * `lib/social/pin-schedule.ts` pour le detail des regles Pinterest suivies.
 *
 * Le flux ne liste QUE les rendus du compte démo, jamais la photo d'un
 * utilisateur (même règle RGPD que la galerie et les pages indexées).
 */

import { NextResponse } from 'next/server';
import { createStaticAdminClient } from '@/lib/supabase/server';
import { DEMO_USER_ID } from '@/src/shared/storage/demo-assets';
import { buildPinCopy, SITE } from '@/lib/social/pin-copy';
import { PAR_JOUR, planifier } from '@/lib/social/pin-schedule';

export const dynamic = 'force-dynamic';

/**
 * Plafond de lecture en base. Le cadencement reduit ensuite fortement ce qui
 * est reellement expose, mais on borne quand meme la requete.
 */
const MAX_ITEMS = 200;

/** Échappe le texte destiné à un attribut ou un noeud XML. */
function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  let rows: Array<{
    id: string;
    style_slug: string;
    room_type_slug: string;
    output_image_url: string;
    created_at: string;
  }> = [];

  try {
    // Client admin, comme la galerie publique : la RLS de `generations` ne
    // laisse voir à personne les lignes d'un autre compte, y compris celles
    // du compte démo. Seules des colonnes non sensibles sont lues, et jamais
    // la photo d'origine d'un vrai utilisateur.
    const supabase = createStaticAdminClient();

    const { data } = await supabase
      .from('generations')
      .select('id, style_slug, room_type_slug, output_image_url, created_at')
      .eq('user_id', DEMO_USER_ID)
      .eq('status', 'completed')
      .not('output_image_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(MAX_ITEMS);

    rows = (data || []) as typeof rows;
  } catch (error) {
    console.error('[pinterest-feed] lecture des générations impossible', error);
  }

  // Cadencement : quelques épingles par jour, styles alternés, plutôt que les
  // 30 d'un bloc. Protège des deux motifs que Pinterest sanctionne, la rafale
  // et la répétition rapprochée vers une même URL.
  const items = planifier(rows, Date.now())
    .map(({ item: row, publieeLe }) => {
      // L'épingle montre le RENDU seul : le visuel composé avant/après n'existe
      // que dans le kit local, il n'est pas hébergé en ligne. Le texte décrit
      // donc ce que l'image montre vraiment, et n'annonce jamais un avant/après
      // que le lecteur ne verrait pas.
      const copy = buildPinCopy(row.style_slug, row.room_type_slug, false);
      const image = row.output_image_url;

      return `
    <item>
      <title><![CDATA[${copy.title}]]></title>
      <link>${xmlEscape(copy.link)}</link>
      <guid isPermaLink="false">instadeco-pin-${xmlEscape(row.id)}</guid>
      <description><![CDATA[${copy.description}]]></description>
      <pubDate>${publieeLe.toUTCString()}</pubDate>
      <enclosure url="${xmlEscape(image)}" type="image/jpeg" />
      <media:content url="${xmlEscape(image)}" medium="image" type="image/jpeg" />
    </item>`;
    })
    .join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>InstaDeco AI, avant et après de décoration</title>
    <link>${SITE}/fr/galerie</link>
    <description>Des pièces réelles transformées par IA à partir d'une simple photo, style par style. Environ ${PAR_JOUR} nouvelles épingles par jour.</description>
    <language>fr</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE}/api/pinterest-feed" rel="self" type="application/rss+xml" />${items}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      // Pinterest relit le flux régulièrement ; une heure de cache suffit et
      // évite de taper la base à chaque passage de leur robot.
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
