import type { Metadata } from 'next';
import { cormorant, josefin } from '@/lib/fonts';
import './prestige.css';

/**
 * Layout du route group (prestige), maquette de refonte ultra-premium.
 *
 * Imbriqué SOUS app/[locale]/layout.tsx : on NE redéclare donc PAS
 * <html>/<body> (interdit par Next pour un layout enfant). On injecte
 * ici les fonts éditoriales en variables CSS et on enrobe le contenu
 * dans un wrapper noir scopé. Le header/footer marketing global est
 * masqué via :has([data-prestige-root]) (cf. prestige.css), aucune
 * modification du layout global.
 */

export const metadata: Metadata = {
  title: 'Visite privée · Home staging virtuel IA | InstaDeco',
  description:
    'Home staging virtuel par IA pour les agences immobilières de prestige. Vendez le rêve avant la visite.',
  // Maquette interne en cours de validation : on ne l'indexe pas.
  robots: { index: false, follow: false },
};

export default function PrestigeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${cormorant.variable} ${josefin.variable} prestige-root prestige-body`}>
      {children}
    </div>
  );
}
