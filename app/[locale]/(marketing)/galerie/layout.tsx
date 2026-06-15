import { Metadata } from 'next';
import { getCanonicalUrl, getLocalizedCanonicalUrl } from '@/lib/seo/config';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const path = '/galerie';

  return {
    title: 'Galerie - Avant/Après Décoration IA | InstaDeco',
    description: 'Découvrez des centaines de transformations avant/après réalisées par IA. Salon, chambre, cuisine : survolez pour voir le résultat. Inspirez-vous et testez gratuitement.',
    keywords: [
      'avant après décoration',
      'galerie décoration IA',
      'exemples home staging virtuel',
      'transformation pièce avant après',
      'inspiration décoration intérieur',
    ],
    openGraph: {
      title: 'Galerie Avant/Après - Transformations par IA | InstaDeco',
      description: 'Des centaines de pièces transformées par IA. Survolez pour voir l\'avant/après instantanément.',
      type: 'website',
      url: getLocalizedCanonicalUrl(locale, path),
      images: [getCanonicalUrl('/og-image.png')],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Galerie Avant/Après - InstaDeco AI',
      description: 'Découvrez des transformations de décoration par IA.',
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

export default function GalerieLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
