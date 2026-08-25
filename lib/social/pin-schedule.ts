/**
 * Cadencement des épingles exposées dans le flux Pinterest.
 *
 * Pinterest lit le flux et publie « les plus anciennes d'abord », jusqu'à 200
 * par jour. Le flux decide donc de ce qui est publiable, et quand. Trois
 * regles de leurs recommandations dictent la conception :
 *
 *  1. Un compte neuf reste dans la zone sure de 1 a 5 epingles fraiches par
 *     jour. Au-dela, et surtout en rafale, la detection de spam se declenche.
 *  2. Deux epingles vers la MEME URL doivent etre espacees d'environ 72 h.
 *     C'est la contrainte serrante ici : les 30 rendus ne pointent que vers 8
 *     pages de style, soit ~4 epingles par URL.
 *  3. La croissance doit paraitre naturelle : un pic soudain fait flaguer.
 *
 * D'ou deux mecanismes combines :
 *  - un ordre en tourniquet sur le style, qui met le maximum de distance entre
 *    deux epingles partageant une URL ;
 *  - un creneau journalier deterministe, qui ne revele que `PAR_JOUR` epingles
 *    par jour ecoule depuis l'ancrage.
 *
 * Avec 8 styles et 2 epingles par jour, deux epingles d'un meme style sont
 * separees de 8 positions, soit 4 jours : confortablement au-dela des 72 h.
 *
 * Tout est deterministe et sans etat : aucune table a tenir, le flux se
 * recalcule identiquement a chaque lecture.
 */

/** Épingles revelees par jour ecoule. Zone sure d'un compte neuf. */
export const PAR_JOUR = 2;

/**
 * Date d'ancrage du cadencement, en UTC : le jour ou le flux a ete branche
 * dans Pinterest. Deplacer cette date rejouerait tout le calendrier.
 */
export const ANCRAGE_UTC = Date.UTC(2026, 7, 23);

const JOUR_MS = 24 * 60 * 60 * 1000;

export interface Planifiable {
  /** Slug de style, sert de cle de regroupement (une URL par style). */
  style_slug: string;
}

/**
 * Réordonne en tourniquet sur le style : un salon japandi, un salon moderne,
 * un salon boheme, et ainsi de suite avant de revenir au japandi.
 *
 * L'ordre d'entree est conserve a l'interieur d'un meme style, et les styles
 * sont pris dans leur ordre de premiere apparition : deux appels sur la meme
 * liste donnent donc toujours le meme resultat.
 */
export function ordonnerEnTourniquet<T extends Planifiable>(items: T[]): T[] {
  const parStyle = new Map<string, T[]>();
  for (const item of items) {
    const file = parStyle.get(item.style_slug);
    if (file) file.push(item);
    else parStyle.set(item.style_slug, [item]);
  }

  const files = [...parStyle.values()];
  const sortie: T[] = [];
  let reste = items.length;

  while (reste > 0) {
    for (const file of files) {
      const item = file.shift();
      if (item) {
        sortie.push(item);
        reste--;
      }
    }
  }

  return sortie;
}

/** Jours entiers ecoules depuis l'ancrage (0 le jour du branchement). */
export function joursDepuisAncrage(maintenant: number): number {
  return Math.max(0, Math.floor((maintenant - ANCRAGE_UTC) / JOUR_MS));
}

export interface EpinglePlanifiee<T> {
  item: T;
  /** Date a annoncer en <pubDate> : celle du creneau, pas celle du rendu. */
  publieeLe: Date;
}

/**
 * Selectionne les epingles publiables aujourd'hui et date chacune de son
 * creneau.
 *
 * La `pubDate` vaut la date du creneau plutot que celle de la generation :
 * Pinterest publiant les plus anciennes d'abord, l'ordre de sortie suit alors
 * exactement le tourniquet, et non l'ordre de creation des rendus.
 */
export function planifier<T extends Planifiable>(
  items: T[],
  maintenant: number,
): Array<EpinglePlanifiee<T>> {
  const ordonnes = ordonnerEnTourniquet(items);
  const jours = joursDepuisAncrage(maintenant);
  const revelees = (jours + 1) * PAR_JOUR;

  return ordonnes.slice(0, revelees).map((item, index) => ({
    item,
    publieeLe: new Date(ANCRAGE_UTC + Math.floor(index / PAR_JOUR) * JOUR_MS),
  }));
}
