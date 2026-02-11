'use client';

import dynamic from 'next/dynamic';

/**
 * Wrapper client pour le composant LeadCapture avec chargement lazy et ssr: false.
 * Utilisé dans les Server Components qui ne peuvent pas utiliser ssr: false directement.
 */
const LeadCaptureLazy = dynamic(
  () => import('@/components/features/lead-capture').then(mod => ({ default: mod.LeadCapture })),
  { ssr: false }
);

export { LeadCaptureLazy };
