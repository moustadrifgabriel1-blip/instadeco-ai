import { describe, it, expect } from 'vitest';
import { renderDigestEmail } from '@/app/api/cron/seo-digest/route';

const GSC = {
  date: '2026-07-02',
  window_days: 28,
  totals: { clicks: 11, impressions: 438, ctr: 2.5, position: 9.7 },
  top_queries: [{ query: 'home staging virtuel', clicks: 3, impressions: 120, ctr: 2.5, position: 6.2 }],
  top_pages: [{ page: 'https://instadeco.app/fr/pro', clicks: 2, impressions: 95, ctr: 2.1, position: 13.5 }],
};

describe('renderDigestEmail', () => {
  it('affiche les totaux GSC et le sujet daté', () => {
    const { subject, html } = renderDigestEmail({ weekOf: '2026-07-02', gsc: GSC });
    expect(subject).toContain('2026');
    expect(html).toContain('11');
    expect(html).toContain('438');
    expect(html).toContain('9.7');
    expect(html).toContain('home staging virtuel');
  });

  it('affiche un message rassurant quand drift.anomalies=0', () => {
    const { html } = renderDigestEmail({
      gsc: GSC,
      drift: { date: '2026-07-02', pages_checked: 10, anomalies: 0, regressions: [], unavailable: [], baselines_created: [] },
    });
    expect(html).toContain('Aucune régression détectée');
  });

  it('affiche les régressions avec ancien/nouveau quand drift.anomalies>0', () => {
    const { html } = renderDigestEmail({
      gsc: GSC,
      drift: {
        date: '2026-07-02',
        pages_checked: 10,
        anomalies: 1,
        regressions: [{ page: '/fr/pro', changes: [{ field: 'title', old: 'Ancien titre', new: 'Nouveau titre' }] }],
        unavailable: [],
        baselines_created: [],
      },
    });
    expect(html).toContain('/fr/pro');
    expect(html).toContain('Ancien titre');
    expect(html).toContain('Nouveau titre');
  });

  it('distingue les mouvements de position up (gagne) et down (perd)', () => {
    const { html } = renderDigestEmail({
      gsc: GSC,
      rank: {
        date: '2026-07-02',
        queries_tracked: 19,
        movers: [
          { query: 'requete qui monte', delta: 4.2, direction: 'up', position: 5.4 },
          { query: 'requete qui descend', delta: 3.1, direction: 'down', position: 18.6 },
        ],
        top_by_impressions: [],
      },
    });
    expect(html).toContain('requete qui monte');
    expect(html).toContain('requete qui descend');
    expect(html).toContain('▲');
    expect(html).toContain('▼');
  });

  it('affiche un message rassurant quand ctr.candidates_count=0', () => {
    const { html } = renderDigestEmail({
      gsc: GSC,
      ctr: { date: '2026-07-02', candidates_count: 0, candidates: [], applied: 'DRY-RUN' },
    });
    expect(html).toContain('Aucune page en position 1');
  });

  it("n'affiche que les sections dont les données sont fournies", () => {
    const { html } = renderDigestEmail({ gsc: GSC });
    expect(html).not.toContain('STABILITÉ ON-PAGE'.toLowerCase());
    expect(html.toUpperCase()).not.toContain('POSITIONS ·');
    expect(html.toUpperCase()).not.toContain('OPPORTUNITÉS CTR');
  });

  it('échappe le HTML des valeurs dynamiques (anti-injection)', () => {
    const { html } = renderDigestEmail({
      gsc: {
        ...GSC,
        top_queries: [{ query: '<script>alert(1)</script>', clicks: 1, impressions: 1, ctr: 1, position: 1 }],
      },
    });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
