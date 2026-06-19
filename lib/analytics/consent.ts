'use client';

import { useEffect, useState } from 'react';

/**
 * Consentement cookies / tracking (RGPD, opt-in préalable).
 *
 * Aucun script tiers (Google Analytics, Meta Pixel) ni event de tracking ne
 * doit partir tant que l'utilisateur n'a pas explicitement accepté. Ce module
 * stocke le choix dans localStorage et notifie les composants via un event
 * custom, pour qu'ils montent/démontent les scripts en réaction.
 */

export type ConsentValue = 'granted' | 'denied';

export const CONSENT_KEY = 'cookie-consent';
export const CONSENT_EVENT = 'cookie-consent-change';

export function getConsent(): ConsentValue | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(value: ConsentValue): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* localStorage indisponible : on notifie quand même la session courante */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
}

/**
 * Hook réactif : renvoie le consentement courant et se met à jour quand
 * l'utilisateur choisit (même onglet via l'event custom, autres onglets via
 * l'event storage). `null` = pas encore choisi.
 */
export function useCookieConsent(): ConsentValue | null {
  const [consent, setConsentState] = useState<ConsentValue | null>(null);

  useEffect(() => {
    setConsentState(getConsent());
    const refresh = () => setConsentState(getConsent());
    window.addEventListener(CONSENT_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(CONSENT_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  return consent;
}
