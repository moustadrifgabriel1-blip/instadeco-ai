/**
 * Script : réécriture anti-IA des articles de blog existants.
 *
 * Pour chaque article publié, on lint le contenu. S'il échoue (tournures IA
 * "soft" détectées par le linter), on le fait réécrire par Gemini 2.5-pro en
 * préservant sens, faits, structure markdown et liens internes, puis on
 * assainit (tirets, emojis) et on re-lint. On ne met à jour en base QUE si le
 * résultat s'améliore vraiment (zéro violation hard, score en hausse, liens
 * préservés, longueur cohérente). Sinon on garde l'original.
 *
 * Pré-requis dans .env.local : GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL,
 * SUPABASE_SERVICE_ROLE_KEY.
 *
 * Usage :
 *   npx tsx scripts/refresh-anti-ai.ts --dry-run        # lint seul, aucun appel Gemini, aucune écriture
 *   npx tsx scripts/refresh-anti-ai.ts --limit=3        # ne traite que 3 articles (validation)
 *   npx tsx scripts/refresh-anti-ai.ts --lang=fr        # filtre une langue
 *   npx tsx scripts/refresh-anti-ai.ts                  # tout
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { lintAntiAi, sanitizeAntiAi } from '@/src/shared/lint/anti-ai-lint';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GEMINI_KEY = process.env.GEMINI_API_KEY!;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-pro';

const args = process.argv.slice(2);
const getFlag = (n: string) => args.find((a) => a.startsWith(`--${n}=`))?.split('=')[1];
const hasFlag = (n: string) => args.includes(`--${n}`);
const DRY = hasFlag('dry-run');
const LIMIT = getFlag('limit') ? parseInt(getFlag('limit')!, 10) : Infinity;
const LANG = getFlag('lang');

if (!SUPABASE_URL || !SERVICE_KEY || !GEMINI_KEY) {
  console.error('Variables manquantes (.env.local) : NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

// Liens présents dans un texte (HTML <a href> + markdown), pour vérifier qu'on
// ne les perd pas à la réécriture. Le contenu du blog est en HTML.
const linkUrls = (t: string) =>
  [...(t.match(/href=["']([^"']+)["']/gi) || []), ...(t.match(/\]\(([^)]+)\)/g) || [])].sort();

function buildPrompt(title: string, content: string, issues: string[]): string {
  return `Tu es correcteur éditorial francophone. Réécris l'article ci-dessous pour qu'il ne ressemble plus du tout à un texte généré par une IA, SANS changer son sens, ses faits, sa langue (français) ni sa structure.

Le contenu est en HTML. Règles absolues :
- Conserve toute la structure HTML (balises <p>, <h2>, <h3>, <ul>, <li>, <strong>, classes CSS) et SURTOUT tous les liens <a href="...">...</a> exactement à l'identique (mêmes URLs, mêmes ancres). Ne convertis pas en markdown.
- Garde la même longueur approximative et le même plan.
- N'invente aucun fait, chiffre, prix, marque ou nom nouveau. Ne supprime aucune information utile.
- Zéro tiret cadratin (—) ou demi-cadratin (–). Utilise une virgule, un point, deux-points, des parenthèses.
- Zéro emoji.
- Supprime les tournures typiques d'IA : "En effet", "Il est important de noter", "Force est de constater", "N'hésitez pas à", "Plongez dans", "joue un rôle crucial", "incontournable", "au cœur de", "il convient de", "dans cet article nous", etc.
- Varie vraiment la longueur des phrases (mélange de phrases très courtes et de phrases longues). Ton humain, direct, concret, vivant.
- Évite de commencer plusieurs phrases consécutives par les deux mêmes mots.

Problèmes détectés à corriger en priorité : ${issues.join(' ; ') || '(tournures génériques)'}

Réponds UNIQUEMENT avec l'article réécrit en markdown, sans préambule, sans commentaire, sans backticks.

TITRE : ${title}

ARTICLE :
${content}`;
}

async function geminiRewrite(title: string, content: string, issues: string[]): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(240000),
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(title, content, issues) }] }],
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 16384,
          topP: 0.95,
          thinkingConfig: { thinkingBudget: 1024 },
        },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Réponse Gemini vide');
  return text.replace(/^```(?:markdown)?\s*/i, '').replace(/```\s*$/i, '').trim();
}

async function main() {
  let q = sb.from('blog_articles').select('id, title, content, language, anti_ai_score').eq('status', 'published');
  if (LANG) q = q.eq('language', LANG);
  const { data: articles, error } = await q;
  if (error) throw error;

  console.log(`${articles!.length} articles publiés${LANG ? ` (${LANG})` : ''}. Mode: ${DRY ? 'DRY-RUN' : 'ECRITURE'}.\n`);

  let failing = 0, rewritten = 0, improved = 0, skipped = 0, errors = 0, done = 0;

  for (const a of articles!) {
    if (done >= LIMIT) break;
    const before = lintAntiAi(a.content);
    if (before.passed) continue; // déjà bon
    failing++;
    done++;

    const issues = [...new Set(before.violations.filter((v) => v.severity === 'soft').map((v) => v.rule.split(':')[0]))];
    const label = a.title.slice(0, 50);

    if (DRY) {
      console.log(`[FAIL ${before.score}] ${label}  (${issues.join(', ')})`);
      continue;
    }

    try {
      const raw = await geminiRewrite(a.title, a.content, before.violations.slice(0, 6).map((v) => v.rule));
      const clean = sanitizeAntiAi(raw);
      const after = lintAntiAi(clean);

      const lenRatio = clean.length / a.content.length;
      const linksKept = JSON.stringify(linkUrls(clean)) === JSON.stringify(linkUrls(a.content));
      const hardOk = after.violations.filter((v) => v.severity === 'hard').length === 0;

      if (hardOk && after.score > before.score && lenRatio >= 0.6 && lenRatio <= 1.6 && linksKept) {
        rewritten++;
        improved++;
        const { error: upErr } = await sb
          .from('blog_articles')
          .update({ content: clean, anti_ai_score: after.score, updated_at: new Date().toISOString() })
          .eq('id', a.id);
        if (upErr) { errors++; console.log(`[ERR DB] ${label}: ${upErr.message}`); }
        else console.log(`[OK ${before.score}->${after.score}] ${label}`);
      } else {
        skipped++;
        const why = !hardOk ? 'hard restant' : after.score <= before.score ? 'pas mieux' : !linksKept ? 'liens perdus' : 'longueur';
        console.log(`[SKIP ${before.score}->${after.score}] ${label} (${why})`);
      }
    } catch (e) {
      errors++;
      console.log(`[ERR] ${label}: ${(e as Error).message}`);
    }
  }

  console.log(`\n--- Bilan ---`);
  console.log(`Échouants traités: ${failing} | Réécrits et appliqués: ${improved} | Ignorés: ${skipped} | Erreurs: ${errors}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
