/**
 * Composant JSON-LD universel pour structured data
 * 
 * Injecte des données structurées Schema.org dans le <head>
 * de manière sécurisée (anti-XSS).
 */

import { sanitizeJsonLd } from '@/lib/security/sanitize';

export interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Composant Server Component pour injecter du JSON-LD
 * 
 * @example
 * <JsonLd data={organizationSchema} />
 * <JsonLd data={[organizationSchema, websiteSchema]} />
 */
export function JsonLd({ data }: JsonLdProps) {
  // Support des schemas multiples via @graph
  const structuredData = Array.isArray(data)
    ? { '@context': 'https://schema.org', '@graph': data }
    : { '@context': 'https://schema.org', ...data };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: sanitizeJsonLd(structuredData),
      }}
    />
  );
}
