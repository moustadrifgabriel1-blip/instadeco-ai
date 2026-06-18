/**
 * API Cron : boucle d'auto-optimisation CTR.
 *
 * Recoit du job VPS `ctr_optimizer` (analyse GSC) une liste d'overrides de title
 * pour les pages en page 1 de Google mais a faible CTR. Les titles sont
 * template-deterministes, bases sur la requete reellement tapee par les
 * internautes (honnetes par construction, Google-safe). Ecrit dans la table
 * `seo_title_overrides`, lue ensuite par generateMetadata des pages concernees.
 *
 * Securite : Authorization: Bearer CRON_SECRET (pattern cron du projet).
 * Garde-fou : chaque title passe le linter anti-IA (zero tiret/emoji/placeholder)
 * et une validation de longueur. Voir CLAUDE.md (conformite Google).
 */
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin-client';
import { lintAntiAi, sanitizeAntiAi } from '@/src/shared/lint/anti-ai-lint';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

// Bornes de securite.
const MAX_OVERRIDES = 300;
const MAX_TITLE_LEN = 70;
const MAX_DESC_LEN = 165;

interface OverrideInput {
  path?: unknown;
  title?: unknown;
  meta_description?: unknown;
  source_query?: unknown;
  clicks?: unknown;
  impressions?: unknown;
  position?: unknown;
}

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('[CRON ctr-optimize] CRON_SECRET non configure');
    return false;
  }
  return request.headers.get('authorization') === `Bearer ${cronSecret}`;
}

function cleanTitle(raw: unknown, maxLen: number): string | null {
  if (typeof raw !== 'string') return null;
  const sanitized = sanitizeAntiAi(raw).trim();
  if (!sanitized || sanitized.length > maxLen) return null;
  // Refus si une regle HARD anti-IA subsiste (placeholder, etc.).
  const verdict = lintAntiAi(sanitized);
  if (verdict.violations.some((v) => v.severity === 'hard')) return null;
  return sanitized;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { overrides?: OverrideInput[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const overrides = Array.isArray(body.overrides) ? body.overrides : [];
  if (overrides.length === 0) {
    return NextResponse.json({ error: 'No overrides provided' }, { status: 400 });
  }
  if (overrides.length > MAX_OVERRIDES) {
    return NextResponse.json({ error: `Too many overrides (max ${MAX_OVERRIDES})` }, { status: 400 });
  }

  const rows: Array<Record<string, unknown>> = [];
  const skipped: string[] = [];

  for (const o of overrides) {
    const path = typeof o.path === 'string' ? o.path.trim() : '';
    const title = cleanTitle(o.title, MAX_TITLE_LEN);
    if (!path.startsWith('/') || !title) {
      skipped.push(typeof o.path === 'string' ? o.path : '(invalid)');
      continue;
    }
    const desc = cleanTitle(o.meta_description, MAX_DESC_LEN); // meme nettoyage anti-IA
    rows.push({
      path,
      title,
      meta_description: desc,
      source_query: typeof o.source_query === 'string' ? o.source_query.slice(0, 200) : null,
      clicks: Number.isFinite(Number(o.clicks)) ? Math.trunc(Number(o.clicks)) : 0,
      impressions: Number.isFinite(Number(o.impressions)) ? Math.trunc(Number(o.impressions)) : 0,
      position: Number.isFinite(Number(o.position)) ? Number(o.position) : null,
      updated_at: new Date().toISOString(),
    });
  }

  if (rows.length === 0) {
    return NextResponse.json({ applied: 0, skipped: skipped.length, message: 'Aucun override valide.' });
  }

  try {
    const { error } = await getSupabaseAdmin()
      .from('seo_title_overrides')
      .upsert(rows, { onConflict: 'path' });
    if (error) throw error;

    console.log(`[CRON ctr-optimize] ${rows.length} overrides appliques, ${skipped.length} ignores.`);
    return NextResponse.json({ applied: rows.length, skipped: skipped.length });
  } catch (e) {
    console.error('[CRON ctr-optimize] erreur:', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
