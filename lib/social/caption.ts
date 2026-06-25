/**
 * Légende partagée des publications sociales (image avant/après ET Reel vidéo).
 * Extraite de app/api/cron/social-publish/route.ts pour être réutilisée par le
 * script vidéo VPS (scripts/social-video-publish.ts) sans duplication.
 *
 * Règle copy du projet : zéro tiret de séparation, zéro emoji décoratif.
 */

export const STYLE_LABELS: Record<string, string> = {
  moderne: 'moderne', minimaliste: 'minimaliste', boheme: 'bohème',
  industriel: 'industriel', classique: 'classique', japandi: 'japandi',
  midcentury: 'mid-century', coastal: 'coastal', scandinave: 'scandinave',
  artdeco: 'art déco', luxe: 'luxe', haussmannien: 'haussmannien', contemporain: 'contemporain',
};

export const ROOM_LABELS: Record<string, string> = {
  salon: 'salon', chambre: 'chambre', cuisine: 'cuisine',
  'salle-de-bain': 'salle de bain', bureau: 'bureau',
  'salle-a-manger': 'salle à manger', entree: 'entrée', terrasse: 'terrasse',
};

export const HASHTAGS = [
  '#homestaging', '#homestagingvirtuel', '#immobilier', '#decoration',
  '#decorationinterieur', '#avantapres', '#agentimmobilier', '#instadeco',
];

export type CaptionInput = {
  style_slug: string | null;
  room_type_slug: string | null;
};

/**
 * Titre court pour un pin Pinterest (limite 100 caracteres). Zero emoji, zero tiret.
 */
export function buildPinterestTitle(gen: CaptionInput): string {
  const style = (gen.style_slug && STYLE_LABELS[gen.style_slug]) || gen.style_slug || '';
  const room = (gen.room_type_slug && ROOM_LABELS[gen.room_type_slug]) || gen.room_type_slug || 'pièce';
  const styleBit = style ? ` en style ${style}` : '';
  const title = `Home staging virtuel pour ${room}${styleBit}`;
  return title.length > 100 ? title.slice(0, 99).trimEnd() : title;
}

export function buildCaption(gen: CaptionInput): string {
  const style = (gen.style_slug && STYLE_LABELS[gen.style_slug]) || gen.style_slug || '';
  const room = (gen.room_type_slug && ROOM_LABELS[gen.room_type_slug]) || gen.room_type_slug || 'pièce';
  const styleBit = style ? ` en style ${style}` : '';
  return [
    `Home staging virtuel${styleBit} pour ${room}.`,
    '',
    'Une photo, un style, un rendu prêt pour votre annonce en 30 secondes. Le home staging virtuel par IA, pensé pour les agents immobiliers.',
    '',
    'Essai gratuit sur instadeco.app',
    '',
    HASHTAGS.join(' '),
  ].join('\n');
}
