import { Metadata } from 'next';
import { getCanonicalUrl } from '@/lib/seo/config';

export const metadata: Metadata = {
  title: 'InstaDeco Pro — Home Staging Virtuel pour Agents Immobiliers',
  description: 'Transformez vos annonces immobilières avec le home staging virtuel par IA. Générations illimitées + HD pour 49€/mois. Vendez plus vite, à meilleur prix.',
  alternates: { canonical: getCanonicalUrl('/pro') },
  openGraph: {
    title: 'InstaDeco Pro — Home Staging Virtuel pour Agents Immobiliers',
    description: 'Générations illimitées + qualité HD. Vendez plus vite avec le home staging virtuel par IA.',
    url: getCanonicalUrl('/pro'),
    type: 'website',
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

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return children;
}
