import { Cormorant_Garamond, Josefin_Sans } from 'next/font/google';

/**
 * Fonts éditoriales de la DA prestige, centralisées pour être chargées une
 * seule fois au layout racine et réutilisées partout (next/font dédoublonne).
 * Exposées en variables CSS : --font-display (Cormorant Garamond, titres) et
 * --font-body (Josefin Sans, labels/texte). Utilisées via .prestige-display,
 * .prestige-body, .prestige-eyebrow (cf. app/globals.css).
 */
export const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
  preload: true,
});

export const josefin = Josefin_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-body',
  display: 'swap',
  preload: true,
});
