/**
 * Metadata SEO pour la page Pricing + JSON-LD
 */

import { Metadata } from 'next';
import { JsonLd } from '@/lib/seo/json-ld';
import { generateProductSchema, generateFAQSchema, generateBreadcrumbList } from '@/lib/seo/schemas';
import { getLocalizedCanonicalUrl, withLocalePath } from '@/lib/seo/config';
import { getMessages, getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'PricingMeta' });

  return {
    title: t('title'),
    description: t('description'),
    keywords: [
      'tarifs décoration IA',
      'prix home staging virtuel',
      'crédits InstaDeco',
      'décoration intérieur prix',
      'home staging virtuel tarif',
      'générer décoration IA coût',
      'décoration sans abonnement',
    ],
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      type: 'website',
      url: getLocalizedCanonicalUrl(locale, '/pricing'),
      images: [getLocalizedCanonicalUrl(locale, '/og-image.png')],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('twitterTitle'),
      description: t('twitterDescription'),
    },
    alternates: {
      canonical: getLocalizedCanonicalUrl(locale, '/pricing'),
      languages: {
        'fr-FR': getLocalizedCanonicalUrl('fr', '/pricing'),
        en: getLocalizedCanonicalUrl('en', '/pricing'),
        de: getLocalizedCanonicalUrl('de', '/pricing'),
        'x-default': getLocalizedCanonicalUrl('fr', '/pricing'),
      },
    },
  };
}

export default async function PricingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();
  const pricing = messages.Pricing as {
    creditPacks: Array<{ name: string; price: number; credits: number; description: string }>;
    faq: Array<{ question: string; answer: string }>;
  };

  const pricingPlans = pricing.creditPacks.map((p) => ({
    name: p.name,
    price: p.price,
    credits: p.credits,
    description: p.description,
  }));

  const pricingFAQ = pricing.faq.map((item) => ({
    question: item.question,
    answer: item.answer,
  }));

  const tMeta = await getTranslations({ locale, namespace: 'PricingMeta' });

  return (
    <>
      <JsonLd
        data={[
          generateProductSchema(pricingPlans),
          generateFAQSchema(pricingFAQ),
          generateBreadcrumbList([{ label: tMeta('breadcrumb'), path: withLocalePath(locale, '/pricing') }], {
            home: { name: tMeta('breadcrumbHome'), url: withLocalePath(locale, '/') },
          }),
        ]}
      />
      {children}
    </>
  );
}
