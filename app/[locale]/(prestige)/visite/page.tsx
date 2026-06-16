'use client';

import { PrestigeHero } from '../_components/prestige-hero';
import { PrestigeRoomReveal } from '../_components/prestige-room-reveal';
import { usePrestigeSmoothScroll } from '../_components/use-prestige-scroll';

/**
 * /[locale]/visite — Maquette FLAGSHIP « Visite de prestige ».
 *
 * Page isolée (route group (prestige)) destinée à validation AVANT de
 * dérouler la refonte complète. Header/footer marketing masqués via le
 * marqueur data-prestige-root (cf. prestige.css). Smooth scroll Lenis +
 * GSAP ScrollTrigger montés ici, désactivés si prefers-reduced-motion.
 */
export default function VisitePage() {
  usePrestigeSmoothScroll();

  return (
    <div data-prestige-root>
      <PrestigeHero />
      <PrestigeRoomReveal />

      {/* Respiration finale : amorce du crescendo (le clou viendra plus
          tard dans la refonte complète). Garde le pin du salon de l'air
          pour ne pas couper net. */}
      <footer className="mx-auto max-w-6xl px-6 py-[clamp(5rem,16vh,11rem)] text-center sm:px-10">
        <div className="prestige-rule mx-auto mb-10 w-40" aria-hidden />
        <p className="prestige-eyebrow justify-center">La visite ne fait que commencer</p>
        <p className="prestige-display mx-auto mt-5 max-w-2xl text-[clamp(1.4rem,4vw,2.6rem)] leading-tight text-[var(--mist)]">
          Pièce après pièce, faites de chaque bien une{' '}
          <span className="italic text-[var(--gold)]">évidence</span>.
        </p>
      </footer>
    </div>
  );
}
