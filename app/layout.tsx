import './globals.css';
import type { ReactNode } from 'react';

/**
 * Layout racine minimal : la structure <html> / <body> et les providers
 * sont dans `app/[locale]/layout.tsx` (requis par next-intl).
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
