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
          '/api/',           // API routes
          '/dashboard/',     // Dashboard privé
          '/auth/',          // Callback auth
          '/login',          // Page login (pas de valeur SEO)
          '/signup',         // Page signup (pas de valeur SEO)
          '/credits/',       // Pages post-paiement
          '/hd-success/',    // Page succès HD
          '/_next/',         // Next.js internals
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
