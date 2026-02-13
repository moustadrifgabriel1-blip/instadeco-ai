/**
 * UTM Tracking & Attribution
 * 
 * Capture les paramètres UTM des campagnes pub (Facebook, Google, etc.)
 * et les stocke pour l'attribution des conversions.
 * 
 * Paramètres trackés :
 * - utm_source : facebook, google, instagram, tiktok
 * - utm_medium : cpc, social, email
 * - utm_campaign : nom de la campagne
 * - utm_content : variante de la pub
 * - utm_term : mot-clé (Google Ads)
 * - fbclid : Facebook Click ID
 * - gclid : Google Click ID
 */

const UTM_STORAGE_KEY = 'instadeco_utm';
const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'] as const;

export interface UTMData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  fbclid?: string;
  gclid?: string;
  landing_page?: string;
  referrer?: string;
  timestamp?: string;
}

/**
 * Capture les paramètres UTM de l'URL courante et les stocke en sessionStorage.
 * À appeler au chargement de chaque page (via le layout).
 */
export function captureUTMParams(): UTMData | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const utmData: UTMData = {};
  let hasUTM = false;

  for (const param of UTM_PARAMS) {
    const value = params.get(param);
    if (value) {
      utmData[param] = value;
      hasUTM = true;
    }
  }

  if (hasUTM) {
    utmData.landing_page = window.location.pathname;
    utmData.referrer = document.referrer || '';
    utmData.timestamp = new Date().toISOString();

    // Stocker en sessionStorage (durée de la session)
    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utmData));

    // Aussi en localStorage pour attribution cross-session (30 jours)
    const stored = localStorage.getItem(UTM_STORAGE_KEY);
    const existing: UTMData[] = stored ? JSON.parse(stored) : [];
    existing.push(utmData);
    // Garder les 10 dernières attributions max
    const trimmed = existing.slice(-10);
    localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(trimmed));

    return utmData;
  }

  return null;
}

/**
 * Récupère les données UTM de la session courante.
 */
export function getSessionUTM(): UTMData | null {
  if (typeof window === 'undefined') return null;
  
  const stored = sessionStorage.getItem(UTM_STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

/**
 * Récupère la première attribution UTM (first-touch).
 */
export function getFirstTouchUTM(): UTMData | null {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem(UTM_STORAGE_KEY);
  if (!stored) return null;
  
  const attributions: UTMData[] = JSON.parse(stored);
  return attributions[0] || null;
}

/**
 * Récupère la dernière attribution UTM (last-touch).
 */
export function getLastTouchUTM(): UTMData | null {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem(UTM_STORAGE_KEY);
  if (!stored) return null;
  
  const attributions: UTMData[] = JSON.parse(stored);
  return attributions[attributions.length - 1] || null;
}

/**
 * Vérifie si le visiteur vient d'une campagne pub.
 */
export function isFromAd(): boolean {
  const utm = getSessionUTM();
  if (!utm) return false;
  return !!(utm.fbclid || utm.gclid || utm.utm_medium === 'cpc' || utm.utm_medium === 'paid');
}

/**
 * Retourne la source de trafic lisible.
 */
export function getTrafficSource(): string {
  const utm = getSessionUTM();
  if (!utm) return 'direct';
  
  if (utm.fbclid || utm.utm_source === 'facebook') return 'facebook';
  if (utm.gclid || utm.utm_source === 'google') return 'google';
  if (utm.utm_source === 'instagram') return 'instagram';
  if (utm.utm_source === 'tiktok') return 'tiktok';
  
  return utm.utm_source || 'direct';
}
