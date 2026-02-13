'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { captureUTMParams } from '@/lib/analytics/utm';
import { fbPageView, fbTrackViewContent, FB_PIXEL_ID } from '@/lib/analytics/fb-pixel';
import { trackEvent } from '@/lib/analytics/gtag';

/**
 * Composant interne qui utilise useSearchParams (nécessite Suspense).
 */
function AdTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Capturer les UTM au chargement
  useEffect(() => {
    const utmData = captureUTMParams();
    if (utmData) {
      // Envoyer aussi à GA comme événement
      trackEvent('utm_captured', {
        utm_source: utmData.utm_source || '',
        utm_medium: utmData.utm_medium || '',
        utm_campaign: utmData.utm_campaign || '',
        landing_page: utmData.landing_page || '',
      });
    }
  }, [searchParams]);

  // Track les page views Facebook Pixel
  useEffect(() => {
    if (FB_PIXEL_ID) {
      fbPageView();
    }
  }, [pathname]);

  // Track les pages clés comme ViewContent sur FB Pixel
  useEffect(() => {
    const keyPages: Record<string, string> = {
      '/generate': 'generate_tool',
      '/essai': 'free_trial',
      '/pricing': 'pricing_page',
      '/exemples': 'examples_gallery',
      '/galerie': 'gallery',
      '/signup': 'signup_page',
    };

    const pageKey = keyPages[pathname];
    if (pageKey) {
      fbTrackViewContent(pageKey, 'key_page');
    }
  }, [pathname]);

  return null;
}

/**
 * Wrapper Suspense pour AdTracker (useSearchParams nécessite Suspense dans Next.js).
 */
export function AdTracker() {
  return (
    <Suspense fallback={null}>
      <AdTrackerInner />
    </Suspense>
  );
}
