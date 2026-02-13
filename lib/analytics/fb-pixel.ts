/**
 * Facebook Pixel — Tracking des conversions pour les campagnes FB/Instagram
 * 
 * Événements standard Facebook :
 * - PageView (automatique)
 * - Lead : email capturé
 * - CompleteRegistration : inscription
 * - InitiateCheckout : début d'achat
 * - Purchase : achat complété
 * - ViewContent : vue d'un contenu (page generate, exemples)
 * 
 * Custom events :
 * - UploadPhoto : photo uploadée (engagement)
 * - StartGeneration : début de génération
 * - CompleteGeneration : génération terminée
 * 
 * Configuration : Ajouter NEXT_PUBLIC_FB_PIXEL_ID dans .env
 */

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || '';

function isFbqAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.fbq === 'function' && !!FB_PIXEL_ID;
}

// ============================================
// ÉVÉNEMENTS STANDARD FACEBOOK
// ============================================

/** Page vue — appelé automatiquement via le layout */
export function fbPageView() {
  if (!isFbqAvailable()) return;
  window.fbq('track', 'PageView');
}

/** Lead capturé (email) */
export function fbTrackLead(source: string = 'unknown') {
  if (!isFbqAvailable()) return;
  window.fbq('track', 'Lead', {
    content_name: source,
  });
}

/** Inscription complétée */
export function fbTrackRegistration(method: string = 'email') {
  if (!isFbqAvailable()) return;
  window.fbq('track', 'CompleteRegistration', {
    content_name: method,
    status: true,
  });
}

/** Début d'achat (page pricing ou checkout) */
export function fbTrackInitiateCheckout(packName: string, value: number, currency: string = 'EUR') {
  if (!isFbqAvailable()) return;
  window.fbq('track', 'InitiateCheckout', {
    content_name: packName,
    value,
    currency,
    num_items: 1,
  });
}

/** Achat complété */
export function fbTrackPurchase(packName: string, value: number, currency: string = 'EUR') {
  if (!isFbqAvailable()) return;
  window.fbq('track', 'Purchase', {
    content_name: packName,
    value,
    currency,
    num_items: 1,
  });
}

/** Vue d'un contenu (page generate, exemples, galerie) */
export function fbTrackViewContent(contentName: string, contentCategory: string = 'page') {
  if (!isFbqAvailable()) return;
  window.fbq('track', 'ViewContent', {
    content_name: contentName,
    content_category: contentCategory,
  });
}

// ============================================
// CUSTOM EVENTS
// ============================================

/** Photo uploadée — signal d'engagement fort */
export function fbTrackUploadPhoto() {
  if (!isFbqAvailable()) return;
  window.fbq('trackCustom', 'UploadPhoto');
}

/** Début de génération */
export function fbTrackStartGeneration(style: string, roomType: string) {
  if (!isFbqAvailable()) return;
  window.fbq('trackCustom', 'StartGeneration', {
    style,
    room_type: roomType,
  });
}

/** Génération terminée */
export function fbTrackCompleteGeneration(style: string, roomType: string) {
  if (!isFbqAvailable()) return;
  window.fbq('trackCustom', 'CompleteGeneration', {
    style,
    room_type: roomType,
  });
}

// ============================================
// SCRIPT D'INITIALISATION
// ============================================

/**
 * Retourne le snippet HTML d'initialisation du Facebook Pixel.
 * À injecter dans le <head> via le layout principal.
 */
export function getFBPixelScript(): string {
  if (!FB_PIXEL_ID) return '';
  
  return `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${FB_PIXEL_ID}');
    fbq('track', 'PageView');
  `;
}

// ============================================
// TYPE DECLARATIONS
// ============================================

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}
