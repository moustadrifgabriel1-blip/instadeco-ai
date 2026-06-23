import { createAdminClient } from '@/lib/supabase/server';
import { SEO_CONFIG } from '@/lib/seo/config';

/**
 * Sitemap d'images, pour la découverte des rendus avant/après dans Google Images
 * (le produit est 100% visuel, c'est un canal réel). On n'expose QUE les générations
 * publiques du compte démo (filtre RGPD, même source que la galerie), avec un titre
 * et une légende décrivant honnêtement le style et la pièce.
 */

export const revalidate = 86400; // 24 h

// Compte démo dont les générations sont publiques (cf. galerie, RGPD).
const DEMO_GALLERY_USER = 'f88c9b68-eda4-4d67-bfb4-f631d21b37c6';
const BASE = SEO_CONFIG.siteUrl.replace(/\/+$/, '');

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function humanize(slug: string | null): string {
  if (!slug) return '';
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

type Row = {
  id: string;
  style_slug: string | null;
  room_type_slug: string | null;
  output_image_url: string | null;
};

export async function GET() {
  let rows: Row[] = [];
  try {
    const supabase = await createAdminClient();
    const { data } = await supabase
      .from('generations')
      .select('id, style_slug, room_type_slug, output_image_url')
      .eq('status', 'completed')
      .eq('user_id', DEMO_GALLERY_USER)
      .not('output_image_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1000);
    rows = (data as Row[]) || [];
  } catch (error) {
    console.error('[image-sitemap] query error:', error);
  }

  const entries = rows
    .filter((r) => r.output_image_url && r.output_image_url.startsWith('http'))
    .map((r) => {
      const style = humanize(r.style_slug);
      const room = humanize(r.room_type_slug).toLowerCase();
      const title = `Décoration ${style || 'par IA'}${room ? ` pour ${room}` : ''} par IA InstaDeco`;
      const caption = `Home staging virtuel et décoration d'intérieur par IA, rendu avant/après${
        style ? ` en style ${style}` : ''
      }${room ? ` pour ${room}` : ''}.`;
      return `  <url>
    <loc>${xmlEscape(`${BASE}/fr/g/${r.id}`)}</loc>
    <image:image>
      <image:loc>${xmlEscape(r.output_image_url as string)}</image:loc>
      <image:title>${xmlEscape(title)}</image:title>
      <image:caption>${xmlEscape(caption)}</image:caption>
    </image:image>
  </url>`;
    })
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries}
</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });
}
