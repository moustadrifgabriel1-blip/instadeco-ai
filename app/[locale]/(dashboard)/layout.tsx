import type { Metadata } from 'next';
import { cormorant, josefin } from '@/lib/fonts';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

/**
 * Espace connecté en DA prestige appliquée. La classe .prestige-app remappe
 * les tokens shadcn vers la palette nuit + or (cf. app/globals.css), donc tous
 * les composants héritent du thème sombre. On charge aussi les fonts éditoriales
 * (variables CSS) pour les titres (.prestige-display) et labels (.prestige-eyebrow),
 * sans changer la police de base (Inter, lisible pour une surface applicative).
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${cormorant.variable} ${josefin.variable} prestige-app min-h-screen`}>
      {children}
    </div>
  );
}
