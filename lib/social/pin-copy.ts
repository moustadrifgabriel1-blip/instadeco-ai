/**
 * Libellés et textes des épingles Pinterest.
 *
 * Source unique partagée par le kit de publication manuelle
 * (`scripts/build-pinterest-kit.ts`) et le flux RSS d'auto-publication
 * (`app/api/pinterest-feed/route.ts`), pour que les deux racontent
 * exactement la même chose.
 *
 * Règles de copy du projet appliquées ici : pas d'emoji, pas de tiret de
 * ponctuation, pas de statistique invérifiable, accords en genre corrects.
 */

export const SITE = 'https://instadeco.app';

/** Slug technique de la base vers libellé lisible. */
export const STYLE_LABELS: Record<string, string> = {
  moderne: 'moderne',
  minimaliste: 'minimaliste',
  japandi: 'japandi',
  boheme: 'bohème',
  coastal: 'bord de mer',
  artdeco: 'art déco',
  classique: 'classique',
  midcentury: 'mid-century',
};

/**
 * Slug de la base vers slug de la page publique : les deux divergent sur
 * quelques styles, et « classique » n'a pas de page dédiée.
 */
const PAGE_STYLE: Record<string, string> = {
  artdeco: 'art-deco',
  midcentury: 'mid-century',
};

const STYLES_SANS_PAGE = new Set(['classique']);

/** Nom lisible et genre, pour accorder articles et participes. */
export const ROOM_LABELS: Record<string, { nom: string; feminin: boolean }> = {
  salon: { nom: 'salon', feminin: false },
  chambre: { nom: 'chambre', feminin: true },
  bureau: { nom: 'bureau', feminin: false },
  cuisine: { nom: 'cuisine', feminin: true },
  'salle-a-manger': { nom: 'salle à manger', feminin: true },
  'salle-de-bain': { nom: 'salle de bain', feminin: true },
};

/**
 * Destination de l'épingle. Toujours une URL du domaine revendiqué : c'est
 * une exigence de l'auto-publication Pinterest, et une épingle qui pointe
 * vers une 404 gâche le clic.
 */
export function pinLink(styleSlug: string): string {
  return STYLES_SANS_PAGE.has(styleSlug)
    ? `${SITE}/fr/essai`
    : `${SITE}/fr/style/${PAGE_STYLE[styleSlug] ?? styleSlug}`;
}

export interface PinCopy {
  title: string;
  description: string;
  link: string;
}

/**
 * Titre et description d'une épingle.
 *
 * `avecAvant` distingue les deux cas : un visuel composé avant/après, ou un
 * rendu seul quand la photo d'origine n'est plus disponible. On ne prétend
 * jamais montrer un avant/après quand il n'y en a pas.
 */
export function buildPinCopy(styleSlug: string, roomSlug: string, avecAvant: boolean): PinCopy {
  const style = STYLE_LABELS[styleSlug] ?? styleSlug;
  const piece = ROOM_LABELS[roomSlug] ?? { nom: roomSlug, feminin: false };
  const r = piece.nom;
  const un = piece.feminin ? 'une' : 'un';
  const Un = piece.feminin ? 'Une' : 'Un';
  const leMeme = piece.feminin ? 'la même' : 'le même';
  const compose = piece.feminin ? 'composée' : 'composé';
  const capitalise = r.charAt(0).toUpperCase() + r.slice(1);

  const titres = [
    `${capitalise} ${style} : avant et après`,
    `Transformer ${un} ${r} en style ${style}`,
    `${Un} ${r} vide devient ${un} ${r} ${style}`,
  ];

  const title = avecAvant
    ? titres[(styleSlug.length + roomSlug.length) % titres.length]
    : `${capitalise} en style ${style}`;

  const description = avecAvant
    ? `Voici ${leMeme} ${r}, avant et après. Le rendu ${style} a été généré à partir ` +
      `d'une simple photo, sans rien déplacer ni acheter. Utile pour se projeter ` +
      `avant de choisir des meubles, une palette ou une ambiance. ` +
      `Essai gratuit sur instadeco.app, sans créer de compte.`
    : `${Un} ${r} en style ${style}, ${compose} à partir de la photo d'une pièce vide. ` +
      `De quoi tester une ambiance avant d'acheter le moindre meuble. ` +
      `Essai gratuit sur instadeco.app, sans créer de compte.`;

  return { title, description, link: pinLink(styleSlug) };
}
