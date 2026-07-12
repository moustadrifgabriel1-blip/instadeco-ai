import type { ReactNode } from 'react';

/**
 * Layout hors i18n (exclu du middleware next-intl, cf. middleware.ts) : ces pages
 * servent de cible de lien pour l'outbound (avant/après), pas de contenu du site.
 * Elles fournissent leur propre <html>/<body> car le layout racine ne le fait pas.
 */
export default function OutboundLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="m-0 bg-[#0c0a09] font-sans text-[#faf8f4] antialiased">{children}</body>
    </html>
  );
}
