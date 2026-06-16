import { Metadata } from 'next';
import { cormorant, josefin } from '@/lib/fonts';
import { getCanonicalUrl, getLocalizedCanonicalUrl } from '@/lib/seo/config';
import { ExemplesExperience } from './exemples-experience';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const path = '/exemples';

  return {
    title: 'Exemples de transformations IA, avant/après réels | InstaDeco',
    description:
      'De vraies transformations de décoration par IA. Séjour, chambre, salle de bain : comparez la pièce brute et la pièce mise en scène, comme vous la livrerez à vos acquéreurs.',
    keywords: ['exemples décoration IA', 'avant après déco', 'transformation intérieur', 'home staging virtuel', 'galerie décoration', 'réalisations IA déco'],
    openGraph: {
      title: 'Exemples de transformations déco par IA | InstaDeco',
      description: 'Avant/après réels de séjours, chambres et salles de bain mis en scène par l\'IA.',
      type: 'website',
      url: getLocalizedCanonicalUrl(locale, path),
      images: [getCanonicalUrl('/og-image.png')],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Transformations déco par IA, exemples | InstaDeco',
      description: 'Avant/après réels de décoration intérieure par IA.',
    },
    alternates: {
      canonical: getLocalizedCanonicalUrl(locale, path),
      languages: {
        'fr-FR': getLocalizedCanonicalUrl('fr', path),
        en: getLocalizedCanonicalUrl('en', path),
        de: getLocalizedCanonicalUrl('de', path),
        'x-default': getLocalizedCanonicalUrl('fr', path),
      },
    },
  };
}

export default function ExemplesPage() {
  return (
    <div
      className={`${cormorant.variable} ${josefin.variable} prestige-root prestige-body`}
      data-prestige-root
    >
      <ExemplesExperience />
    </div>
  );
}
