'use client';

import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion, isTouchPrimary } from '@/lib/motion-preferences';

// Ré-exportés pour ne pas casser les imports existants. Les nouveaux appels
// devraient viser directement `@/lib/motion-preferences` (aucune dépendance).
export { prefersReducedMotion, isTouchPrimary };

gsap.registerPlugin(ScrollTrigger);

/**
 * Lenis (smooth scroll cinématographique) synchronisé avec GSAP ScrollTrigger.
 * Partagé par toutes les surfaces prestige (visite, exemples, home).
 *
 * - Respecte prefers-reduced-motion : si réduit, on N'INSTALLE PAS Lenis
 *   (scroll natif) et le caller désactive pin/scrub/parallax de son côté.
 * - Cleanup complet au démontage : retire le ticker, détruit Lenis,
 *   et laisse le caller killer ses ScrollTriggers via useGSAP scope.
 */
export function usePrestigeSmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    // Tactile : on n'installe PAS Lenis (scroll natif). ScrollTrigger continue
    // de fonctionner sur les events de scroll natifs, donc rien à synchroniser.
    if (isTouchPrimary()) return;

    // Import dynamique : Lenis ne sert qu'au scroll molette, sur desktop et
    // hors reduced-motion. En statique, il pesait dans le bundle initial de la
    // home y compris sur mobile, où le code n'est jamais exécuté.
    let cleanup: (() => void) | null = null;
    let cancelled = false;

    void import('lenis').then(({ default: Lenis }) => {
      if (cancelled) return;
      cleanup = installLenis(Lenis);
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);
}

type LenisCtor = typeof import('lenis').default;

/**
 * Installe Lenis + la synchro ScrollTrigger, et renvoie son cleanup.
 * Extrait du hook pour garder le useEffect lisible malgré le chargement async.
 */
function installLenis(Lenis: LenisCtor): () => void {
  const lenis = new Lenis({
    duration: 1.15,
    easing: (t: number) => 1 - Math.pow(1 - t, 3.2), // lent, sortie douce
    smoothWheel: true,
  });

  // Lenis pilote ScrollTrigger
  const onScroll = () => ScrollTrigger.update();
  lenis.on('scroll', onScroll);

  const raf = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);

  // Au cas où des images se chargent après le mount
  const refresh = () => ScrollTrigger.refresh();
  const t = window.setTimeout(refresh, 300);
  window.addEventListener('load', refresh);

  return () => {
    window.clearTimeout(t);
    window.removeEventListener('load', refresh);
    gsap.ticker.remove(raf);
    lenis.off('scroll', onScroll);
    lenis.destroy();
  };
}
