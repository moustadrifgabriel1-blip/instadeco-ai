import { describe, it, expect } from 'vitest';
import { lintAntiAi, sanitizeAntiAi, PASS_THRESHOLD, type AntiAiResult } from '@/src/shared/lint/anti-ai-lint';

const hasRule = (r: AntiAiResult, prefix: string) =>
  r.violations.some((v) => v.rule.startsWith(prefix));
const hardCount = (r: AntiAiResult) => r.violations.filter((v) => v.severity === 'hard').length;

// Un paragraphe humain, varié, sans marqueur IA. Sert de témoin "propre".
const CLEAN =
  "Le salon respire. Quelques meubles bien choisis, une lumière douce, et la pièce change de visage sans gros travaux. On garde le canapé, on ajoute un tapis chaud et deux lampes basses pour casser la lumière du plafond. Résultat immédiat. Vous gagnez en confort là où, hier encore, tout semblait figé et un peu triste à vivre au quotidien.";

describe('anti-ai-lint, tirets (hard)', () => {
  it('détecte le tiret cadratin', () => {
    expect(hasRule(lintAntiAi('Le salon — vraiment beau.'), 'em_dash')).toBe(true);
  });
  it('détecte le tiret demi-cadratin', () => {
    expect(hasRule(lintAntiAi('Le salon – vraiment beau.'), 'em_dash')).toBe(true);
  });
  it('le tiret est une violation hard', () => {
    const r = lintAntiAi('Texte avec — dedans.');
    expect(r.violations.find((v) => v.rule === 'em_dash')?.severity).toBe('hard');
  });
  it('un tiret fait échouer passed même si le reste est propre', () => {
    expect(lintAntiAi('Une phrase courte. ' + CLEAN + ' Et — un tiret.').passed).toBe(false);
  });
  it("un trait d'union normal n'est pas un tiret banni", () => {
    expect(hasRule(lintAntiAi('un rendez-vous peut-être utile'), 'em_dash')).toBe(false);
  });
});

describe('anti-ai-lint, emojis (hard)', () => {
  it('détecte un emoji visage', () => {
    expect(hasRule(lintAntiAi('Super salon 😀'), 'emoji')).toBe(true);
  });
  it('détecte une étoile scintillante', () => {
    expect(hasRule(lintAntiAi('Le sol ✨ brille'), 'emoji')).toBe(true);
  });
  it('détecte un drapeau', () => {
    expect(hasRule(lintAntiAi('France 🇫🇷'), 'emoji')).toBe(true);
  });
  it('détecte une coche emoji', () => {
    expect(hasRule(lintAntiAi('Fait ✅'), 'emoji')).toBe(true);
  });
  it("l'emoji est une violation hard", () => {
    expect(lintAntiAi('Salon 🛋️ cosy').violations.find((v) => v.rule === 'emoji')?.severity).toBe('hard');
  });
  it("le texte accentué français n'est pas pris pour un emoji", () => {
    expect(hasRule(lintAntiAi('Été à Genève, déco élégante, à côté du cœur.'), 'emoji')).toBe(false);
  });
  it("la flèche typographique n'est pas traitée comme un emoji", () => {
    expect(hasRule(lintAntiAi('avant → après'), 'emoji')).toBe(false);
  });
});

describe('anti-ai-lint, placeholders (hard)', () => {
  it('détecte "Article sur"', () => {
    expect(hasRule(lintAntiAi('Article sur les murs noirs'), 'placeholder')).toBe(true);
  });
  it('détecte lorem ipsum', () => {
    expect(hasRule(lintAntiAi('Lorem ipsum dolor sit amet'), 'placeholder')).toBe(true);
  });
  it('détecte TODO', () => {
    expect(hasRule(lintAntiAi('Section TODO à remplir plus tard'), 'placeholder')).toBe(true);
  });
  it('détecte "à compléter"', () => {
    expect(hasRule(lintAntiAi('Introduction à compléter avant publication'), 'placeholder')).toBe(true);
  });
  it('le placeholder est une violation hard', () => {
    expect(lintAntiAi('Article sur le sujet').violations.find((v) => v.rule === 'placeholder')?.severity).toBe('hard');
  });
  it('un texte normal ne déclenche pas de placeholder', () => {
    expect(hasRule(lintAntiAi(CLEAN), 'placeholder')).toBe(false);
  });
});

describe('anti-ai-lint, ouvertures IA (soft)', () => {
  it('détecte "En effet," en début de texte', () => {
    expect(hasRule(lintAntiAi('En effet, le salon est clair.'), 'ai_opener')).toBe(true);
  });
  it('détecte "Il est important de noter que"', () => {
    expect(hasRule(lintAntiAi('Il est important de noter que tout compte.'), 'ai_opener')).toBe(true);
  });
  it('détecte "Plongez dans"', () => {
    expect(hasRule(lintAntiAi('Plongez dans un univers cosy.'), 'ai_opener')).toBe(true);
  });
  it('détecte "N\'hésitez pas à"', () => {
    expect(hasRule(lintAntiAi("N'hésitez pas à tester ce style."), 'ai_opener')).toBe(true);
  });
  it('détecte "En conclusion"', () => {
    expect(hasRule(lintAntiAi('En conclusion, osez le noir.'), 'ai_opener')).toBe(true);
  });
  it('détecte une ouverture après un point', () => {
    expect(hasRule(lintAntiAi('Le mur est sombre. En effet, il structure.'), 'ai_opener')).toBe(true);
  });
  it("n'attrape pas l'expression en plein milieu de phrase", () => {
    expect(hasRule(lintAntiAi('Tout cela en effet semblait acquis.'), 'ai_opener')).toBe(false);
  });
  it('une ouverture IA est une violation soft', () => {
    expect(lintAntiAi('En effet, voilà.').violations.find((v) => v.rule.startsWith('ai_opener'))?.severity).toBe('soft');
  });
});

describe('anti-ai-lint, remplissage IA (soft)', () => {
  it('détecte "joue un rôle crucial"', () => {
    expect(hasRule(lintAntiAi('La lumière joue un rôle crucial ici.'), 'ai_filler')).toBe(true);
  });
  it('détecte "incontournable"', () => {
    expect(hasRule(lintAntiAi('Un meuble incontournable du salon.'), 'ai_filler')).toBe(true);
  });
  it('détecte "il convient de"', () => {
    expect(hasRule(lintAntiAi('Ici il convient de poser un tapis.'), 'ai_filler')).toBe(true);
  });
  it('détecte "au cœur de"', () => {
    expect(hasRule(lintAntiAi('Le canapé, au cœur de la pièce.'), 'ai_filler')).toBe(true);
  });
  it('détecte "dans cet article, nous"', () => {
    expect(hasRule(lintAntiAi('Dans cet article, nous voyons tout.'), 'ai_filler')).toBe(true);
  });
  it('un texte direct ne déclenche pas de remplissage', () => {
    expect(hasRule(lintAntiAi('Posez un tapis. Ajoutez deux lampes. Terminé.'), 'ai_filler')).toBe(false);
  });
});

describe('anti-ai-lint, débuts de phrase répétés (soft)', () => {
  it('détecte trois phrases au même début', () => {
    const t = 'Le salon brille fort aujourd\'hui vraiment. Le salon attire tous les regards. Le salon reste un lieu de vie. Voilà autre chose ici.';
    expect(hasRule(lintAntiAi(t), 'repeated_start')).toBe(true);
  });
  it('ne signale pas deux débuts identiques seulement', () => {
    const t = 'Le salon brille. Le salon attire. Une cuisine claire ouvre l\'espace. Un couloir relie le tout.';
    expect(hasRule(lintAntiAi(t), 'repeated_start')).toBe(false);
  });
  it('des débuts variés ne déclenchent rien', () => {
    expect(hasRule(lintAntiAi(CLEAN), 'repeated_start')).toBe(false);
  });
  it('exactement trois mêmes débuts déclenche la règle', () => {
    const t = 'Vous gagnez en clarté tout de suite. Vous gagnez du rangement utile. Vous gagnez un vrai confort. Et le reste suit.';
    const v = lintAntiAi(t).violations.find((x) => x.rule === 'repeated_start');
    expect(v?.excerpt).toContain('x3');
  });
});

describe('anti-ai-lint, uniformité des longueurs (soft)', () => {
  it('signale des phrases toutes de longueur moyenne', () => {
    const s = 'Le salon clair accueille deux fauteuils confortables près de la fenêtre ouverte';
    const t = Array.from({ length: 7 }, () => s).join('. ') + '.';
    expect(hasRule(lintAntiAi(t), 'uniform_length')).toBe(true);
  });
  it('ne signale rien si court et long cohabitent', () => {
    const t =
      'Tout change. Le salon clair accueille deux fauteuils confortables, un tapis épais, deux lampes basses et une bibliothèque ouverte qui structure vraiment tout le mur du fond sans alourdir. Voilà. La pièce respire enfin. On circule mieux. Le soir venu, la lumière douce transforme complètement cet espace autrefois figé et terne au quotidien.';
    expect(hasRule(lintAntiAi(t), 'uniform_length')).toBe(false);
  });
  it("n'évalue pas l'uniformité sous six phrases", () => {
    expect(hasRule(lintAntiAi('Phrase une ici. Phrase deux ici. Phrase trois ici.'), 'uniform_length')).toBe(false);
  });
  it('signale s\'il manque une phrase longue', () => {
    const t = 'Le salon est beau. La cuisine est claire. Le couloir est net. La chambre est calme. Le bureau est rangé. Tout va bien.';
    expect(hasRule(lintAntiAi(t), 'uniform_length')).toBe(true);
  });
});

describe('anti-ai-lint, score et verdict', () => {
  it('un texte humain propre passe', () => {
    const r = lintAntiAi(CLEAN);
    expect(r.passed).toBe(true);
    expect(r.score).toBeGreaterThanOrEqual(PASS_THRESHOLD);
  });
  it('une violation hard fait échouer quel que soit le score', () => {
    expect(lintAntiAi('😀').passed).toBe(false);
  });
  it('plusieurs violations soft font passer sous le seuil', () => {
    const t = "En effet, c'est incontournable. Il convient de noter ceci. Au cœur de tout. N'hésitez pas à essayer.";
    expect(lintAntiAi(t).passed).toBe(false);
  });
  it('le score ne descend jamais sous 0', () => {
    const t = '😀 — Article sur ' + 'En effet, incontournable, au cœur de, il convient de. '.repeat(10);
    expect(lintAntiAi(t).score).toBeGreaterThanOrEqual(0);
  });
  it('le score ne dépasse jamais 100', () => {
    expect(lintAntiAi(CLEAN).score).toBeLessThanOrEqual(100);
  });
  it('une chaîne vide ne génère aucune violation', () => {
    expect(lintAntiAi('').violations).toHaveLength(0);
  });
  it('compte correctement les violations hard', () => {
    expect(hardCount(lintAntiAi('😀 et — et Article sur'))).toBeGreaterThanOrEqual(3);
  });
});

describe('anti-ai-lint, robustesse et forme du résultat', () => {
  it('retourne un objet avec score, passed et violations', () => {
    const r = lintAntiAi('texte');
    expect(r).toHaveProperty('score');
    expect(r).toHaveProperty('passed');
    expect(Array.isArray(r.violations)).toBe(true);
  });
  it('chaque violation a rule, severity et excerpt', () => {
    const r = lintAntiAi('Le salon — beau');
    const v = r.violations[0];
    expect(v.rule).toBeTruthy();
    expect(['hard', 'soft']).toContain(v.severity);
    expect(typeof v.excerpt).toBe('string');
  });
  it('gère une entrée non définie sans planter', () => {
    // @ts-expect-error test volontaire d'une entrée invalide
    expect(() => lintAntiAi(undefined)).not.toThrow();
  });
  it('est déterministe (même entrée, même sortie)', () => {
    const a = lintAntiAi(CLEAN);
    const b = lintAntiAi(CLEAN);
    expect(a).toEqual(b);
  });
  it("l'excerpt d'un tiret contient du contexte", () => {
    const r = lintAntiAi('Le grand salon — lumineux et calme');
    const v = r.violations.find((x) => x.rule === 'em_dash');
    expect(v?.excerpt.length).toBeGreaterThan(0);
  });
});

describe('anti-ai-lint, cas réalistes', () => {
  it('un paragraphe de blog propre passe', () => {
    const t =
      "Vous hésitez sur la couleur des murs ? Commencez par tester sur un seul pan. Le noir, par exemple, donne du caractère sans tout assombrir si la pièce reçoit de la lumière. Un mur foncé, des cadres clairs, et le tour est joué.";
    expect(lintAntiAi(t).passed).toBe(true);
  });
  it('un paragraphe à tournures IA échoue', () => {
    const t =
      "En effet, il est important de noter que la lumière joue un rôle crucial. Il convient de souligner que ce style est incontournable. N'hésitez pas à plonger dans cet univers.";
    expect(lintAntiAi(t).passed).toBe(false);
  });
  it('un tiret au milieu d\'un texte propre suffit à échouer', () => {
    expect(lintAntiAi(CLEAN + ' Et là – patatras.').passed).toBe(false);
  });
  it('un titre avec emoji échoue', () => {
    expect(lintAntiAi('Le sol de votre appartement ✨').passed).toBe(false);
  });
  it('une meta description propre passe', () => {
    const t = 'Murs noirs en intérieur : oser le noir sans assombrir. Conseils lumière, finitions et associations de couleurs.';
    expect(lintAntiAi(t).passed).toBe(true);
  });
});

describe('anti-ai-lint, assainissement', () => {
  it('remplace le tiret cadratin par une virgule', () => {
    expect(sanitizeAntiAi('Le salon — lumineux')).toBe('Le salon, lumineux');
  });
  it('retire les emojis', () => {
    expect(sanitizeAntiAi('Le sol ✨ brille 😀')).not.toMatch(/[✨😀]/u);
  });
  it('un texte assaini ne porte plus de violation hard', () => {
    const r = lintAntiAi(sanitizeAntiAi('Salon — cosy 😀 et chaleureux'));
    expect(r.violations.filter((v) => v.severity === 'hard')).toHaveLength(0);
  });
  it('laisse intact un texte déjà propre', () => {
    expect(sanitizeAntiAi('Un salon clair et net')).toBe('Un salon clair et net');
  });
});
