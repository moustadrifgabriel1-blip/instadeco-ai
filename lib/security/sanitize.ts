/**
 * Utilitaire de sanitization HTML
 * 
 * Sanitizer server-safe basé sur une allowlist (sans dépendance jsdom).
 * Le contenu est généré par notre propre système (marked + custom renderer),
 * donc une approche allowlist est suffisante et fiable.
 */

// Liste des balises HTML autorisées dans le contenu du blog
const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'a', 'img', 'figure', 'figcaption',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'div', 'span', 'hr',
]);

// Balises interdites (supprimées avec leur contenu)
const FORBIDDEN_TAGS = new Set([
  'script', 'style', 'iframe', 'object', 'embed', 'form', 'input',
  'textarea', 'select', 'button', 'applet', 'base', 'link', 'meta',
]);

// Attributs autorisés
const ALLOWED_ATTR = new Set([
  'href', 'title', 'target', 'rel',
  'src', 'alt', 'width', 'height', 'loading',
  'class',
]);

// Attributs événementiels interdits (pattern)
const EVENT_ATTR_PATTERN = /^on/i;

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
 * Sanitize un attribut HTML individuel
 */
function sanitizeAttribute(tagName: string, attrName: string, attrValue: string): string | null {
  const lowerAttr = attrName.toLowerCase();

  // Bloquer les attributs événementiels
  if (EVENT_ATTR_PATTERN.test(lowerAttr)) {
    return null;
  }

  // Vérifier l'allowlist
  if (!ALLOWED_ATTR.has(lowerAttr)) {
    return null;
  }

  // Valider les URLs dans href et src
  if (lowerAttr === 'href' || lowerAttr === 'src') {
    const decoded = attrValue.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    if (!isSafeUrl(decoded)) {
      return null;
    }
  }

  return `${lowerAttr}="${attrValue.replace(/"/g, '&quot;')}"`;
}

/**
 * Sanitize le contenu HTML avec une approche allowlist server-safe.
 * 
 * Supprime les balises interdites (avec contenu), ne garde que les balises
 * et attributs autorisés, et valide les URLs.
 */
export function sanitizeHtml(html: string): string {
  // 1. Supprimer les balises interdites avec leur contenu
  let result = html;
  for (const tag of FORBIDDEN_TAGS) {
    const regex = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
    result = result.replace(regex, '');
    // Supprimer aussi les balises auto-fermantes
    const selfClosing = new RegExp(`<${tag}[^>]*/?>`, 'gi');
    result = result.replace(selfClosing, '');
  }

  // 2. Traiter toutes les balises HTML
  result = result.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)?\/?>/g, (match, tagName, attrs) => {
    const lowerTag = tagName.toLowerCase();

    // Balise non autorisée : supprimer la balise mais garder le contenu
    if (!ALLOWED_TAGS.has(lowerTag)) {
      return '';
    }

    // Balise fermante
    if (match.startsWith('</')) {
      return `</${lowerTag}>`;
    }

    // Traiter les attributs
    const sanitizedAttrs: string[] = [];
    if (attrs) {
      // Parser les attributs (gère les guillemets simples, doubles et sans guillemets)
      const attrRegex = /([a-zA-Z_][\w-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
      let attrMatch;
      while ((attrMatch = attrRegex.exec(attrs)) !== null) {
        const attrName = attrMatch[1];
        const attrValue = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '';
        const sanitized = sanitizeAttribute(lowerTag, attrName, attrValue);
        if (sanitized) {
          sanitizedAttrs.push(sanitized);
        }
      }
    }

    // Reconstruire la balise
    const isSelfClosing = match.endsWith('/>') || ['br', 'hr', 'img'].includes(lowerTag);
    const attrStr = sanitizedAttrs.length > 0 ? ' ' + sanitizedAttrs.join(' ') : '';
    return `<${lowerTag}${attrStr}${isSelfClosing ? ' /' : ''}>`;
  });

  return result;
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
