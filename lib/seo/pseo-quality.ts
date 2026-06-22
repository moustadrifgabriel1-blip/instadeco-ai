/**
 * Barrière qualité des pages programmatiques (pSEO), garde-fou anti index bloat.
 *
 * Principe (règles de l'art Google) : une page programmatique ne doit être
 * indexable QUE si elle apporte une vraie valeur unique. Sinon -> noindex,follow
 * (Google la crawle, suit les liens, mais ne l'indexe pas). Cela évite la
 * dévaluation du domaine entier par du thin content dupliqué.
 *
 * Décision produit (18/06/2026) : tant que la génération de contenu groundé
 * n'a pas enrichi les pages villes, on n'INDEXE que les villes à traction réelle
 * (impressions GSC + position correcte). Toutes les autres sont en noindex et
 * repassent en index AUTOMATIQUEMENT dès qu'elles passent le seuil d'unicité.
 *
 * Pour que le thin content ne revienne JAMAIS : l'indexabilité est calculée ici,
 * de façon centralisée, et tout nouveau gabarit programmatique doit passer par
 * `isCityIndexable` (ou un équivalent) avant d'émettre un robots index.
 */

/**
 * Villes autorisées à l'indexation aujourd'hui : celles qui récoltent déjà des
 * impressions GSC avec une position exploitable (vague 1 d'enrichissement).
 * On élargit cette liste au fil de l'enrichissement, jamais en masse.
 */
export const INDEXABLE_CITY_SLUGS: ReadonlySet<string> = new Set([
  'nice',
  'liege',
  'louvain-la-neuve',
  'neuchatel',
  'amiens',
  'uccle',
  'bruxelles',
  'annecy',
]);

/**
 * Seuil d'unicité minimal (en mots de contenu réellement spécifiques à la page)
 * pour qu'une page programmatique mérite l'indexation. Sert au gating du contenu
 * groundé une fois généré.
 */
export const MIN_UNIQUE_WORDS = 120;

/**
 * Une page ville est-elle indexable ?
 *
 * @param slug   slug de la ville
 * @param uniqueWordCount  nombre de mots de contenu unique groundé déjà présent
 *                         pour cette ville (0 tant que non enrichie)
 */
export function isCityIndexable(slug: string, uniqueWordCount = 0): boolean {
  // Enrichie au-dessus du seuil -> indexable (le cas cible à terme).
  if (uniqueWordCount >= MIN_UNIQUE_WORDS) return true;
  // Sinon, seulement les villes à traction de la vague 1.
  return INDEXABLE_CITY_SLUGS.has(slug);
}

/**
 * Renvoie l'objet `robots` Next.js pour une page programmatique fr.
 * `undefined` = indexable (comportement par défaut), sinon noindex,follow.
 */
export function programmaticRobots(indexable: boolean) {
  return indexable ? undefined : { index: false, follow: true };
}

/** Nombre de mots d'un texte (séparateurs d'espaces, vides ignorés). */
export function countWords(text: string | null | undefined): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Une page pSEO (ex: /amenager) est-elle indexable au vu de son contenu unique ?
 * Même règle que les villes : sous le seuil d'unicité -> noindex,follow, et
 * réindexation automatique dès que le contenu enrichi franchit le seuil.
 */
export function isPseoContentIndexable(uniqueText: string | null | undefined): boolean {
  return countWords(uniqueText) >= MIN_UNIQUE_WORDS;
}
