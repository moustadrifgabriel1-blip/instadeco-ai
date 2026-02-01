import { MetadataRoute } from 'next';

/**
 * Fichier robots.txt dynamique
 * 
 * Configure les règles pour les crawlers :
 * - Autorise l'indexation des pages publiques
 * - Bloque les pages privées et API
 * 
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://instadeco.app';

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
          '/credits/',       // Pages post-paiement
          '/hd-success/',    // Page succès HD
          '/seed/',          // Page de test
        ],
      },
      {
        // Googlebot - règles spécifiques
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/auth/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
