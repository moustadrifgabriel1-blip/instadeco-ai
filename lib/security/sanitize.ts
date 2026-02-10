/**
 * Utilitaire de sanitization HTML
 * Utilise DOMPurify pour une protection robuste contre les attaques XSS
 */
import DOMPurify from 'isomorphic-dompurify';

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
const ALLOWED_ATTR = [
  'href', 'title', 'target', 'rel',
  'src', 'alt', 'width', 'height', 'loading',
  'class',
];

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
 * Sanitize le contenu HTML avec DOMPurify (protection XSS robuste)
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target', 'rel'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur'],
  });
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
  return json
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}
