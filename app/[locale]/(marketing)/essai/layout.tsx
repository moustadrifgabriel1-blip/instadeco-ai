import { Metadata } from 'next';
import { getCanonicalUrl, getLocalizedCanonicalUrl } from '@/lib/seo/config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: 'Essai Gratuit - Testez la Transformation IA | InstaDeco',
    description:
      'Testez gratuitement la transformation de votre pièce par IA. Uploadez une photo, choisissez un style, et voyez le résultat en 30 secondes. Sans inscription.',
    keywords: [
      'essai gratuit décoration IA',
      'test transformation pièce',
      'décoration IA gratuit',
      'simulation décoration gratuit',
    ],
    openGraph: {
      title: 'Essai Gratuit - Transformez votre pièce par IA | InstaDeco',
      description:
        'Testez gratuitement sans inscription. Uploadez une photo → choisissez un style → résultat en 30 secondes.',
      type: 'website',
      url: getLocalizedCanonicalUrl(locale, '/essai'),
      images: [getCanonicalUrl('/og-image.png')],
    },
    robots: { index: true, follow: true },
    // Canonical AUTO-RÉFÉRENT par locale (corrige le bug : pointait vers la home /fr → page désindexée)
    alternates: {
      canonical: getLocalizedCanonicalUrl(locale, '/essai'),
      languages: {
        'fr-FR': getLocalizedCanonicalUrl('fr', '/essai'),
        en: getLocalizedCanonicalUrl('en', '/essai'),
        de: getLocalizedCanonicalUrl('de', '/essai'),
        'x-default': getLocalizedCanonicalUrl('fr', '/essai'),
      },
    },
  };
}

export default function EssaiLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
