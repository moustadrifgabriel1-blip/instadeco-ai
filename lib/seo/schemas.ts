/**
 * Générateurs de Schemas JSON-LD (Schema.org)
 * 
 * Chaque fonction génère un objet structuré conforme
 * aux spécifications Schema.org pour les rich snippets Google.
 */

import { SEO_CONFIG, getCanonicalUrl, getFullUrl } from './config';

// ============================================
// ORGANISATION & SITE
// ============================================

/**
 * Schema Organization - identité de l'entreprise
 * Utilisé sur la homepage et toutes les pages
 */
export function generateOrganizationSchema() {
  return {
    '@type': 'Organization',
    '@id': `${SEO_CONFIG.siteUrl}/#organization`,
    name: SEO_CONFIG.organization.name,
    url: SEO_CONFIG.siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: getFullUrl(SEO_CONFIG.logo),
      width: 512,
      height: 512,
    },
    image: getFullUrl(SEO_CONFIG.ogImage),
    description: SEO_CONFIG.siteDescription,
    foundingDate: SEO_CONFIG.organization.foundingDate,
    email: SEO_CONFIG.email,
    sameAs: [
      `https://twitter.com/${SEO_CONFIG.twitterHandle.replace('@', '')}`,
      'https://instagram.com/instadeco_ai',
      'https://pinterest.com/instadeco_ai',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: SEO_CONFIG.email,
      contactType: 'customer service',
      availableLanguage: ['French'],
    },
    areaServed: SEO_CONFIG.targetCountries.map((country) => ({
      '@type': 'Country',
      name: country === 'FR' ? 'France' : country === 'CH' ? 'Switzerland' : 'Belgium',
    })),
  };
}

/**
 * Schema WebSite - metadata du site avec SearchAction
 * Permet la sitelinks searchbox dans Google
 */
export function generateWebSiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': `${SEO_CONFIG.siteUrl}/#website`,
    url: SEO_CONFIG.siteUrl,
    name: SEO_CONFIG.siteName,
    description: SEO_CONFIG.siteDescription,
    publisher: {
      '@id': `${SEO_CONFIG.siteUrl}/#organization`,
    },
    inLanguage: SEO_CONFIG.language,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SEO_CONFIG.siteUrl}/blog?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// ============================================
// PRODUIT / APPLICATION
// ============================================

/**
 * Schema SoftwareApplication pour la page d'outil
 */
export function generateSoftwareAppSchema() {
  return {
    '@type': 'SoftwareApplication',
    name: SEO_CONFIG.siteName,
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web',
    description: SEO_CONFIG.siteDescription,
    url: getCanonicalUrl('/generate'),
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '9.99',
      highPrice: '34.99',
      priceCurrency: 'EUR',
      offerCount: 3,
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '347',
      bestRating: '5',
    },
    screenshot: getFullUrl(SEO_CONFIG.ogImage),
    featureList: [
      'Décoration par Intelligence Artificielle',
      'Home staging virtuel',
      'Plus de 12 styles de décoration',
      'Résultat en 10 secondes',
      'Export haute définition',
    ],
  };
}

/**
 * Schema Product/Offer pour la page pricing
 */
export function generateProductSchema(plans: Array<{
  name: string;
  price: number;
  credits: number;
  description: string;
}>) {
  return {
    '@type': 'Product',
    name: 'Crédits InstaDeco AI',
    description: 'Crédits pour générer des rendus de décoration d\'intérieur par IA',
    brand: {
      '@type': 'Brand',
      name: SEO_CONFIG.siteName,
    },
    offers: plans.map((plan) => ({
      '@type': 'Offer',
      name: `Pack ${plan.name}`,
      description: `${plan.credits} crédits de génération - ${plan.description}`,
      price: plan.price.toString(),
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url: getCanonicalUrl('/pricing'),
    })),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '347',
      bestRating: '5',
    },
  };
}

// ============================================
// FAQ
// ============================================

/**
 * Schema FAQPage pour les rich snippets FAQ
 * CRITIQUE pour la visibilité dans les SERP
 */
export function generateFAQSchema(items: Array<{
  question: string;
  answer: string;
}>) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

// ============================================
// BLOG
// ============================================

/**
 * Schema BlogPosting pour les articles de blog
 */
export function generateBlogPostingSchema(article: {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  updatedAt?: string;
  image?: string;
  author?: string;
  tags?: string[];
  wordCount?: number;
}) {
  return {
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.description,
    url: getCanonicalUrl(`/blog/${article.slug}`),
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    image: article.image || getFullUrl(SEO_CONFIG.ogImage),
    author: {
      '@type': 'Organization',
      '@id': `${SEO_CONFIG.siteUrl}/#organization`,
      name: article.author || SEO_CONFIG.organization.name,
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${SEO_CONFIG.siteUrl}/#organization`,
      name: SEO_CONFIG.organization.name,
      logo: {
        '@type': 'ImageObject',
        url: getFullUrl(SEO_CONFIG.logo),
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': getCanonicalUrl(`/blog/${article.slug}`),
    },
    keywords: article.tags?.join(', '),
    wordCount: article.wordCount,
    inLanguage: SEO_CONFIG.language,
  };
}

/**
 * Schema Article générique
 */
export function generateArticleSchema(article: {
  title: string;
  description: string;
  url: string;
  publishedAt?: string;
  image?: string;
}) {
  return {
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    url: article.url,
    datePublished: article.publishedAt || new Date().toISOString(),
    image: article.image || getFullUrl(SEO_CONFIG.ogImage),
    author: {
      '@type': 'Organization',
      '@id': `${SEO_CONFIG.siteUrl}/#organization`,
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${SEO_CONFIG.siteUrl}/#organization`,
    },
    inLanguage: SEO_CONFIG.language,
  };
}

// ============================================
// BREADCRUMBS
// ============================================

/**
 * Schema BreadcrumbList pour la navigation
 * CRITIQUE pour les breadcrumbs dans Google SERP
 */
export function generateBreadcrumbSchema(items: Array<{
  name: string;
  url: string;
}>) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : getCanonicalUrl(item.url),
    })),
  };
}

/**
 * Helper pour générer les breadcrumbs à partir d'un chemin
 */
export function generateBreadcrumbList(segments: Array<{ label: string; path: string }>) {
  const items = [
    { name: 'Accueil', url: '/' },
    ...segments.map((s) => ({ name: s.label, url: s.path })),
  ];
  return generateBreadcrumbSchema(items);
}

// ============================================
// SEO LOCAL
// ============================================

/**
 * Schema LocalBusiness pour les pages villes
 */
export function generateLocalBusinessSchema(city: {
  name: string;
  region: string;
  zip: string;
  country: string;
  currency: string;
}) {
  return {
    '@type': 'LocalBusiness',
    '@id': `${SEO_CONFIG.siteUrl}/architecte-interieur/${city.name.toLowerCase().replace(/\s+/g, '-')}#business`,
    name: `InstaDeco AI ${city.name}`,
    image: getFullUrl(SEO_CONFIG.ogImage),
    description: `Service de décoration d'intérieur et home staging virtuel par IA à ${city.name}. Transformez vos pièces en 10 secondes.`,
    url: getCanonicalUrl(`/architecte-interieur/${city.name.toLowerCase().replace(/\s+/g, '-')}`),
    telephone: '',
    email: SEO_CONFIG.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: city.name,
      addressRegion: city.region,
      postalCode: city.zip,
      addressCountry: city.country,
    },
    priceRange: `${city.currency}9.99 - ${city.currency}34.99`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.7',
      ratingCount: '89',
      bestRating: '5',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '00:00',
      closes: '23:59',
    },
    sameAs: [
      SEO_CONFIG.siteUrl,
    ],
  };
}

/**
 * Schema AggregateRating réutilisable
 */
export function generateAggregateRating(rating: number = 4.8, count: number = 347) {
  return {
    '@type': 'AggregateRating',
    ratingValue: rating.toString(),
    ratingCount: count.toString(),
    bestRating: '5',
  };
}
