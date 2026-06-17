'use client';

import { useEffect } from 'react';
import { usePathname } from '@/i18n/navigation';

/**
 * Observateur global de révélation au scroll. Monté une fois dans le layout
 * (marketing). Pour chaque élément portant la classe .prestige-reveal :
 *  1. lui ajoute .prestige-reveal--armed (état caché) SEULEMENT côté client,
 *     donc sans JS ou avant hydratation, rien n'est masqué (SEO/LCP saufs) ;
 *  2. ajoute .is-visible quand il entre dans le viewport (puis cesse de
 *     l'observer).
 * Respecte prefers-reduced-motion (aucun masquage). Se relance à chaque
 * navigation client (dépendance pathname) pour couvrir les nouvelles pages.
 */
export function PrestigeRevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const els = Array.from(
      document.querySelectorAll<HTMLElement>('.prestige-reveal:not(.is-visible)'),
    );
    if (els.length === 0) return;

    els.forEach((el) => el.classList.add('prestige-reveal--armed'));

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

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  return null;
}
