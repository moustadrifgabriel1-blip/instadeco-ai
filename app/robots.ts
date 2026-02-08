import { MetadataRoute } from 'next';
import { SEO_CONFIG } from '@/lib/seo/config';

/**
 * Fichier robots.txt dynamique
 * 
 * Configure les règles pour les crawlers :
 * - Autorise l'indexation des pages publiques
 * - Bloque les pages privées et API
 * - Déclare les sitemaps
 * 
 * STRATÉGIE: Permettre un crawl maximal des pages
 * de contenu tout en protégeant les pages privées.
 * 
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */

const BASE_URL = SEO_CONFIG.siteUrl;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/blog/',
          '/style/',
          '/piece/',
          '/architecte-interieur/',
          '/exemples',
          '/pricing',
          '/generate',
        ],
        disallow: [
          '/api/',           // API routes
          '/dashboard/',     // Dashboard privé
          '/auth/',          // Callback auth
          '/credits/',       // Pages post-paiement
          '/hd-success/',    // Page succès HD
          '/seed/',          // Page de test
          '/_next/',         // Next.js internals
          '/legal/privacy',  // Pages à faible valeur SEO
          '/legal/cgv',
          '/legal/mentions-legales',
        ],
      },
      {
        // Googlebot - règles spécifiques (plus permissif)
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/auth/', '/seed/'],
      },
      {
        // Bingbot
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/auth/', '/seed/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
