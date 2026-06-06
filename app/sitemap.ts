import { MetadataRoute } from 'next';
import { SEO_CONFIG } from '@/lib/seo/config';

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
    ...withAlternatesForAllLocales('/pro', {
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }),
    ...withAlternatesForAllLocales('/quiz', {
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
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
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    const { data: articles } = await supabase
      .from('blog_articles')
      .select('slug, updated_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(1000);

    articlePages = (articles || []).flatMap((article) =>
      withAlternatesForAllLocales(`/blog/${article.slug}`, {
        lastModified: new Date(article.updated_at),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }),
    );
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

    cityIndexPage = withAlternatesForAllLocales('/architecte-interieur', {
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    });

    cityPages = CITIES.flatMap((city) =>
      withAlternatesForAllLocales(`/architecte-interieur/${city.slug}`, {
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
    withAlternatesForAllLocales(`/style/${style}`, {
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
    withAlternatesForAllLocales(`/piece/${room}`, {
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
    withAlternatesForAllLocales(`/deco/${combo}`, {
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }),
  );

  const solutionPages: MetadataRoute.Sitemap = [
    'home-staging-virtuel',
    'simulateur-decoration-interieur',
    'logiciel-home-staging',
    'idee-amenagement-studio',
    'simulateur-peinture',
    'decoration-salon',
    'decoration-chambre',
    'avant-apres-decoration',
  ].flatMap((slug) =>
    withAlternatesForAllLocales(`/solution/${slug}`, {
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }),
  );

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
  ];
}
