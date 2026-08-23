/**
 * Préférences de mouvement, sans aucune dépendance.
 *
 * Volontairement séparé de `lib/prestige-scroll` : ces deux helpers sont
 * importés par tous les composants prestige, et tant qu'ils vivaient dans le
 * même module que Lenis, le simple fait de lire `prefersReducedMotion` tirait
 * Lenis (et GSAP) dans le bundle de chaque page concernée. Ici, seuls les
 * composants qui utilisent vraiment `usePrestigeSmoothScroll` embarquent Lenis.
 */

/**
 * Détecte prefers-reduced-motion (et l'absence de matchMedia côté SSR).
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Détecte un appareil dont le pointeur principal est tactile (téléphones,
 * tablettes). Sur ces appareils on garde le scroll NATIF : le momentum du
 * doigt est déjà fluide, et le smoothing Lenis (pensé pour la molette) le
 * combat, ce qui donne un scroll caoutchouteux et imprécis.
 */
export function isTouchPrimary(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
}
