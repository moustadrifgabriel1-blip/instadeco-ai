import { cormorant, josefin } from '@/lib/fonts';
import { PrestigeRevealObserver } from '@/components/prestige/prestige-reveal-observer';

/**
 * Layout du groupe (marketing) : applique la DA prestige (nuit + or) à toutes
 * les pages publiques. La classe .prestige-app remappe les tokens shadcn vers
 * la palette sombre (cf. app/globals.css), donc les pages basées sur ces tokens
 * se thématisent automatiquement ; les pages à couleurs en dur sont restylées
 * une à une. Les fonts éditoriales sont exposées en variables CSS pour les
 * titres (.prestige-display) et labels (.prestige-eyebrow).
 *
 * Les surfaces immersives (home, exemples) posent en plus .prestige-root et
 * data-prestige-root par-dessus, ce qui reste compatible.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${cormorant.variable} ${josefin.variable} prestige-app min-h-screen`}>
      {children}
      <PrestigeRevealObserver />
    </div>
  );
}
