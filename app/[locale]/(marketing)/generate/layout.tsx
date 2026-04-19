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
  title: 'Rendu d\'intérieur premium par IA | Planche déco professionnelle | InstaDeco',
  description: 'Créez une planche d\'ambiance digne d\'une agence : importez une photo, choisissez un style (Moderne, Japandi, Haussmannien…). Rendu photoréaliste, téléchargement HD. Home staging et relooking virtuels.',
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
    title: 'Planche déco premium par IA — InstaDeco',
    description: 'Un rendu d\'intérieur soigné, prêt à être présenté. Styles haut de gamme, résultat en une trentaine de secondes.',
    type: 'website',
    url: getCanonicalUrl('/generate'),
    images: [getCanonicalUrl('/og-image.png')],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'InstaDeco — rendu d\'intérieur niveau agence',
    description: 'Planches déco photoréalistes, styles premium, export HD.',
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
