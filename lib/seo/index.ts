/**
 * SEO System - InstaDeco AI
 * 
 * Système SEO automatique complet et scalable.
 * Gère les structured data (JSON-LD), les métadonnées,
 * les canonical URLs et le maillage interne.
 * 
 * @module lib/seo
 */

export { JsonLd, type JsonLdProps } from './json-ld';
export { generateBreadcrumbSchema, generateOrganizationSchema, generateWebSiteSchema, generateSoftwareAppSchema, generateFAQSchema, generateProductSchema, generateLocalBusinessSchema, generateBlogPostingSchema, generateArticleSchema, generateBreadcrumbList, generateAggregateRating } from './schemas';
export { SEO_CONFIG, getCanonicalUrl, getFullUrl } from './config';
