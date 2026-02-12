import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Header, Footer } from '@/components/layout';
import { CookieBanner } from '@/components/features/cookie-banner';
import { GoogleAnalytics } from '@/components/features/google-analytics';
import { JsonLd } from '@/lib/seo/json-ld';
import { generateOrganizationSchema, generateWebSiteSchema, generateSoftwareAppSchema } from '@/lib/seo/schemas';
import { SEO_CONFIG } from '@/lib/seo/config';

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

const BASE_URL = SEO_CONFIG.siteUrl;

export const metadata: Metadata = {
  // ============================================
  // META DE BASE
  // ============================================
  title: {
    default: 'InstaDeco AI - Décoration d\'intérieur par Intelligence Artificielle',
    template: '%s | InstaDeco AI',
  },
  description: 'Transformez vos pièces en rendus décorés professionnels en quelques secondes grâce à l\'IA. Home staging virtuel, inspiration déco, visualisation avant travaux.',
  keywords: [
    'décoration intérieur IA',
    'home staging virtuel',
    'design intérieur intelligence artificielle',
    'transformation pièce IA',
    'décoration maison',
    'visualisation déco',
    'avant après décoration',
    'inspiration intérieur',
    'aménagement intérieur',
    'déco salon',
    'déco chambre',
    'style scandinave',
    'style moderne',
    'style bohème',
  ],
  
  // ============================================
  // AUTEUR & SITE
  // ============================================
  authors: [{ name: 'InstaDeco AI', url: BASE_URL }],
  creator: 'InstaDeco AI',
  publisher: 'InstaDeco AI',
  
  // ============================================
  // ROBOTS & INDEXATION
  // ============================================
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
  
  // ============================================
  // OPEN GRAPH (Facebook, LinkedIn)
  // ============================================
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: BASE_URL,
    siteName: 'InstaDeco AI',
    title: 'InstaDeco AI - Décoration d\'intérieur par Intelligence Artificielle',
    description: 'Transformez vos pièces en rendus décorés professionnels en quelques secondes grâce à l\'IA.',
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'InstaDeco AI - Décoration d\'intérieur par IA',
      },
    ],
  },
  
  // ============================================
  // TWITTER CARD
  // ============================================
  twitter: {
    card: 'summary_large_image',
    title: 'InstaDeco AI - Décoration d\'intérieur par IA',
    description: 'Transformez vos pièces en rendus décorés professionnels grâce à l\'IA.',
    images: [`${BASE_URL}/og-image.png`],
    creator: '@instadeco_ai',
  },
  
  // ============================================
  // LIENS ALTERNATIFS
  // ============================================
  alternates: {
    canonical: BASE_URL,
  },
  
  // ============================================
  // CATÉGORIE & CLASSIFICATION
  // ============================================
  category: 'technology',
  
  // ============================================
  // PWA & APP
  // ============================================
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'InstaDeco',
  },
  
  // ============================================
  // AUTRES
  // ============================================
  other: {
    ...(SEO_CONFIG.googleSiteVerification ? { 'google-site-verification': SEO_CONFIG.googleSiteVerification } : {}),
    'p:domain_verify': 'cafe11f55ab96fa778747680609afb75',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#E07B54',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="scroll-smooth">
      <head>
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="geo.region" content="FR" />
        <meta name="geo.region" content="CH" />
        <meta name="geo.region" content="BE" />
        {/* Preload LCP images for faster rendering */}
        <link rel="preload" as="image" href="/images/before-chambre-1.jpg" fetchPriority="high" />
        <link rel="preload" as="image" href="/images/after-chambre-1.jpg" fetchPriority="high" />
        {/* Preconnect pour améliorer LCP */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* RSS Feed pour le blog */}
        <link rel="alternate" type="application/rss+xml" title="InstaDeco AI Blog" href={`${BASE_URL}/api/rss`} />
        {/* JSON-LD Schemas globaux */}
        <JsonLd data={[
          generateOrganizationSchema(),
          generateWebSiteSchema(),
          generateSoftwareAppSchema(),
        ]} />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans min-h-screen bg-background text-foreground antialiased selection:bg-primary/20`}>
        <div className="min-h-screen flex flex-col">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-[#1d1d1f] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium"
          >
            Aller au contenu principal
          </a>
          <Header />
          <main id="main-content" className="flex-1">{children}</main>
          <Footer />
          <CookieBanner />
          <GoogleAnalytics />
        </div>
      </body>
    </html>
  );
}
