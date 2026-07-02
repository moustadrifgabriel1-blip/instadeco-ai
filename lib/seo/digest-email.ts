/**
 * Rendu du digest SEO hebdomadaire (DA prestige, nuit + or), séparé de la route
 * API : un fichier route.ts de l'App Router ne peut exporter QUE des handlers
 * HTTP (GET/POST/...) et quelques constantes de config, next build casse sinon
 * ("X is not a valid Route export field").
 */

// ============================================
// PALETTE PRESTIGE (cohérente avec lib/notifications/marketing-emails.ts)
// ============================================
const INK = '#0c0a09';
const INK_DEEP = '#0a0807';
const SURFACE = '#1c1917';
const GOLD = '#c8a24d';
const IVORY = '#faf8f4';
const MIST = '#b3a89a';
const MIST_DIM = '#8c8478';
const LINE = 'rgba(200,162,77,0.28)';
const DOWN = '#c17c74';
const SERIF = "Georgia, 'Times New Roman', serif";

// ============================================
// TYPES (miroir des summary.json écrits par .claude/seo-engine/monitors/*.py)
// ============================================
interface GscTotals {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}
interface GscQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}
interface GscPageRow {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}
export interface GscSummary {
  date: string;
  window_days: number;
  totals: GscTotals;
  top_queries: GscQueryRow[];
  top_pages: GscPageRow[];
}

interface DriftChange {
  field: string;
  old: string;
  new: string;
}
interface DriftRegression {
  page: string;
  changes: DriftChange[];
}
interface DriftUnavailable {
  page: string;
  error: string;
}
export interface DriftSummary {
  date: string;
  pages_checked: number;
  anomalies: number;
  regressions: DriftRegression[];
  unavailable: DriftUnavailable[];
  baselines_created: string[];
}

interface RankMover {
  query: string;
  delta: number;
  direction: 'up' | 'down';
  position: number;
}
interface RankTopRow {
  query: string;
  position: number;
  clicks: number;
  impressions: number;
}
export interface RankSummary {
  date: string;
  queries_tracked: number;
  movers: RankMover[];
  top_by_impressions: RankTopRow[];
}

interface CtrCandidate {
  path: string;
  source_query: string;
  impressions: number;
  position: number;
  title: string;
}
export interface CtrSummary {
  date: string;
  candidates_count: number;
  candidates: CtrCandidate[];
  applied: string;
}

export interface DigestPayload {
  weekOf?: string;
  gsc?: GscSummary | null;
  drift?: DriftSummary | null;
  rank?: RankSummary | null;
  ctr?: CtrSummary | null;
}

// ============================================
// HELPERS DE RENDU
// ============================================
function escapeHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function truncate(s: string, max = 70): string {
  const t = String(s ?? '');
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

function fmtNum(n: number): string {
  return Number(n ?? 0).toLocaleString('fr-FR');
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '';
  try {
    return new Date(`${iso}T00:00:00Z`).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function sectionTitle(label: string): string {
  return `<tr><td style="padding:28px 0 12px;"><div style="font-family:${SERIF}; font-size:12px; letter-spacing:0.28em; text-transform:uppercase; color:${GOLD}; border-bottom:1px solid ${LINE}; padding-bottom:10px;">${escapeHtml(label)}</div></td></tr>`;
}

function statBox(value: string, label: string): string {
  return `
    <td width="50%" style="padding:4px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${SURFACE}; border:1px solid ${LINE}; border-radius:12px;">
        <tr><td style="padding:16px 18px; text-align:center;">
          <div style="font-family:${SERIF}; font-size:26px; font-weight:700; color:${GOLD};">${value}</div>
          <div style="font-size:11px; letter-spacing:0.08em; text-transform:uppercase; color:${MIST_DIM}; margin-top:4px;">${escapeHtml(label)}</div>
        </td></tr>
      </table>
    </td>`;
}

function statsGrid(a: [string, string], b: [string, string]): string {
  return `
    <tr><td style="padding-top:6px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${statBox(a[0], a[1])}${statBox(b[0], b[1])}</tr></table>
    </td></tr>`;
}

function miniTable(headers: string[], rows: string[][]): string {
  const head = headers
    .map((h, i) => `<th align="${i === 0 ? 'left' : 'right'}" style="padding:6px 8px; font-size:11px; text-transform:uppercase; letter-spacing:0.04em; color:${MIST_DIM}; border-bottom:1px solid ${LINE};">${escapeHtml(h)}</th>`)
    .join('');
  const body = rows
    .map(
      (r) =>
        `<tr>${r
          .map(
            (cell, i) =>
              `<td align="${i === 0 ? 'left' : 'right'}" style="padding:7px 8px; font-size:13px; color:${i === 0 ? IVORY : MIST}; border-bottom:1px solid rgba(200,162,77,0.10);">${cell}</td>`,
          )
          .join('')}</tr>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px;"><tr>${head}</tr>${body}</table>`;
}

function calloutOk(text: string): string {
  return `<p style="margin:0; padding:12px 16px; background-color:${SURFACE}; border:1px solid ${LINE}; border-left:3px solid ${GOLD}; border-radius:8px; color:${MIST}; font-size:13px; line-height:1.6;">${text}</p>`;
}

function calloutWarn(text: string): string {
  return `<p style="margin:0 0 8px; padding:12px 16px; background-color:${SURFACE}; border:1px solid ${LINE}; border-left:3px solid ${DOWN}; border-radius:8px; color:${MIST}; font-size:13px; line-height:1.6;">${text}</p>`;
}

// ============================================
// SECTIONS
// ============================================
function renderGscSection(gsc: GscSummary): string {
  const t = gsc.totals;
  const rows: string[] = [];
  rows.push(sectionTitle(`Recherche Google · ${gsc.window_days} derniers jours`));
  rows.push(
    statsGrid(
      [fmtNum(t.clicks), 'clics'],
      [fmtNum(t.impressions), 'impressions'],
    ),
  );
  rows.push(
    statsGrid(
      [`${t.ctr}%`, 'CTR'],
      [t.position.toFixed(1), 'position moyenne'],
    ),
  );

  if (gsc.top_queries.length > 0) {
    rows.push(`<tr><td style="padding-top:16px; font-size:13px; font-weight:700; color:${IVORY};">Top requêtes</td></tr>`);
    rows.push(
      `<tr><td>${miniTable(
        ['Requête', 'Clics', 'Impr.', 'Pos.'],
        gsc.top_queries.map((q) => [
          escapeHtml(truncate(q.query, 42)),
          fmtNum(q.clicks),
          fmtNum(q.impressions),
          q.position.toFixed(1),
        ]),
      )}</td></tr>`,
    );
  }

  if (gsc.top_pages.length > 0) {
    rows.push(`<tr><td style="padding-top:16px; font-size:13px; font-weight:700; color:${IVORY};">Top pages</td></tr>`);
    rows.push(
      `<tr><td>${miniTable(
        ['Page', 'Clics', 'Impr.', 'Pos.'],
        gsc.top_pages.map((p) => [
          escapeHtml(truncate(p.page.replace(/^https?:\/\/instadeco\.app/, ''), 34)),
          fmtNum(p.clicks),
          fmtNum(p.impressions),
          p.position.toFixed(1),
        ]),
      )}</td></tr>`,
    );
  }

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows.join('')}</table>`;
}

function renderDriftSection(drift: DriftSummary): string {
  const rows: string[] = [sectionTitle('Stabilité on-page')];

  if (drift.anomalies === 0) {
    rows.push(
      `<tr><td>${calloutOk(`Aucune régression détectée. ${drift.pages_checked} pages surveillées (title, meta, H1, canonical, hreflang, schema), tout est stable.`)}</td></tr>`,
    );
  } else {
    for (const reg of drift.regressions.slice(0, 6)) {
      const changeLines = reg.changes
        .slice(0, 3)
        .map(
          (c) =>
            `<div style="margin-top:4px;"><span style="color:${MIST_DIM};">${escapeHtml(c.field)}</span> : ${escapeHtml(truncate(c.old, 50))} → <span style="color:${IVORY};">${escapeHtml(truncate(c.new, 50))}</span></div>`,
        )
        .join('');
      rows.push(
        `<tr><td>${calloutWarn(`<strong style="color:${IVORY};">${escapeHtml(reg.page)}</strong>${changeLines}`)}</td></tr>`,
      );
    }
    if (drift.regressions.length > 6) {
      rows.push(
        `<tr><td style="font-size:12px; color:${MIST_DIM}; padding-top:2px;">+ ${drift.regressions.length - 6} autre(s) page(s) modifiée(s).</td></tr>`,
      );
    }
  }

  if (drift.unavailable.length > 0) {
    rows.push(
      `<tr><td style="padding-top:8px;">${calloutWarn(`${drift.unavailable.length} page(s) indisponible(s) au dernier passage : ${drift.unavailable.map((u) => escapeHtml(u.page)).join(', ')}.`)}</td></tr>`,
    );
  }

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows.join('')}</table>`;
}

function renderRankSection(rank: RankSummary): string {
  const rows: string[] = [sectionTitle(`Positions · ${rank.queries_tracked} requêtes suivies`)];

  if (rank.movers.length === 0) {
    rows.push(`<tr><td>${calloutOk('Pas de mouvement notable cette semaine (variation < 3 positions).')}</td></tr>`);
  } else {
    const gains = rank.movers.filter((m) => m.direction === 'up');
    const losses = rank.movers.filter((m) => m.direction === 'down');
    const moverLine = (m: RankMover) => {
      const arrow = m.direction === 'up' ? '▲' : '▼';
      const color = m.direction === 'up' ? GOLD : DOWN;
      return `<div style="padding:4px 0; font-size:13px;"><span style="color:${color}; font-weight:700;">${arrow} ${m.delta.toFixed(1)}</span> <span style="color:${IVORY};">${escapeHtml(truncate(m.query, 46))}</span> <span style="color:${MIST_DIM};">(pos. ${m.position.toFixed(1)})</span></div>`;
    };
    if (gains.length > 0) {
      rows.push(`<tr><td style="padding-top:8px;">${gains.map(moverLine).join('')}</td></tr>`);
    }
    if (losses.length > 0) {
      rows.push(`<tr><td>${losses.map(moverLine).join('')}</td></tr>`);
    }
  }

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows.join('')}</table>`;
}

function renderCtrSection(ctr: CtrSummary): string {
  const rows: string[] = [sectionTitle('Opportunités CTR')];

  if (ctr.candidates_count === 0) {
    rows.push(
      `<tr><td>${calloutOk('Aucune page en position 1 sans clic détectée cette semaine.')}</td></tr>`,
    );
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows.join('')}</table>`;
  }

  rows.push(
    `<tr><td>${calloutOk(`${ctr.candidates_count} page(s) rankent en page 1 sans recevoir de clic : un title mieux aligné a été ${ctr.applied.startsWith('POST 2') ? 'appliqué automatiquement' : 'proposé'}.`)}</td></tr>`,
  );
  rows.push(
    `<tr><td>${miniTable(
      ['Page', 'Requête', 'Impr.', 'Pos.'],
      ctr.candidates.map((c) => [
        escapeHtml(truncate(c.path, 34)),
        escapeHtml(truncate(c.source_query, 30)),
        fmtNum(c.impressions),
        c.position.toFixed(1),
      ]),
    )}</td></tr>`,
  );

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows.join('')}</table>`;
}

// ============================================
// EMAIL COMPLET
// ============================================
export function renderDigestEmail(payload: DigestPayload): { subject: string; html: string } {
  const weekLabel = formatDate(payload.weekOf) || 'cette semaine';
  const subject = `Digest SEO InstaDeco, semaine du ${weekLabel}`;

  const sections: string[] = [];
  if (payload.gsc) sections.push(renderGscSection(payload.gsc));
  if (payload.drift) sections.push(renderDriftSection(payload.drift));
  if (payload.rank) sections.push(renderRankSection(payload.rank));
  if (payload.ctr) sections.push(renderCtrSection(payload.ctr));

  const content = `
    <h1 style="font-family:${SERIF}; font-size:20px; font-weight:700; color:${IVORY}; margin:0 0 4px;">Digest SEO</h1>
    <p style="color:${MIST_DIM}; font-size:13px; margin:0 0 8px;">Semaine du ${escapeHtml(weekLabel)}</p>
    ${sections.join('')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding-top:26px;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr><td style="border-radius:999px; background-color:${GOLD};">
          <a href="https://search.google.com/search-console?resource_id=sc-domain:instadeco.app" style="display:inline-block; padding:13px 30px; font-size:13px; font-weight:700; color:${INK}; text-decoration:none; border-radius:999px;">Ouvrir Search Console</a>
        </td></tr>
      </table>
    </td></tr></table>`;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
</head>
<body style="margin:0; padding:0; background-color:${INK_DEEP}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${INK_DEEP};">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:${INK}; border:1px solid ${LINE}; border-radius:18px; overflow:hidden;">
        <tr><td style="padding:34px 32px 20px; text-align:center; border-bottom:1px solid rgba(200,162,77,0.18);">
          <img src="https://instadeco.app/images/logo-prestige.svg" alt="InstaDeco AI" width="44" height="44" style="display:inline-block; margin-bottom:14px;" />
          <div style="font-family:${SERIF}; font-size:13px; letter-spacing:0.34em; text-transform:uppercase; color:${GOLD};">InstaDeco&nbsp;AI</div>
        </td></tr>
        <tr><td style="padding:30px 32px 36px;">
          ${content}
        </td></tr>
        <tr><td style="background-color:${INK_DEEP}; padding:22px 32px; text-align:center; border-top:1px solid rgba(200,162,77,0.18);">
          <p style="color:${MIST_DIM}; font-size:11px; line-height:1.7; margin:0;">
            Digest automatique, moteur SEO InstaDeco (VPS). Données réelles uniquement (Search Console).<br />
            <a href="https://instadeco.app" style="color:${GOLD}; text-decoration:none;">instadeco.app</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
