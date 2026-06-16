/**
 * Metadata SEO pour la page Generate
 *
 * Les pages 'use client' ne peuvent pas exporter metadata,
 * donc on utilise un layout server component pour les injecter.
 */

import { Metadata } from 'next';
import { JsonLd } from '@/lib/seo/json-ld';
import { generateBreadcrumbList } from '@/lib/seo/schemas';
import { getCanonicalUrl, getLocalizedCanonicalUrl, withLocalePath } from '@/lib/seo/config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: 'Rendu d\'intérieur premium par IA | Planche déco professionnelle | InstaDeco',
    description:
      'Créez une planche d\'ambiance digne d\'une agence : importez une photo, choisissez un style (Moderne, Japandi, Haussmannien…). Rendu photoréaliste, téléchargement HD. Home staging et relooking virtuels.',
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
      title: 'Planche déco premium par IA, InstaDeco',
      description:
        'Un rendu d\'intérieur soigné, prêt à être présenté. Styles haut de gamme, résultat en une trentaine de secondes.',
      type: 'website',
      url: getLocalizedCanonicalUrl(locale, '/generate'),
      images: [getCanonicalUrl('/og-image.png')],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'InstaDeco, rendu d\'intérieur niveau agence',
      description: 'Planches déco photoréalistes, styles premium, export HD.',
    },
    // Canonical localisé + hreflang (corrige : canonical sans préfixe de locale → 307)
    alternates: {
      canonical: getLocalizedCanonicalUrl(locale, '/generate'),
      languages: {
        'fr-FR': getLocalizedCanonicalUrl('fr', '/generate'),
        en: getLocalizedCanonicalUrl('en', '/generate'),
        de: getLocalizedCanonicalUrl('de', '/generate'),
        'x-default': getLocalizedCanonicalUrl('fr', '/generate'),
      },
    },
  };
}

export default async function GenerateLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // NB : SoftwareApplication est déjà injecté par le layout global (app/[locale]/layout.tsx)
  // avec un @id stable → on NE le réinjecte PAS ici (évite l'entité dupliquée).
  return (
    <>
      <JsonLd
        data={[
          generateBreadcrumbList(
            [{ label: 'Générer', path: withLocalePath(locale, '/generate') }],
            { home: { name: 'Accueil', url: withLocalePath(locale, '/') } },
          ),
        ]}
      />
      {children}
    </>
  );
}
