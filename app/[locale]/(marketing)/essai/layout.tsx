import { Metadata } from 'next';
import { getCanonicalUrl, getLocalizedCanonicalUrl } from '@/lib/seo/config';
import { JsonLd } from '@/lib/seo/json-ld';
import { generateWebPageSchema, generateBreadcrumbList, generateHowToSchema, generateFAQSchema } from '@/lib/seo/schemas';
import { EssaiContenu, ESSAI_FAQ } from './essai-contenu';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    // Pas de suffixe de marque manuel : app/[locale]/layout.tsx applique déjà
    // le template « %s | InstaDeco AI », qui produisait sinon un double suffixe.
    title: 'Essai gratuit : voir sa pièce redécorée par IA, sans compte',
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
  return (
    <>
      <JsonLd
        data={[
          generateWebPageSchema({
            title: 'Essai gratuit : testez la transformation IA',
            description:
              "Testez gratuitement la transformation de votre pièce par IA. Une photo, un style, un résultat en 30 secondes, sans inscription.",
            url: getLocalizedCanonicalUrl('fr', '/essai'),
          }),
          // Le HowTo décrit le flux réel de la page (photo -> style -> rendu).
          generateHowToSchema(),
          generateBreadcrumbList(
            [{ label: 'Essai gratuit', path: getLocalizedCanonicalUrl('fr', '/essai') }],
            { home: { name: 'Accueil', url: getLocalizedCanonicalUrl('fr', '/') } },
          ),
          // Mêmes questions que celles rendues dans la page : le JSON-LD ne
          // doit jamais annoncer un contenu que le visiteur ne voit pas.
          generateFAQSchema(ESSAI_FAQ),
        ]}
      />
      {children}
      <EssaiContenu />
    </>
  );
}
