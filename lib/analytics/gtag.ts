/**
 * Google Analytics 4 — Tracking & Conversion Events
 * 
 * Événements trackés :
 * - page_view (automatique)
 * - trial_start : début d'essai gratuit
 * - trial_complete : essai terminé avec succès
 * - signup : inscription
 * - login : connexion
 * - generate_start : début de génération (utilisateur connecté)
 * - generate_complete : génération réussie
 * - purchase : achat de crédits
 * - lead_captured : email capturé
 * - referral_shared : partage de lien de parrainage
 */

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

// Vérifier si GA est disponible
function isGtagAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function' && !!GA_MEASUREMENT_ID;
}

// Pageview
export function trackPageView(url: string) {
  if (!isGtagAvailable()) return;
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  });
}

// Événement générique
export function trackEvent(
  action: string,
  params?: Record<string, string | number | boolean>
) {
  if (!isGtagAvailable()) return;
  window.gtag('event', action, params);
}

// ============================================
// ÉVÉNEMENTS DE CONVERSION SPÉCIFIQUES
// ============================================

/** Début d'essai gratuit (page /essai) */
export function trackTrialStart(style: string, roomType: string) {
  trackEvent('trial_start', {
    style,
    room_type: roomType,
    event_category: 'conversion',
  });
}

/** Essai gratuit terminé avec succès */
export function trackTrialComplete(style: string, roomType: string) {
  trackEvent('trial_complete', {
    style,
    room_type: roomType,
    event_category: 'conversion',
  });
}

/** Inscription */
export function trackSignup(method: string = 'email') {
  trackEvent('sign_up', {
    method,
    event_category: 'conversion',
  });
}

/** Connexion */
export function trackLogin(method: string = 'email') {
  trackEvent('login', {
    method,
    event_category: 'engagement',
  });
}

/** Début de génération (utilisateur connecté) */
export function trackGenerateStart(style: string, roomType: string) {
  trackEvent('generate_start', {
    style,
    room_type: roomType,
    event_category: 'engagement',
  });
}

/** Génération réussie */
export function trackGenerateComplete(style: string, roomType: string) {
  trackEvent('generate_complete', {
    style,
    room_type: roomType,
    event_category: 'conversion',
  });
}

/** Achat de crédits */
export function trackPurchase(packId: string, value: number, currency: string = 'EUR') {
  trackEvent('purchase', {
    transaction_id: `${packId}_${Date.now()}`,
    value,
    currency,
    event_category: 'revenue',
  });
}

/** Email capturé (lead) */
export function trackLeadCaptured(source: string) {
  trackEvent('lead_captured', {
    source,
    event_category: 'conversion',
  });
}

/** Partage de lien de parrainage */
export function trackReferralShared() {
  trackEvent('referral_shared', {
    event_category: 'engagement',
  });
}

/** Click sur un CTA */
export function trackCTAClick(ctaName: string, destination: string) {
  trackEvent('cta_click', {
    cta_name: ctaName,
    destination,
    event_category: 'engagement',
  });
}

// ============================================
// TYPE DECLARATIONS
// ============================================

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}
