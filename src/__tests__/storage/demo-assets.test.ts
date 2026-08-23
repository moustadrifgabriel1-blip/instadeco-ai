import { describe, it, expect } from 'vitest';
import {
  DEMO_USER_ID,
  isProtectedDemoInput,
} from '@/src/shared/storage/demo-assets';

/**
 * Régression vécue deux fois (juillet puis août 2026) : la purge hebdomadaire
 * de `input-images` supprimait les photos « avant » du compte démo, et les
 * comparatifs avant/après de la home, de /pro et de /exemples se retrouvaient
 * à moitié vides. Les deux fois, on avait remplacé les images sans corriger la
 * règle. Ce test verrouille la règle elle-même.
 */
describe('protection des images de démonstration', () => {
  it('protège les photos du compte démo', () => {
    expect(
      isProtectedDemoInput(`${DEMO_USER_ID}/gallery30-4030028-japandi.jpg`),
    ).toBe(true);
  });

  it('protège aussi un fichier posé plus profond sous le compte démo', () => {
    expect(isProtectedDemoInput(`${DEMO_USER_ID}/lot-2/piece-vide.jpg`)).toBe(true);
  });

  it('ne protège pas les photos des vrais utilisateurs', () => {
    expect(
      isProtectedDemoInput('9a1c3f77-0000-4444-8888-abcdefabcdef/1781787540154.jpg'),
    ).toBe(false);
  });

  it('ne protège pas un objet à la racine du bucket', () => {
    expect(isProtectedDemoInput('1781787540154.jpg')).toBe(false);
  });

  it("ne se laisse pas berner par un identifiant qui ressemble au compte démo", () => {
    // Un préfixe qui commence pareil mais n'est pas le dossier du compte démo.
    expect(isProtectedDemoInput(`${DEMO_USER_ID}-bis/photo.jpg`)).toBe(false);
  });
});
