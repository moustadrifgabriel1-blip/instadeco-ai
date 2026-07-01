import { describe, it, expect } from 'vitest';
import { extractFaqItems } from '@/lib/seo/faq-from-markdown';

const ARTICLE = `Une intro quelconque avec du **gras** qui n'est pas une question.

## Le tableau comparatif

| A | B |
|---|---|
| 1 | 2 |

## Foire aux questions

**Quel est le meilleur logiciel en 2026 ?**
Il n'y a pas de gagnant unique. Le meilleur choix dépend de votre volume et de votre budget.

**Combien coûte un logiciel de home staging virtuel ?**
Les abonnements démarrent entre 19,99 et 49 € par mois selon la formule.

**Le home staging virtuel est-il légal en France ?**
Oui, à condition d'indiquer que les photos sont retouchées. Voir notre [guide dédié](/fr/solution/home-staging-virtuel-legal).

## En clair

Un dernier paragraphe avec du **gras** hors FAQ, à ignorer.`;

describe('extractFaqItems', () => {
  it('extrait toutes les questions de la section FAQ', () => {
    const items = extractFaqItems(ARTICLE);
    expect(items).toHaveLength(3);
    expect(items[0].question).toBe('Quel est le meilleur logiciel en 2026 ?');
    expect(items[0].answer).toContain('pas de gagnant unique');
  });

  it('nettoie les liens Markdown dans les réponses (texte seul)', () => {
    const items = extractFaqItems(ARTICLE);
    const legal = items[2];
    expect(legal.answer).toContain('guide dédié');
    expect(legal.answer).not.toContain('](');
    expect(legal.answer).not.toContain('/fr/solution');
  });

  it("ne déborde pas sur la section suivante (## En clair)", () => {
    const items = extractFaqItems(ARTICLE);
    expect(items.every((i) => !i.answer.includes('hors FAQ'))).toBe(true);
  });

  it('ignore le gras hors section FAQ', () => {
    const items = extractFaqItems(ARTICLE);
    expect(items.every((i) => i.question !== 'gras')).toBe(true);
  });

  it('renvoie un tableau vide sans section FAQ', () => {
    expect(extractFaqItems('## Titre\n\nDu texte sans FAQ.')).toEqual([]);
    expect(extractFaqItems('')).toEqual([]);
  });

  it('reconnaît aussi un titre « FAQ »', () => {
    const md = `## FAQ\n\n**Une question ?**\nUne réponse claire et utile.`;
    const items = extractFaqItems(md);
    expect(items).toHaveLength(1);
    expect(items[0].question).toBe('Une question ?');
  });
});
