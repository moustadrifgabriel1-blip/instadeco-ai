import { Metadata } from 'next';
import { getCanonicalUrl, getLocalizedCanonicalUrl, frOnlyProgrammaticMeta } from '@/lib/seo/config';
import { JsonLd } from '@/lib/seo/json-ld';
import { generateProSubscriptionSchema, generateFAQSchema } from '@/lib/seo/schemas';
import { PRO_FAQ, PRO_PRICING } from './pro-data';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const path = '/pro';

  // La page Pro est rédigée en français uniquement (cible FR + Belgique francophone +
  // Suisse romande). Les variantes /en/pro et /de/pro servaient ce même texte FR tout
  // en étant indexables et déclarées en hreflang : duplicate qui diluait l'autorité de
  // la money page. On consolide tout vers /fr/pro (canonical fr, noindex en/de).
  const frOnly = frOnlyProgrammaticMeta(locale, path);

  return {
    title: 'InstaDeco Pro : home staging virtuel pour agents immobiliers',
    description: 'Transformez vos annonces immobilières avec le home staging virtuel par IA. Générations illimitées et HD pour 49€/mois. Vendez vos biens plus vite.',
    ...frOnly,
    openGraph: {
      title: 'InstaDeco Pro : home staging virtuel pour agents immobiliers',
      description: 'Générations illimitées et qualité HD. Vendez plus vite avec le home staging virtuel par IA.',
      url: getLocalizedCanonicalUrl('fr', path),
      type: 'website',
      images: [getCanonicalUrl('/og-image.png')],
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
  return (
    <>
      <JsonLd
        data={[
          // Offre d'abonnement reelle (Solo/Pro/Agence) + FAQ, depuis la source partagee
          // pro-data pour garantir la parite avec ce que la page affiche.
          generateProSubscriptionSchema(PRO_PRICING),
          generateFAQSchema(PRO_FAQ.map((f) => ({ question: f.q, answer: f.a }))),
        ]}
      />
      {children}
    </>
  );
}
