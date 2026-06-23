/**
 * Générateurs de Schemas JSON-LD (Schema.org)
 * 
 * Chaque fonction génère un objet structuré conforme
 * aux spécifications Schema.org pour les rich snippets Google.
 */

import { SEO_CONFIG, getCanonicalUrl, getFullUrl, getLocalizedCanonicalUrl } from './config';

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
    founder: {
      '@type': 'Person',
      name: 'Gabriel Moustadrif',
    },
    email: SEO_CONFIG.email,
    // Profils réels (entité InstaDeco). N'inclure QUE des comptes existants.
    sameAs: [
      'https://www.instagram.com/instadecoai',
      'https://www.facebook.com/people/InstaDeco-AI/61588194177866/',
      'https://www.pinterest.com/InstadecoApp/',
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
export function generateWebSiteSchema(locale: string = SEO_CONFIG.language) {
  return {
    '@type': 'WebSite',
    '@id': `${SEO_CONFIG.siteUrl}/#website`,
    url: SEO_CONFIG.siteUrl,
    name: SEO_CONFIG.siteName,
    description: SEO_CONFIG.siteDescription,
    publisher: {
      '@id': `${SEO_CONFIG.siteUrl}/#organization`,
    },
    inLanguage: locale,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${getLocalizedCanonicalUrl('fr', '/blog')}?search={search_term_string}`,
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
  // priceValidUntil : 1 an à partir d'aujourd'hui (requis par Google)
  const priceValidUntil = new Date(
    new Date().getFullYear() + 1,
    new Date().getMonth(),
    new Date().getDate()
  ).toISOString().split('T')[0];

  return {
    '@type': 'SoftwareApplication',
    '@id': `${SEO_CONFIG.siteUrl}/#software`, // @id stable → Google fusionne les instances (dédup)
    name: SEO_CONFIG.siteName,
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web',
    description: SEO_CONFIG.siteDescription,
    url: getCanonicalUrl('/generate'),
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '9.90',
      highPrice: '34.90',
      priceCurrency: 'EUR',
      offerCount: 3,
      priceValidUntil,
    },
    screenshot: getFullUrl(SEO_CONFIG.ogImage),
    featureList: [
      'Décoration par Intelligence Artificielle',
      'Home staging virtuel',
      '12 styles de décoration',
      'Résultat en ~30 secondes',
      'Export haute définition',
    ],
  };
}

/**
 * Schema Product/Offer pour la page pricing
 * 
 * Inclut shippingDetails (produit digital = livraison immédiate)
 * et hasMerchantReturnPolicy (requis par Google Merchant)
 */
export function generateProductSchema(plans: Array<{
  name: string;
  price: number;
  credits: number;
  description: string;
}>) {
  // priceValidUntil : 1 an à partir d'aujourd'hui (format ISO)
  const priceValidUntil = new Date(
    new Date().getFullYear() + 1,
    new Date().getMonth(),
    new Date().getDate()
  ).toISOString().split('T')[0];

  // Politique de retour pour produit numérique (non remboursable après utilisation)
  const returnPolicy = {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: ['FR', 'BE', 'CH'],
    returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
    merchantReturnDays: 0,
  };

  // Livraison digitale = instantanée, gratuite
  const shippingDetails = {
    '@type': 'OfferShippingDetails',
    shippingRate: {
      '@type': 'MonetaryAmount',
      value: '0',
      currency: 'EUR',
    },
    shippingDestination: {
      '@type': 'DefinedRegion',
      addressCountry: 'FR',
    },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: {
        '@type': 'QuantitativeValue',
        minValue: 0,
        maxValue: 0,
        unitCode: 'DAY',
      },
      transitTime: {
        '@type': 'QuantitativeValue',
        minValue: 0,
        maxValue: 0,
        unitCode: 'DAY',
      },
    },
  };

  return {
    '@type': 'Product',
    name: 'Crédits InstaDeco AI',
    description: 'Crédits pour générer des rendus de décoration d\'intérieur par IA',
    image: getFullUrl(SEO_CONFIG.ogImage),
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
      priceValidUntil,
      availability: 'https://schema.org/InStock',
      url: getCanonicalUrl('/pricing'),
      image: getFullUrl(SEO_CONFIG.ogImage),
      hasMerchantReturnPolicy: returnPolicy,
      shippingDetails,
    })),
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

/**
 * Schema HowTo : décrit le flux réel d'utilisation (photo -> style -> rendu).
 * Étapes factuelles, aucune invention. Utile pour AI Overviews et rich results.
 */
export function generateHowToSchema() {
  return {
    '@type': 'HowTo',
    name: 'Comment redécorer une pièce avec InstaDeco AI',
    description:
      "Transformer la photo d'une pièce en rendu décoré photoréaliste avec l'IA, en trois étapes.",
    totalTime: 'PT1M',
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Prendre une photo de la pièce',
        text: "Photographier ou téléverser la pièce à redécorer, même en désordre. La structure (murs, fenêtres, sol) est préservée par l'IA.",
        url: `${SEO_CONFIG.siteUrl}/fr/generate`,
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Choisir un style et le type de pièce',
        text: 'Sélectionner un style de décoration (Moderne, Scandinave, Industriel, Japandi...) et le type de pièce.',
        url: `${SEO_CONFIG.siteUrl}/fr/generate`,
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Recevoir le rendu',
        text: "En quelques secondes, l'IA renvoie des propositions photoréalistes à comparer et télécharger.",
        url: `${SEO_CONFIG.siteUrl}/fr/generate`,
      },
    ],
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
  locale?: string;
}) {
  const locale = article.locale || 'fr';
  const blogUrl = getLocalizedCanonicalUrl(locale, `/blog/${article.slug}`);
  return {
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.description,
    url: blogUrl,
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
      '@id': blogUrl,
    },
    keywords: article.tags?.join(', '),
    wordCount: article.wordCount,
    inLanguage: locale,
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
}, locale: string = SEO_CONFIG.language) {
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
    inLanguage: locale,
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
export function generateBreadcrumbList(
  segments: Array<{ label: string; path: string }>,
  options?: { home?: { name: string; url: string } },
) {
  const home = options?.home ?? { name: 'Accueil', url: '/' };
  const items = [
    { name: home.name, url: home.url },
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
export function generateServiceSchema(city: {
  name: string;
  slug: string;
  region: string;
  zip: string;
  country: string;
  currency: string;
}) {
  return {
    '@type': 'Service',
    name: `Décoration d'intérieur par IA à ${city.name}`,
    description: `Service en ligne de décoration d'intérieur et home staging virtuel par IA, disponible à ${city.name} (${city.region}).`,
    // URL basée sur le slug réel de la route (gère les accents : Genève -> geneve).
    url: getCanonicalUrl(`/architecte-interieur/${city.slug}`),
    provider: {
      '@type': 'Organization',
      '@id': `${SEO_CONFIG.siteUrl}/#organization`,
      name: SEO_CONFIG.organization.name,
    },
    areaServed: {
      '@type': 'City',
      name: city.name,
      containedInPlace: {
        '@type': 'AdministrativeArea',
        name: city.region,
      },
    },
    serviceType: 'Décoration d\'intérieur virtuelle',
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '9.99',
      highPrice: '34.99',
      priceCurrency: city.country === 'CH' ? 'CHF' : 'EUR',
      priceValidUntil: new Date(
        new Date().getFullYear() + 1,
        new Date().getMonth(),
        new Date().getDate()
      ).toISOString().split('T')[0],
    },
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: SEO_CONFIG.siteUrl,
      availableLanguage: 'fr',
    },
  };
}

/**
 * Schema WebPage générique pour les pages programmatiques
 * (styles, pièces, deco croisé)
 */
export function generateWebPageSchema(page: {
  title: string;
  description: string;
  url: string;
}, locale: string = SEO_CONFIG.language) {
  return {
    '@type': 'WebPage',
    name: page.title,
    description: page.description,
    url: page.url.startsWith('http') ? page.url : getCanonicalUrl(page.url),
    isPartOf: {
      '@id': `${SEO_CONFIG.siteUrl}/#website`,
    },
    publisher: {
      '@id': `${SEO_CONFIG.siteUrl}/#organization`,
    },
    inLanguage: locale,
  };
}
