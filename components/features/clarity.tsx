'use client';

import Script from 'next/script';
import { useCookieConsent } from '@/lib/analytics/consent';

const CLARITY_ID = (process.env.NEXT_PUBLIC_CLARITY_ID || '').trim();

/**
 * Microsoft Clarity, analyse comportementale (heatmaps de clics/scroll,
 * enregistrements de session, détection de rage-clicks et dead-clicks).
 *
 * Gratuit et illimité. Sert à comprendre OÙ les visiteurs cliquent, hésitent
 * et abandonnent dans le funnel (là où les events GA/Pixel ne disent que
 * l'étape franchie, pas le comportement intra-page).
 *
 * RGPD : aucun script tant que le consentement n'est pas accordé (même règle
 * que MetaPixel / GoogleAnalytics). Inerte si NEXT_PUBLIC_CLARITY_ID absent.
 */
export function Clarity() {
  const consent = useCookieConsent();
  if (!CLARITY_ID || consent !== 'granted') return null;

  return (
    <Script
      id="ms-clarity"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${CLARITY_ID}");
        `,
      }}
    />
  );
}
