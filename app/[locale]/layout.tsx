import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { Header, Footer } from '@/components/layout';
import { CookieBanner } from '@/components/features/cookie-banner';
import { GoogleAnalytics } from '@/components/features/google-analytics';
import { AdTracker } from '@/components/features/ad-tracker';
import { JsonLd } from '@/lib/seo/json-ld';
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateSoftwareAppSchema,
} from '@/lib/seo/schemas';
import { SEO_CONFIG, getLocalizedCanonicalUrl } from '@/lib/seo/config';
import { MetaPixel } from '@/components/features/meta-pixel';
import { routing } from '@/i18n/routing';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
});
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  preload: true,
});

const BASE_URL = SEO_CONFIG.siteUrl.replace(/\/$/, '');

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'Meta' });

  const languages = {
    'fr-FR': getLocalizedCanonicalUrl('fr', '/'),
    en: getLocalizedCanonicalUrl('en', '/'),
    de: getLocalizedCanonicalUrl('de', '/'),
    'x-default': getLocalizedCanonicalUrl('fr', '/'),
  };

  const ogLocale =
    locale === 'fr' ? 'fr_FR' : locale === 'de' ? 'de_DE' : 'en_US';
  const alternateLocales =
    locale === 'fr'
      ? ['en_US', 'de_DE']
      : locale === 'de'
        ? ['fr_FR', 'en_US']
        : ['fr_FR', 'de_DE'];

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: t('titleDefault'),
      template: '%s | InstaDeco AI',
    },
    description: t('descriptionDefault'),
    keywords: t.raw('keywords') as string[],
    authors: [{ name: 'InstaDeco AI', url: BASE_URL }],
    creator: 'InstaDeco AI',
    publisher: 'InstaDeco AI',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: ogLocale,
      alternateLocale: alternateLocales,
      url: getLocalizedCanonicalUrl(locale, '/'),
      siteName: 'InstaDeco AI',
      title: t('titleDefault'),
      description: t('descriptionDefault'),
      images: [
        {
          url: `${BASE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: t('ogImageAlt'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('twitterTitle'),
      description: t('twitterDescription'),
      images: [`${BASE_URL}/og-image.png`],
      creator: '@instadeco_ai',
    },
    alternates: {
      canonical: getLocalizedCanonicalUrl(locale, '/'),
      languages,
    },
    category: 'technology',
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'InstaDeco',
    },
    other: {
      ...(SEO_CONFIG.googleSiteVerification
        ? { 'google-site-verification': SEO_CONFIG.googleSiteVerification }
        : {}),
      ...(process.env.BING_SITE_VERIFICATION
        ? { 'msvalidate.01': process.env.BING_SITE_VERIFICATION }
        : {}),
      'p:domain_verify': 'cafe11f55ab96fa778747680609afb75',
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#E07B54',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const tCommon = await getTranslations({ locale, namespace: 'Common' });

  return (
    <html lang={locale} className="scroll-smooth" suppressHydrationWarning>
      <head>
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="geo.region" content="FR" />
        <meta name="geo.region" content="CH" />
        <meta name="geo.region" content="BE" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="alternate" type="application/rss+xml" title="InstaDeco AI Blog" href={`${BASE_URL}/api/rss`} />
        <JsonLd
          data={[
            generateOrganizationSchema(),
            generateWebSiteSchema(),
            generateSoftwareAppSchema(),
          ]}
        />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} font-sans min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 overflow-x-hidden`}
      >
        <NextIntlClientProvider messages={messages}>
          <div className="min-h-screen flex flex-col">
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-[#1d1d1f] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium"
            >
              {tCommon('skipToContent')}
            </a>
            <Header />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <Footer />
            <CookieBanner />
            <GoogleAnalytics />
            <AdTracker />
            <MetaPixel />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
