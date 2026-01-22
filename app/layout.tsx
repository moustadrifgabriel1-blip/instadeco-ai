import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Header, Footer } from '@/components/layout';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://instadeco.app';

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
    languages: {
      'fr-FR': BASE_URL,
      'fr-CH': BASE_URL,
      'fr-BE': BASE_URL,
    },
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
    'google-site-verification': '', // À remplir avec votre code Google Search Console
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#9333ea',
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
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans min-h-screen bg-background text-foreground antialiased selection:bg-primary/20`}>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
