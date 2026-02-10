import { Metadata } from 'next';
import { getCanonicalUrl } from '@/lib/seo/config';

export const metadata: Metadata = {
  title: 'Essai Gratuit - Testez la Transformation IA | InstaDeco',
  description: 'Testez gratuitement la transformation de votre pièce par IA. Uploadez une photo, choisissez un style, et voyez le résultat en 30 secondes. Sans inscription.',
  keywords: [
    'essai gratuit décoration IA',
    'test transformation pièce',
    'décoration IA gratuit',
    'simulation décoration gratuit',
  ],
  openGraph: {
    title: 'Essai Gratuit - Transformez votre pièce par IA | InstaDeco',
    description: 'Testez gratuitement sans inscription. Uploadez une photo → choisissez un style → résultat en 30 secondes.',
    type: 'website',
    url: getCanonicalUrl('/essai'),
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function EssaiLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
