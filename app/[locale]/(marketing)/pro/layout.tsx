import { Metadata } from 'next';
import { getCanonicalUrl, getLocalizedCanonicalUrl } from '@/lib/seo/config';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const path = '/pro';

  return {
    title: 'InstaDeco Pro — Home Staging Virtuel pour Agents Immobiliers',
    description: 'Transformez vos annonces immobilières avec le home staging virtuel par IA. Générations illimitées + HD pour 49€/mois. Vendez plus vite, à meilleur prix.',
    alternates: {
      canonical: getLocalizedCanonicalUrl(locale, path),
      languages: {
        'fr-FR': getLocalizedCanonicalUrl('fr', path),
        en: getLocalizedCanonicalUrl('en', path),
        de: getLocalizedCanonicalUrl('de', path),
        'x-default': getLocalizedCanonicalUrl('fr', path),
      },
    },
    openGraph: {
      title: 'InstaDeco Pro — Home Staging Virtuel pour Agents Immobiliers',
      description: 'Générations illimitées + qualité HD. Vendez plus vite avec le home staging virtuel par IA.',
      url: getLocalizedCanonicalUrl(locale, path),
      type: 'website',
      images: [getCanonicalUrl('/api/og')],
    },
    keywords: [
      'home staging virtuel',
      'home staging immobilier',
      'home staging IA',
      'logiciel home staging',
      'home staging agent immobilier',
      'valorisation immobilière',
      'home staging gratuit',
      'home staging virtuel gratuit',
      'logiciel home staging professionnel',
    ],
  };
}

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return children;
}
