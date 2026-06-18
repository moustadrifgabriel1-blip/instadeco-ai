/**
 * Linter anti-détection IA (déterministe, sans hasard).
 *
 * But : garantir qu'aucun contenu publié ne porte les marqueurs typiques d'un
 * texte généré par IA. C'est la barrière qualité PERMANENTE du blog : tout
 * contenu qui échoue ici ne doit pas être publié.
 *
 * Deux niveaux :
 * - `hard` : interdit absolu (tiret cadratin/demi, emoji, texte bouchon). Une
 *   seule occurrence fait échouer (`passed = false`), peu importe le score.
 * - `soft` : tournures et tics d'IA. Elles font baisser le score ; sous le
 *   seuil `PASS_THRESHOLD`, le contenu échoue aussi.
 *
 * Règles métier (cf. CLAUDE.md) : zéro tiret de séparation, zéro emoji, ton
 * humain et direct, phrases de longueurs variées, zéro remplissage générique.
 */

export type AiViolationSeverity = 'hard' | 'soft';

export interface AiViolation {
  rule: string;
  severity: AiViolationSeverity;
  excerpt: string;
}

export interface AntiAiResult {
  /** 0 à 100, plus haut = plus humain. */
  score: number;
  /** true si aucune violation `hard` et score >= seuil. */
  passed: boolean;
  violations: AiViolation[];
}

/** Seuil de score (sur 100) en-dessous duquel le contenu échoue. */
export const PASS_THRESHOLD = 70;

/** Tirets cadratin (—) et demi-cadratin (–), bannis comme ponctuation. */
const DASH_RE = /[—–]/;

/**
 * Emojis (plages Unicode usuelles). Volontairement large mais sans toucher au
 * texte latin accentué.
 */
const EMOJI_RE =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}]/u;

/** Textes bouchons / placeholders qui ne doivent jamais être publiés. */
const PLACEHOLDER_RES: RegExp[] = [
  /\barticle sur\b/i,
  /lorem ipsum/i,
  /\bTODO\b/,
  /\bFIXME\b/,
  /à compléter/i,
  /\[\s*placeholder\s*\]/i,
];

/**
 * Ouvertures de phrase typiques de l'IA (en début de phrase / ligne).
 * Détectées en début de chaîne ou après un point.
 */
const AI_OPENERS: string[] = [
  'en effet',
  'il est important de noter',
  'il convient de noter',
  'il convient de souligner',
  'force est de constater',
  'plongez dans',
  'plongeons dans',
  'dans le monde de',
  "à l'ère de",
  "à l'ère du",
  "à l'heure actuelle",
  'que vous soyez',
  "n'hésitez pas à",
  'en conclusion',
  'pour conclure',
  'en somme',
  'penchons-nous sur',
  'commençons par',
  'passons maintenant à',
  'comme vous pouvez le constater',
];

/** Tics de remplissage / expressions creuses typiques de l'IA. */
const AI_FILLERS: string[] = [
  'joue un rôle crucial',
  'joue un rôle essentiel',
  'joue un rôle important',
  'un véritable jeu',
  'un véritable havre',
  'véritable cocon',
  'incontournable',
  'au cœur de',
  'la clé réside',
  'il convient de',
  'force est de constater',
  'un atout majeur',
  'un atout indéniable',
  'sans plus attendre',
  'il existe de nombreuses options',
  'dans cet article, nous',
  'embarquez pour',
];

function makeOpenerRe(phrase: string): RegExp {
  // Début de texte ou après ponctuation forte + espace, insensible à la casse.
  // Frontière de fin via lookahead Unicode (\b ASCII échoue après un accent, ex "à").
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[.!?]\\s+|\\n\\s*)${escaped}(?!\\p{L})`, 'iu');
}

/** Extrait court autour d'un match, pour le rapport. */
function excerptAround(text: string, index: number, len = 40): string {
  const start = Math.max(0, index - 10);
  return text.slice(start, start + len).replace(/\s+/g, ' ').trim();
}

/** Découpe naïve en phrases (suffisant pour les heuristiques). */
function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Analyse un texte et renvoie le verdict anti-IA.
 * Déterministe : même entrée -> même sortie.
 */
export function lintAntiAi(text: string): AntiAiResult {
  const violations: AiViolation[] = [];
  const input = text ?? '';

  // --- HARD ---
  const dash = input.match(DASH_RE);
  if (dash && dash.index !== undefined) {
    violations.push({ rule: 'em_dash', severity: 'hard', excerpt: excerptAround(input, dash.index) });
  }

  const emoji = input.match(EMOJI_RE);
  if (emoji && emoji.index !== undefined) {
    violations.push({ rule: 'emoji', severity: 'hard', excerpt: excerptAround(input, emoji.index) });
  }

  for (const re of PLACEHOLDER_RES) {
    const m = input.match(re);
    if (m && m.index !== undefined) {
      violations.push({ rule: 'placeholder', severity: 'hard', excerpt: excerptAround(input, m.index) });
      break;
    }
  }

  // --- SOFT : ouvertures IA ---
  for (const opener of AI_OPENERS) {
    const m = input.match(makeOpenerRe(opener));
    if (m && m.index !== undefined) {
      violations.push({ rule: `ai_opener:${opener}`, severity: 'soft', excerpt: excerptAround(input, m.index) });
    }
  }

  // --- SOFT : remplissage IA ---
  for (const filler of AI_FILLERS) {
    const idx = input.toLowerCase().indexOf(filler);
    if (idx !== -1) {
      violations.push({ rule: `ai_filler:${filler}`, severity: 'soft', excerpt: excerptAround(input, idx) });
    }
  }

  // --- SOFT : débuts de phrase répétés ---
  // Seuil proportionnel à la longueur : 3 sur un texte court, plus sur un long
  // article (une répétition modérée est normale et humaine, pas un marqueur IA).
  const sentences = splitSentences(input);
  if (sentences.length >= 4) {
    const threshold = Math.max(3, Math.ceil(sentences.length * 0.06));
    const starts = new Map<string, number>();
    for (const s of sentences) {
      const key = s.split(/\s+/).slice(0, 2).join(' ').toLowerCase();
      if (key) starts.set(key, (starts.get(key) ?? 0) + 1);
    }
    for (const [key, count] of starts) {
      if (count >= threshold) {
        violations.push({ rule: 'repeated_start', severity: 'soft', excerpt: `"${key}" x${count}` });
      }
    }
  }

  // --- SOFT : phrases trop uniformes (pas de variété de longueur) ---
  if (sentences.length >= 6) {
    const lengths = sentences.map((s) => s.split(/\s+/).length);
    const hasShort = lengths.some((l) => l <= 6);
    const hasLong = lengths.some((l) => l >= 22);
    if (!hasShort || !hasLong) {
      violations.push({ rule: 'uniform_length', severity: 'soft', excerpt: 'longueurs de phrases peu variées' });
    }
  }

  // --- Score ---
  const hardCount = violations.filter((v) => v.severity === 'hard').length;
  const softCount = violations.filter((v) => v.severity === 'soft').length;
  let score = 100 - softCount * 8 - hardCount * 40;
  score = Math.max(0, Math.min(100, score));

  const passed = hardCount === 0 && score >= PASS_THRESHOLD;

  return { score, passed, violations };
}

/**
 * Assainit un texte des violations `hard` réparables sans perte de sens :
 * remplace les tirets cadratin/demi par une virgule, retire les emojis.
 * Ne touche pas aux placeholders (ils doivent bloquer, pas être masqués).
 * Déterministe.
 */
export function sanitizeAntiAi(text: string): string {
  if (!text) return text;
  return text
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(new RegExp(EMOJI_RE.source, 'gu'), '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ +([.,;:!?])/g, '$1')
    .trim();
}
