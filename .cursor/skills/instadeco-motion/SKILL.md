---
name: instadeco-motion
description: >-
  Implémente animations UI avec Framer Motion sur InstaDeco (Next.js 15 App Router,
  React 18, Tailwind). Couvre composants client, import dynamique, performance,
  accessibilité (prefers-reduced-motion), et cohérence avec le design existant.
  Utiliser lorsque l’utilisateur parle d’animations, motion, Framer Motion,
  transitions de page, stagger, ou micro-interactions sur instadeco.app.
---

# Motion — InstaDeco AI

## Stack

- **Lib**: `framer-motion` (v12+) — déjà listée dans `package.json` du dépôt ; pas besoin de réinstaller sauf si absente du `node_modules`.
- **Règle Next.js**: `motion` / `animatePresence` uniquement dans des composants **`'use client'`** ou fichiers importés par eux.

## Règles rapides

1. **Client boundary**: ne pas importer `framer-motion` dans un Server Component. Soit le fichier a `'use client'`, soit extraire un sous-composant client (ex. `HeroMotion.tsx`).
2. **Bundle**: pour sections lourdes, préférer `next/dynamic` avec `ssr: false` si l’animation n’est pas critique au premier rendu (comme pour les autres blocs homepage).
3. **Accessibilité**: toujours utiliser `useReducedMotion()` de `framer-motion` ; si `true`, durées à `0`, pas de translation importante, pas de stagger.
4. **Style**: rester aligné sur les tokens existants (couleurs `#2D2D2D`, `#C95D3A`, `rounded-xl`, `shadow-warm`, etc.) — l’animation ne remplace pas le design system.
5. **Perf**: éviter les animations sur `filter` / `box-shadow` massifs ; préférer `opacity`, `transform`, `will-change` avec parcimonie.

## Pattern recommandé (fade + léger slide)

```tsx
'use client';

import { motion, useReducedMotion } from 'framer-motion';

export function ExampleBlock() {
  const reduceMotion = useReducedMotion();
  const y = reduceMotion ? 0 : 20;
  return (
    <motion.div
      initial={{ opacity: reduceMotion ? 1 : 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 0.55, ease: [0.22, 1, 0.36, 1] }
      }
    >
      {children}
    </motion.div>
  );
}
```

## Références projet

- Exemple d’usage: `components/features/landing/Hero.tsx` (entrée hero colonnes texte / visuel).
- Homepage: `app/page.tsx` (compose des sections dynamiques — même logique qu’ajouter d’autres blocs animés en client).

## Anti-patterns

- Animer toute la page en boucle ou des propriétés coûteuses sur scroll sans `whileInView` / throttle.
- Oublier `useReducedMotion` sur les mouvements verticaux ou stagger.
- Dupliquer des durées arbitraires partout — centraliser des constantes si plusieurs sections partagent la même courbe.
