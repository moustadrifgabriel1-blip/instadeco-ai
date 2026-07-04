import { MetadataRoute } from 'next';
import { SEO_CONFIG } from '@/lib/seo/config';
import { isPseoContentIndexable } from '@/lib/seo/pseo-quality';
import { INTENT_PAGES } from '@/lib/seo/intent-pages-data';

export const revalidate = 3600;

const BASE_URL = SEO_CONFIG.siteUrl.replace(/\/$/, '');

const LOCALES = ['fr', 'en', 'de'] as const;

function localizedUrl(locale: string, path: string) {
  const p = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}/${locale}${p}`;
}

function alternatesForPath(path: string): Record<string, string> {
  const p = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  return {
    'fr-FR': `${BASE_URL}/fr${p}`,
    en: `${BASE_URL}/en${p}`,
    de: `${BASE_URL}/de${p}`,
    'x-default': `${BASE_URL}/fr${p}`,
  };
}

function withAlternatesForAllLocales(
  path: string,
  meta: Omit<MetadataRoute.Sitemap[number], 'url' | 'alternates'>,
): MetadataRoute.Sitemap {
  return LOCALES.map((locale) => ({
    url: localizedUrl(locale, path),
    ...meta,
    alternates: { languages: alternatesForPath(path) },
  }));
}

/**
 * Pages programmatiques NON traduites (contenu FR uniquement : architecte-interieur,
 * style, piece, solution). On n'émet QUE l'URL fr (les variantes en/de sont noindex,
 * cf. frOnlyProgrammaticMeta) → pas de hreflang en/de mensonger dans le sitemap.
 */
function frOnlySitemap(
  path: string,
  meta: Omit<MetadataRoute.Sitemap[number], 'url' | 'alternates'>,
): MetadataRoute.Sitemap {
  return localeOnlySitemap('fr', path, meta);
}

/**
 * Émet une seule URL, sous la locale d'indexation réelle de la page (fr ou de),
 * cohérent avec programmaticMeta. Pour les pages dont le contenu est écrit en
 * allemand (ex : page CH alémanique), on émet l'URL /de, pas /fr.
 */
function localeOnlySitemap(
  indexLocale: 'fr' | 'de',
  path: string,
  meta: Omit<MetadataRoute.Sitemap[number], 'url' | 'alternates'>,
): MetadataRoute.Sitemap {
  const url = `${BASE_URL}/${indexLocale}${path}`;
  const hreflang = indexLocale === 'de' ? 'de-CH' : 'fr-FR';
  return [{ url, ...meta, alternates: { languages: { [hreflang]: url, 'x-default': url } } }];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    ...withAlternatesForAllLocales('/', {
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    }),
    ...withAlternatesForAllLocales('/generate', {
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    }),
    ...withAlternatesForAllLocales('/exemples', {
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }),
    ...withAlternatesForAllLocales('/pricing', {
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }),
    // Page Pro = FR uniquement (contenu non traduit, cible francophone). On émet la
    // seule URL fr, cohérent avec le noindex en/de posé dans pro/layout.tsx.
    ...frOnlySitemap('/pro', {
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    }),
    ...withAlternatesForAllLocales('/quiz', {
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    }),
    // Outils gratuits (lead magnets), contenu fr → pas de hreflang en/de.
    ...frOnlySitemap('/outils', {
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    }),
    ...frOnlySitemap('/outils/calculateur-home-staging', {
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    }),
    ...frOnlySitemap('/outils/generateur-annonce-immobiliere', {
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    }),
    ...frOnlySitemap('/outils/estimateur-budget-deco', {
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    }),
    ...withAlternatesForAllLocales('/galerie', {
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    }),
    ...withAlternatesForAllLocales('/essai', {
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    }),
    ...withAlternatesForAllLocales('/styles', {
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }),
    ...withAlternatesForAllLocales('/pieces', {
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }),
    ...withAlternatesForAllLocales('/solutions', {
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }),
    ...withAlternatesForAllLocales('/a-propos', {
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    }),
    ...withAlternatesForAllLocales('/tiktok-generator', {
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    }),
  ];

  let articlePages: MetadataRoute.Sitemap = [];

  try {
    // Client admin SANS cookies : le client serveur (cookies()) forçait la route en
    // dynamique, donc zéro cache ISR et ~3,6 s par requête. Googlebot tombait en
    // timeout (« erreur de traitement temporaire ») et ne relisait plus le sitemap.
    const { getSupabaseAdmin } = await import('@/lib/supabase/admin-client');
    const supabase = getSupabaseAdmin();

    const { data: articles } = await supabase
      .from('blog_articles')
      .select('slug, updated_at, language')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(3000);

    // Blog multilingue : chaque article appartient à UNE langue (slug unique par langue).
    // On émet donc une seule URL par article, sous la locale de sa langue, avec un
    // hreflang auto-référent uniquement (les traductions ont des slugs différents, on
    // ne peut pas les cross-linker de façon fiable). Évite tout duplicate-content
    // et tout hreflang pointant vers une URL inexistante.
    articlePages = (articles || []).map((article) => {
      const lang = (article.language as string) || 'fr';
      const hreflangKey = lang === 'fr' ? 'fr-FR' : lang;
      return {
        url: localizedUrl(lang, `/blog/${article.slug}`),
        lastModified: new Date(article.updated_at),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
        alternates: {
          languages: {
            [hreflangKey]: localizedUrl(lang, `/blog/${article.slug}`),
          },
        },
      };
    });
  } catch (error) {
    console.error('Error fetching blog articles for sitemap:', error);
  }

  const blogIndexPage: MetadataRoute.Sitemap = withAlternatesForAllLocales('/blog', {
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.9,
  });

  let cityIndexPage: MetadataRoute.Sitemap = [];
  let cityPages: MetadataRoute.Sitemap = [];

  try {
    const { CITIES } = await import('@/src/shared/constants/cities');
    const { isCityIndexable } = await import('@/lib/seo/pseo-quality');

    // Hub fr uniquement (en/de en noindex).
    cityIndexPage = frOnlySitemap('/architecte-interieur', {
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    });

    // Barrière qualité : on ne référence dans le sitemap que les villes
    // réellement indexables (cohérence avec le robots de chaque page).
    cityPages = CITIES.filter((city) => isCityIndexable(city.slug)).flatMap((city) =>
      frOnlySitemap(`/architecte-interieur/${city.slug}`, {
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }),
    );
  } catch (error) {
    console.error('Error loading cities for sitemap:', error);
  }

  const stylePages: MetadataRoute.Sitemap = [
    'moderne',
    'scandinave',
    'industriel',
    'boheme',
    'minimaliste',
    'japandi',
    'art-deco',
    'contemporain',
    'rustique',
    'coastal',
    'mid-century',
    'luxe',
  ].flatMap((style) =>
    frOnlySitemap(`/style/${style}`, {
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }),
  );

  const roomPages: MetadataRoute.Sitemap = [
    'salon',
    'chambre',
    'cuisine',
    'salle-de-bain',
    'bureau',
    'entree',
    'terrasse',
    'salle-a-manger',
  ].flatMap((room) =>
    frOnlySitemap(`/piece/${room}`, {
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }),
  );

  const priorityCombos = [
    'moderne/salon',
    'scandinave/salon',
    'industriel/salon',
    'boheme/salon',
    'japandi/salon',
    'scandinave/chambre',
    'boheme/chambre',
    'japandi/chambre',
    'minimaliste/chambre',
    'moderne/cuisine',
    'industriel/cuisine',
    'contemporain/cuisine',
    'scandinave/bureau',
    'industriel/bureau',
    'minimaliste/bureau',
    'japandi/salle-de-bain',
    'moderne/salle-de-bain',
    'scandinave/salle-a-manger',
    'rustique/salle-a-manger',
  ];
  const decoPages: MetadataRoute.Sitemap = priorityCombos.flatMap((combo) =>
    frOnlySitemap(`/deco/${combo}`, {
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }),
  );

  // Dérivé de INTENT_PAGES pour que toute nouvelle page /solution entre au sitemap sans oubli.
  // On émet chaque page sous sa locale d'indexation réelle (fr par défaut, de si contenu allemand).
  const solutionPages: MetadataRoute.Sitemap = INTENT_PAGES.flatMap((p) =>
    localeOnlySitemap(p.indexLocale ?? 'fr', `/solution/${p.slug}`, {
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }),
  );

  // Pages pSEO publiées (drip-feed) : on ne référence que le statut 'published'.
  let pseoPages: MetadataRoute.Sitemap = [];
  try {
    const { getSupabaseAdmin } = await import('@/lib/supabase/admin-client');
    const { data } = await getSupabaseAdmin()
      .from('pseo_pages')
      .select('slug, updated_at, unique_seo_text')
      .eq('status', 'published');
    // Barrière qualité : on ne référence que les pages au-dessus du seuil d'unicité
    // (cohérent avec le noindex,follow posé dans le rendu de la page).
    pseoPages = (data || [])
      .filter((p: { unique_seo_text: string | null }) => isPseoContentIndexable(p.unique_seo_text))
      .flatMap((p: { slug: string; updated_at: string }) =>
        frOnlySitemap(`/amenager/${p.slug}`, {
          lastModified: p.updated_at ? new Date(p.updated_at) : now,
          changeFrequency: 'monthly' as const,
          priority: 0.5,
        }),
      );
  } catch (error) {
    console.error('Error loading pseo_pages for sitemap:', error);
  }

  return [
    ...staticPages,
    ...blogIndexPage,
    ...articlePages,
    ...cityIndexPage,
    ...cityPages,
    ...stylePages,
    ...roomPages,
    ...solutionPages,
    ...decoPages,
    ...pseoPages,
  ];
}
