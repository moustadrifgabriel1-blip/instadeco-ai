import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Générateur Vidéo TikTok Avant/Après - Transitions Virales | InstaDeco',
  description: 'Créez des vidéos avant/après virales pour TikTok, Reels et Shorts en 1 clic. 6 transitions pro, format 9:16, export instantané. Gratuit.',
  keywords: [
    'générateur tiktok avant après',
    'vidéo avant après décoration',
    'tiktok home staging',
    'reels décoration intérieur',
    'vidéo transition avant après',
    'shorts youtube décoration',
    'contenu viral décoration',
  ],
  openGraph: {
    title: 'Générateur Vidéo TikTok Avant/Après | InstaDeco',
    description: 'Créez des vidéos avant/après virales en 1 clic. Transitions pro, export instantané.',
    type: 'website',
    url: 'https://instadeco.app/tiktok-generator',
    locale: 'fr_FR',
  },
  alternates: {
    canonical: 'https://instadeco.app/tiktok-generator',
  },
};

export default function TikTokGeneratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
