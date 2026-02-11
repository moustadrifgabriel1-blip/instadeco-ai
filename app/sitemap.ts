import { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';

/**
 * Sitemap dynamique pour SEO
 * 
 * Génère automatiquement le sitemap.xml avec :
 * - Pages statiques du site
 * - Articles de blog dynamiques depuis Supabase
 * - Pages villes SEO local (57+ villes)
 * - Pages programmatiques de styles et pièces
 * 
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */

// Hardcodé pour éviter les problèmes de formatage des variables d'environnement
const BASE_URL = 'https://instadeco.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ============================================
  // PAGES STATIQUES
  // ============================================
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/generate`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/exemples`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/pro`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/quiz`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/galerie`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/essai`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/styles`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/pieces`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/solutions`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/a-propos`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // ============================================
  // PAGES LÉGALES
  // ============================================
  // Pages légales : exclues du sitemap.
  // Elles sont bloquées dans robots.txt, les soumettre au sitemap
  // enverrait des signaux contradictoires à Google.
  // Elles restent accessibles via les liens internes du footer.

  // ============================================
  // ARTICLES DE BLOG (DYNAMIQUE)
  // ============================================
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

    articlePages = (articles || []).map((article) => ({
      url: `${BASE_URL}/blog/${article.slug}`,
      lastModified: new Date(article.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('Error fetching blog articles for sitemap:', error);
  }

  // Page index du blog
  const blogIndexPage: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/blog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  // ============================================
  // PAGES VILLES (SEO LOCAL)
  // ============================================
  const { CITIES } = await import('@/src/shared/constants/cities');
  
  // Page index des villes
  const cityIndexPage: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/architecte-interieur`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  const cityPages: MetadataRoute.Sitemap = CITIES.map((city) => ({
    url: `${BASE_URL}/architecte-interieur/${city.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // ============================================
  // PAGES PROGRAMMATIQUES (STYLES DE DÉCO)
  // ============================================
  const stylePages: MetadataRoute.Sitemap = [
    'moderne', 'scandinave', 'industriel', 'boheme', 'minimaliste',
    'japandi', 'art-deco', 'contemporain', 'rustique', 'coastal',
    'mid-century', 'luxe',
  ].map((style) => ({
    url: `${BASE_URL}/style/${style}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // ============================================
  // PAGES PROGRAMMATIQUES (TYPES DE PIÈCES)
  // ============================================
  const roomPages: MetadataRoute.Sitemap = [
    'salon', 'chambre', 'cuisine', 'salle-de-bain', 'bureau',
    'entree', 'terrasse', 'salle-a-manger',
  ].map((room) => ({
    url: `${BASE_URL}/piece/${room}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // ============================================
  // PAGES SEO CROISÉES (STYLE × PIÈCE)
  // Seules les combinaisons à fort volume de recherche sont soumises.
  // Doit être synchronisé avec PRIORITY_COMBOS dans deco/[style]/[piece]/page.tsx
  // Les autres pages existent mais sont en noindex.
  // ============================================
  const priorityCombos = [
    // Top salon
    'moderne/salon', 'scandinave/salon', 'industriel/salon', 'boheme/salon', 'japandi/salon',
    // Top chambre
    'scandinave/chambre', 'boheme/chambre', 'japandi/chambre', 'minimaliste/chambre',
    // Top cuisine
    'moderne/cuisine', 'industriel/cuisine', 'contemporain/cuisine',
    // Top bureau
    'scandinave/bureau', 'industriel/bureau', 'minimaliste/bureau',
    // Top salle de bain
    'japandi/salle-de-bain', 'moderne/salle-de-bain',
    // Top salle à manger
    'scandinave/salle-a-manger', 'rustique/salle-a-manger',
  ];
  const decoPages: MetadataRoute.Sitemap = priorityCombos.map(combo => ({
    url: `${BASE_URL}/deco/${combo}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // Pages /g/[id] : volontairement exclues du sitemap.
  // Elles servent au partage social (OG) et sont en noindex
  // pour éviter l'index bloat (thin content UGC).

  // ============================================
  // PAGES SEO INTENT (SOLUTIONS)
  // ============================================
  const solutionPages: MetadataRoute.Sitemap = [
    'home-staging-virtuel',
    'simulateur-decoration-interieur',
    'logiciel-home-staging',
    'idee-amenagement-studio',
    'simulateur-peinture',
    'decoration-salon',
    'decoration-chambre',
    'avant-apres-decoration',
  ].map((slug) => ({
    url: `${BASE_URL}/solution/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

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
