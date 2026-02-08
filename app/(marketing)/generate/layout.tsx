/**
 * Metadata SEO pour la page Generate 
 * 
 * Les pages 'use client' ne peuvent pas exporter metadata,
 * donc on utilise un layout server component pour les injecter.
 */

import { Metadata } from 'next';
import { JsonLd } from '@/lib/seo/json-ld';
import { generateSoftwareAppSchema, generateBreadcrumbList } from '@/lib/seo/schemas';
import { getCanonicalUrl } from '@/lib/seo/config';

export const metadata: Metadata = {
  title: 'Générer votre Décoration par IA - Transformation en 10 secondes | InstaDeco',
  description: 'Uploadez une photo de votre pièce et obtenez un rendu professionnel en 10 secondes. 12+ styles disponibles : Moderne, Scandinave, Japandi, Bohème. Home staging virtuel.',
  keywords: [
    'générer décoration IA',
    'transformer pièce IA',
    'décoration intérieur automatique',
    'home staging IA',
    'simulation décoration en ligne',
    'outil décoration intelligence artificielle',
    'relooking pièce online',
    'avant après décoration IA',
  ],
  openGraph: {
    title: 'Transformez votre pièce par IA - InstaDeco AI',
    description: 'Uploadez une photo, choisissez un style → obtenez un rendu pro en 10 secondes.',
    type: 'website',
    url: getCanonicalUrl('/generate'),
    images: [getCanonicalUrl('/og-image.png')],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Décoration par IA en 10 secondes - InstaDeco',
    description: 'L\'outil de décoration intérieure par IA le plus rapide.',
  },
  alternates: {
    canonical: getCanonicalUrl('/generate'),
  },
};

export default function GenerateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={[
        generateSoftwareAppSchema(),
        generateBreadcrumbList([
          { label: 'Générer', path: '/generate' },
        ]),
      ]} />
      {children}
    </>
  );
}
