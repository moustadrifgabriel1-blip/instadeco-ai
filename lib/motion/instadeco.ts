/**
 * Presets Framer Motion pour InstaDeco — réutilisables et compatibles prefers-reduced-motion.
 */

import type { Variants } from 'framer-motion';

/** Courbe type ease-out doux (proche du CSS ease-out fort) */
export const EASE_OUT_SOFT = [0.22, 1, 0.36, 1] as const;

export function fadeUpBlock(
  reduceMotion: boolean | null,
  options?: { delay?: number; duration?: number }
) {
  const delay = options?.delay ?? 0;
  const duration = options?.duration ?? 0.55;
  const y = reduceMotion ? 0 : 24;
  return {
    initial: { opacity: reduceMotion ? 1 : 0, y },
    animate: { opacity: 1, y: 0 },
    transition: reduceMotion
      ? { duration: 0 }
      : { duration, delay, ease: EASE_OUT_SOFT },
  };
}

/** Colonne avec enfants en cascade (badge → titre → texte → CTA → preuve sociale) */
export function heroStaggerVariants(reduceMotion: boolean | null): {
  container: Variants;
  item: Variants;
} {
  const instant = !!reduceMotion;
  return {
    container: {
      hidden: {},
      visible: {
        transition: {
          staggerChildren: instant ? 0 : 0.07,
          delayChildren: instant ? 0 : 0.03,
        },
      },
    },
    item: {
      hidden: { opacity: instant ? 1 : 0, y: instant ? 0 : 18 },
      visible: {
        opacity: 1,
        y: 0,
        transition: instant
          ? { duration: 0 }
          : { duration: 0.42, ease: EASE_OUT_SOFT },
      },
    },
  };
}
