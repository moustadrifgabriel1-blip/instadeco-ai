/**
 * SEO Configuration centralisée
 * 
 * Source unique de vérité pour toutes les URLs, domaines
 * et constantes SEO du site.
 */

export const SEO_CONFIG = {
  // Domaine principal - UNIQUE source de vérité.
  // .trim() + suppression du/des slash(es) final(aux) : durcissement contre une variable
  // d'env Vercel polluée par un retour-ligne final (sinon `${siteUrl}/${locale}` produit
  // "https://instadeco.app\n/fr" → toutes les <loc> du sitemap et les hreflang invalides).
  siteUrl: (process.env.NEXT_PUBLIC_APP_URL || 'https://instadeco.app').trim().replace(/\/+$/, ''),
  siteName: 'InstaDeco AI',
  siteDescription: 'Transformez vos pièces en rendus décorés professionnels en quelques secondes grâce à l\'IA. Home staging virtuel, inspiration déco, visualisation avant travaux.',
  
  // Branding
  logo: '/images/logo-v3-house-sparkle.svg',
  ogImage: '/og-image.png', // PNG statique 1200x630 (public/og-image.png, dérivé de og-image.svg). Robuste sur tous les réseaux ; la route edge /api/og renvoyait un corps vide.
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
 * URL canonique avec préfixe de locale (/fr, /en, /de).
 * @param locale Code langue (fr | en | de)
 * @param path Chemin sans locale, ex: '/' ou '/pricing'
 */
export function getLocalizedCanonicalUrl(locale: string, path: string): string {
  const base = SEO_CONFIG.siteUrl.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (cleanPath === '/') {
    return `${base}/${locale}`;
  }
  return `${base}/${locale}${cleanPath}`;
}

/**
 * Métadonnées pour les pages programmatiques NON traduites (contenu FR uniquement :
 * architecte-interieur, style, piece, solution). Tant qu'il n'existe pas de vraie
 * traduction en/de, on :
 *  - ne déclare PAS de hreflang en/de (sinon Google indexe du FR sous une URL en/de) ;
 *  - consolide tout vers la version FR (canonical → /fr/...) ;
 *  - noindexe les variantes non-fr (elles servent du FR → mauvais signal SEO).
 * À remplacer par de vraies traductions (getTranslations) le jour où le contenu est localisé.
 */
export function frOnlyProgrammaticMeta(locale: string, path: string) {
  const frUrl = getLocalizedCanonicalUrl('fr', path);
  return {
    alternates: {
      canonical: frUrl,
      languages: { 'fr-FR': frUrl, 'x-default': frUrl },
    },
    robots: locale === 'fr' ? undefined : { index: false, follow: true },
  } as const;
}

/** Chemin relatif avec préfixe locale (ex: withLocalePath('fr', '/pricing') → '/fr/pricing') */
export function withLocalePath(locale: string, path: string): string {
  if (path === '/' || path === '') {
    return `/${locale}`;
  }
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${clean}`;
}

/**
 * Génère l'URL complète pour les ressources (images, etc.)
 */
export function getFullUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return getCanonicalUrl(path);
}
