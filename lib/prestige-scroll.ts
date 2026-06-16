'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Détecte prefers-reduced-motion (et l'absence de matchMedia côté SSR).
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

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

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => 1 - Math.pow(1 - t, 3.2), // lent, sortie douce
      smoothWheel: true,
      touchMultiplier: 1.4,
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
  }, []);
}
