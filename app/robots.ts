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
        allow: '/',
        disallow: [
          '/api/',
          '/auth/',
          '/outbound/',
          '/_next/',
          '/*/dashboard/',
          '/*/credits/',
          '/*/login',
          '/*/signup',
          '/*/reset-password',
        ],
      },
    ],
    sitemap: [`${BASE_URL}/sitemap.xml`, `${BASE_URL}/image-sitemap.xml`],
  };
}
