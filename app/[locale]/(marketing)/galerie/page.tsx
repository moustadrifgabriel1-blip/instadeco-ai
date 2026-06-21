import { createAdminClient } from '@/lib/supabase/server';
import { GalleryClient, type GalleryItem } from './GalleryClient';

// ISR : la page est rendue côté serveur (HTML + données pré-rendues pour SEO/LCP)
// puis revalidée périodiquement. Les filtres restent interactifs côté client.
export const revalidate = 300;

const DEFAULT_LIMIT = 24;
// RGPD : page indexée → uniquement les rendus du compte démo (curés, consentis),
// jamais ceux de vrais utilisateurs (structure de pièce reconnaissable).
const DEMO_GALLERY_USER = 'f88c9b68-eda4-4d67-bfb4-f631d21b37c6';

/**
 * Récupère les générations publiques côté serveur pour le rendu initial.
 * ⚠️ Même logique que GET /api/v2/gallery (source de vérité partagée) :
 *  - anonymisé : `input_image_url` jamais exposé (photos privées des utilisateurs)
 *  - cap : limit borné, status `completed`, output non-null
 */
async function getInitialGallery(): Promise<{ items: GalleryItem[]; total: number }> {
  try {
    const supabaseAdmin = await createAdminClient();
    const limit = Math.max(1, Math.min(DEFAULT_LIMIT, 50));

    const { data, error } = await supabaseAdmin
      .from('generations')
      .select('id, style_slug, room_type_slug, output_image_url, created_at')
      .eq('status', 'completed')
      .eq('user_id', DEMO_GALLERY_USER)
      .not('output_image_url', 'is', null)
      .order('created_at', { ascending: false })
      .range(0, limit - 1);

    if (error) {
      console.error('[Gallery SSR] Query error:', error);
      return { items: [], total: 0 };
    }

    const { count } = await supabaseAdmin
      .from('generations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed')
      .eq('user_id', DEMO_GALLERY_USER)
      .not('output_image_url', 'is', null);

    return { items: (data as GalleryItem[]) || [], total: count || 0 };
  } catch (error) {
    console.error('[Gallery SSR] Error:', error);
    return { items: [], total: 0 };
  }
}

export default async function GaleriePage() {
  const { items, total } = await getInitialGallery();
  return <GalleryClient initialItems={items} initialTotal={total} />;
}
