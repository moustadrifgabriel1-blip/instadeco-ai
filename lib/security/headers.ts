/**
 * Security Headers - Protection contre les attaques web courantes
 * 
 * À utiliser dans middleware.ts ou next.config.js
 */

export const securityHeaders = [
  // Protection XSS - bloque l'exécution de scripts inline malveillants
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  // Empêche le sniffing MIME type
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Protection Clickjacking - empêche l'embedding dans des iframes malveillantes
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  // Referrer Policy - limite les informations envoyées lors de navigation
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // Permissions Policy - désactive les fonctionnalités non utilisées
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  // HSTS - Force HTTPS (attention: ne pas activer en dev)
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
];

/**
 * Content Security Policy
 * Protège contre XSS, injection de code, etc.
 */
export function generateCSP(): string {
  const policy = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Nécessaire pour Next.js
      "'unsafe-eval'", // Nécessaire pour le dev mode
      'https://js.stripe.com',
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Nécessaire pour Tailwind/styled-components
      'https://fonts.googleapis.com',
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
      'https://*.supabase.co',
      'https://images.unsplash.com',
      'https://*.fal.media',
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
    ],
    'connect-src': [
      "'self'",
      'https://*.supabase.co',
      'wss://*.supabase.co',
      'https://api.stripe.com',
      'https://*.fal.ai',
      'https://*.fal.media',
      'https://generativelanguage.googleapis.com',
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com',
      'https://analytics.google.com',
    ],
    'frame-src': [
      "'self'",
      'https://js.stripe.com',
      'https://hooks.stripe.com',
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'self'"],
    'upgrade-insecure-requests': [],
  };

  return Object.entries(policy)
    .map(([key, values]) => {
      if (values.length === 0) return key;
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
}

/**
 * Headers de sécurité pour les réponses API
 */
export const apiSecurityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

/**
 * Sanitize les données pour éviter l'injection
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Supprime les balises HTML
    .replace(/javascript:/gi, '') // Supprime les URLs javascript:
    .replace(/on\w+\s*=/gi, '') // Supprime les event handlers
    .trim();
}

/**
 * Valide qu'une URL est sûre (pas de javascript:, data:, etc.)
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Génère un token CSRF
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
