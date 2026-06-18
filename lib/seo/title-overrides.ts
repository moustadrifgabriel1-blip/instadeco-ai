import { getSupabaseAdmin } from '@/lib/supabase/admin-client';

/**
 * Override SEO (title + meta description) pour un chemin donne, produit par la
 * boucle d'auto-optimisation CTR (job VPS `ctr_optimizer`). Voir la table
 * `seo_title_overrides` et l'endpoint /api/cron/ctr-optimize.
 */
export interface TitleOverride {
  title: string;
  metaDescription: string | null;
}

/**
 * Lit l'override SEO d'un chemin (ex `/architecte-interieur/nice`). Renvoie null
 * si aucun override, si la table est indisponible ou si l'admin client n'est pas
 * configure. Ne JAMAIS lever : un echec doit laisser la page sur son title par
 * defaut, jamais casser le build ni le rendu.
 */
export async function getTitleOverride(path: string): Promise<TitleOverride | null> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('seo_title_overrides')
      .select('title, meta_description')
      .eq('path', path)
      .maybeSingle();

    if (error || !data || !data.title) return null;
    return { title: data.title as string, metaDescription: (data.meta_description as string | null) ?? null };
  } catch {
    return null;
  }
}
