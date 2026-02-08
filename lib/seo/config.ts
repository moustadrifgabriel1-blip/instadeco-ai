/**
 * SEO Configuration centralisée
 * 
 * Source unique de vérité pour toutes les URLs, domaines
 * et constantes SEO du site.
 */

export const SEO_CONFIG = {
  // Domaine principal - UNIQUE source de vérité
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://instadeco.app',
  siteName: 'InstaDeco AI',
  siteDescription: 'Transformez vos pièces en rendus décorés professionnels en quelques secondes grâce à l\'IA. Home staging virtuel, inspiration déco, visualisation avant travaux.',
  
  // Branding
  logo: '/logo.png',
  ogImage: '/og-image.png',
  themeColor: '#E07B54',
  
  // Contact
  email: 'contact@instadeco.app',
  twitterHandle: '@instadeco_ai',
  
  // Langues / Régions
  locale: 'fr_FR',
  language: 'fr',
  targetCountries: ['FR', 'CH', 'BE'] as const,
  
  // Organisation
  organization: {
    name: 'InstaDeco AI',
    legalName: 'InstaDeco AI',
    foundingDate: '2025',
    founders: ['InstaDeco Team'],
  },
  
  // SEO Technique
  indexNowKey: process.env.INDEXNOW_KEY || '',
  googleSiteVerification: process.env.GOOGLE_SITE_VERIFICATION || '',
  
  // Catégories de mots-clés par pays
  keywords: {
    global: [
      'décoration intérieur IA',
      'home staging virtuel',
      'design intérieur intelligence artificielle',
      'transformation pièce IA',
      'décoration maison IA',
      'visualisation déco avant après',
      'relooking intérieur en ligne',
      'simulateur décoration',
    ],
    FR: [
      'décoration maison France',
      'architecte intérieur en ligne',
      'rénovation intérieur prix',
      'home staging France',
      'simulation décoration appartement',
    ],
    CH: [
      'décoration intérieur Suisse',
      'architecte intérieur Suisse romande',
      'rénovation appartement Genève',
      'home staging Lausanne',
      'décoration Suisse romande',
    ],
    BE: [
      'décoration intérieur Belgique',
      'architecte intérieur Bruxelles',
      'rénovation maison Belgique',
      'home staging Bruxelles',
      'décoration maison Wallonie',
    ],
  },
} as const;

/**
 * Génère l'URL canonique à partir d'un chemin relatif
 */
export function getCanonicalUrl(path: string): string {
  const base = SEO_CONFIG.siteUrl.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

/**
 * Génère l'URL complète pour les ressources (images, etc.)
 */
export function getFullUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return getCanonicalUrl(path);
}
