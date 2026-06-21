'use client';

import { useEffect } from 'react';
import { usePathname } from '@/i18n/navigation';

/**
 * Observateur global de révélation au scroll. Monté une fois dans le layout
 * (marketing). Au montage (côté client uniquement) :
 *  1. pose le flag .prestige-reveal-on sur <html>, ce qui ARME l'état caché des
 *     .prestige-reveal via CSS. On NE mute PAS le className des éléments :
 *     l'observer vit dans le layout et son effet peut s'exécuter pendant qu'une
 *     page (Suspense en streaming) finit d'hydrater ; stamper une classe sur
 *     ces éléments provoquait un mismatch d'hydratation. <html> porte déjà
 *     suppressHydrationWarning, le flag y est donc sûr.
 *  2. ajoute .is-visible quand l'élément entre dans le viewport (ajout
 *     asynchrone via IntersectionObserver, donc hors fenêtre d'hydratation).
 * Respecte prefers-reduced-motion (aucun masquage). Se relance à chaque
 * navigation client (dépendance pathname) pour couvrir les nouvelles pages.
 */
export function PrestigeRevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    // Arme l'état caché via un flag racine (CSS), SANS muter le className des
    // éléments .prestige-reveal (gérés par React) : une mutation pendant la
    // fenêtre d'hydratation (page streamée via Suspense) provoquait un mismatch.
    // <html> porte suppressHydrationWarning, le flag y est donc sûr et immédiat.
    document.documentElement.classList.add('prestige-reveal-on');

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );

    // Observe tous les .prestige-reveal pas encore révélés. Idempotent : ré-observer
    // un élément déjà suivi est sans effet. On NE bail PAS si le DOM est vide au
    // premier passage : sur une page dont les données sont awaitées/streamées (ex :
    // liste blog), les cartes arrivent APRÈS, et seraient sinon armées-cachées sans
    // jamais être observées, donc invisibles à vie.
    const scan = () => {
      document
        .querySelectorAll<HTMLElement>('.prestige-reveal:not(.is-visible)')
        .forEach((el) => io.observe(el));
    };

    // Scan initial différé d'une frame (hors commit d'hydratation) + re-scans courts
    // pour capter le contenu async, et un MutationObserver pour tout ajout tardif
    // (Suspense, navigation client).
    const raf = window.requestAnimationFrame(scan);
    const t1 = window.setTimeout(scan, 250);
    const t2 = window.setTimeout(scan, 1000);
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      mo.disconnect();
      io.disconnect();
    };
  }, [pathname]);

  return null;
}
