/**
 * Utilitaire de sanitization HTML
 * Protège contre les attaques XSS lors du rendu de contenu dynamique
 */

// Liste des balises HTML autorisées dans le contenu du blog
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'a', 'img', 'figure', 'figcaption',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'div', 'span', 'hr',
];

// Attributs autorisés par balise
const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ['href', 'title', 'target', 'rel'],
  img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
  div: ['class'],
  span: ['class'],
  p: ['class'],
  blockquote: ['class'],
  pre: ['class'],
  code: ['class'],
  figure: ['class'],
  table: ['class'],
};

// Protocoles autorisés pour les URLs
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:'];

/**
 * Vérifie si une URL est sûre
 */
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url, 'https://instadeco.app');
    return ALLOWED_PROTOCOLS.includes(parsed.protocol);
  } catch {
    // URL relative - généralement sûre
    return !url.startsWith('javascript:') && !url.startsWith('data:');
  }
}

/**
 * Échappe les caractères HTML dangereux
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Sanitize le contenu HTML pour le rendre sûr
 * Version simplifiée - pour une protection complète, utiliser DOMPurify
 */
export function sanitizeHtml(html: string): string {
  // Supprimer les scripts
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Supprimer les event handlers (onclick, onerror, etc.)
  clean = clean.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  clean = clean.replace(/\s*on\w+\s*=\s*[^\s>]+/gi, '');
  
  // Supprimer les URLs javascript:
  clean = clean.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
  clean = clean.replace(/src\s*=\s*["']javascript:[^"']*["']/gi, '');
  
  // Supprimer les URLs data: (sauf pour les images)
  clean = clean.replace(/(?<!img[^>]*)src\s*=\s*["']data:[^"']*["']/gi, '');
  
  // Supprimer les iframes non autorisées
  clean = clean.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '');
  
  // Supprimer les objects/embeds
  clean = clean.replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, '');
  clean = clean.replace(/<embed\b[^>]*>/gi, '');
  
  // Supprimer les styles inline dangereux (expression, behavior, etc.)
  clean = clean.replace(/style\s*=\s*["'][^"']*(?:expression|behavior|javascript)[^"']*["']/gi, '');
  
  return clean;
}

/**
 * Valide et nettoie une URL
 */
export function sanitizeUrl(url: string): string {
  if (!isSafeUrl(url)) {
    return '#';
  }
  return url;
}

/**
 * Nettoie le JSON pour éviter l'injection dans les scripts JSON-LD
 */
export function sanitizeJsonLd(obj: unknown): string {
  const json = JSON.stringify(obj);
  // Échapper les caractères qui pourraient casser le script tag
  return json
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}
