import { MetadataRoute } from 'next';
import { SEO_CONFIG } from '@/lib/seo/config';

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

// Nettoyer l'URL de base pour retirer les espaces et retours à la ligne
const BASE_URL = (SEO_CONFIG.siteUrl || 'https://instadeco.app').trim().replace(/\s+/g, '');

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
      url: `${BASE_URL}/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/signup`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // ============================================
  // PAGES LÉGALES
  // ============================================
  const legalPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/legal/mentions-legales`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/legal/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/legal/cgv`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

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
    ...legalPages, 
    ...blogIndexPage, 
    ...articlePages, 
    ...cityIndexPage,
    ...cityPages, 
    ...stylePages,
    ...roomPages,
    ...solutionPages,
  ];
}
