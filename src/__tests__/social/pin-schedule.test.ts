import { describe, it, expect } from 'vitest';
import {
  ANCRAGE_UTC,
  PAR_JOUR,
  joursDepuisAncrage,
  ordonnerEnTourniquet,
  planifier,
} from '@/lib/social/pin-schedule';

const JOUR = 24 * 60 * 60 * 1000;

/** Reproduit la vraie repartition : 30 rendus sur 8 styles, ~4 par style. */
function jeuReel() {
  const styles = [
    ['japandi', 4],
    ['boheme', 4],
    ['moderne', 4],
    ['artdeco', 4],
    ['midcentury', 4],
    ['coastal', 4],
    ['minimaliste', 3],
    ['classique', 3],
  ] as const;
  const items: Array<{ id: string; style_slug: string }> = [];
  for (const [style, n] of styles) {
    for (let i = 0; i < n; i++) items.push({ id: `${style}-${i}`, style_slug: style });
  }
  return items;
}

describe('ordonnerEnTourniquet', () => {
  it('alterne les styles au lieu de les grouper', () => {
    const ordonnes = ordonnerEnTourniquet(jeuReel());
    const huitPremiers = ordonnes.slice(0, 8).map((i) => i.style_slug);
    expect(new Set(huitPremiers).size).toBe(8);
  });

  it('ne perd ni ne duplique aucune épingle', () => {
    const source = jeuReel();
    const ordonnes = ordonnerEnTourniquet(source);
    expect(ordonnes).toHaveLength(source.length);
    expect(new Set(ordonnes.map((i) => i.id)).size).toBe(source.length);
  });

  it('est stable : deux appels donnent le même ordre', () => {
    const a = ordonnerEnTourniquet(jeuReel()).map((i) => i.id);
    const b = ordonnerEnTourniquet(jeuReel()).map((i) => i.id);
    expect(a).toEqual(b);
  });

  it('supporte un style unique sans boucler indéfiniment', () => {
    const items = [
      { id: 'a', style_slug: 'japandi' },
      { id: 'b', style_slug: 'japandi' },
    ];
    expect(ordonnerEnTourniquet(items).map((i) => i.id)).toEqual(['a', 'b']);
  });

  it('accepte une liste vide', () => {
    expect(ordonnerEnTourniquet([])).toEqual([]);
  });
});

describe('planifier', () => {
  it('ne révèle que le quota du premier jour', () => {
    const plan = planifier(jeuReel(), ANCRAGE_UTC);
    expect(plan).toHaveLength(PAR_JOUR);
  });

  it('révèle le quota cumulé au fil des jours', () => {
    const plan = planifier(jeuReel(), ANCRAGE_UTC + 4 * JOUR);
    expect(plan).toHaveLength(5 * PAR_JOUR);
  });

  it('ne dépasse jamais le nombre d’épingles disponibles', () => {
    const source = jeuReel();
    const plan = planifier(source, ANCRAGE_UTC + 400 * JOUR);
    expect(plan).toHaveLength(source.length);
  });

  it('ne révèle rien de plus avant l’ancrage', () => {
    const plan = planifier(jeuReel(), ANCRAGE_UTC - 10 * JOUR);
    expect(plan).toHaveLength(PAR_JOUR);
  });

  /**
   * La regle qui compte vraiment : Pinterest demande ~72 h entre deux epingles
   * pointant vers la meme URL, et nos 30 rendus ne visent que 8 pages.
   */
  it('espace de plus de 72 heures deux épingles vers la même URL', () => {
    const plan = planifier(jeuReel(), ANCRAGE_UTC + 400 * JOUR);
    const dernierPassage = new Map<string, number>();

    for (const { item, publieeLe } of plan) {
      const precedent = dernierPassage.get(item.style_slug);
      if (precedent !== undefined) {
        const ecartHeures = (publieeLe.getTime() - precedent) / (60 * 60 * 1000);
        expect(ecartHeures).toBeGreaterThanOrEqual(72);
      }
      dernierPassage.set(item.style_slug, publieeLe.getTime());
    }
  });

  it('reste dans la zone sûre de 1 à 5 épingles par jour', () => {
    const plan = planifier(jeuReel(), ANCRAGE_UTC + 400 * JOUR);
    const parJour = new Map<number, number>();

    for (const { publieeLe } of plan) {
      const jour = Math.floor((publieeLe.getTime() - ANCRAGE_UTC) / JOUR);
      parJour.set(jour, (parJour.get(jour) || 0) + 1);
    }

    for (const compte of parJour.values()) {
      expect(compte).toBeGreaterThanOrEqual(1);
      expect(compte).toBeLessThanOrEqual(5);
    }
  });

  it('date chaque épingle de son créneau, dans l’ordre', () => {
    const plan = planifier(jeuReel(), ANCRAGE_UTC + 400 * JOUR);
    for (let i = 1; i < plan.length; i++) {
      expect(plan[i].publieeLe.getTime()).toBeGreaterThanOrEqual(plan[i - 1].publieeLe.getTime());
    }
    expect(plan[0].publieeLe.getTime()).toBe(ANCRAGE_UTC);
  });
});

describe('joursDepuisAncrage', () => {
  it('vaut 0 le jour du branchement', () => {
    expect(joursDepuisAncrage(ANCRAGE_UTC)).toBe(0);
    expect(joursDepuisAncrage(ANCRAGE_UTC + JOUR - 1)).toBe(0);
  });

  it('ne devient jamais négatif', () => {
    expect(joursDepuisAncrage(ANCRAGE_UTC - 30 * JOUR)).toBe(0);
  });
});
