/**
 * Générateur pSEO : crée des pages longue traîne (pièce x style x contrainte)
 * en statut 'draft'. Contenu unique par page (Gemini 3.1-pro) passé par le gate
 * anti-IA. Idempotent (saute les combos déjà en base). Publication ensuite au
 * compte-gouttes via le cron /api/cron/pseo-publish.
 *
 * Pré-requis .env.local : GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 *
 * Usage :
 *   npx tsx scripts/generate-pseo-batch.ts --dry-run        # liste les combos manquants
 *   npx tsx scripts/generate-pseo-batch.ts --limit=20       # genere 20 brouillons (defaut 20)
 *   npx tsx scripts/generate-pseo-batch.ts --limit=648      # tout
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { ROOM_TYPES } from '@/src/shared/constants/styles';
import { STYLES } from '@/src/shared/constants/styles';
import { lintAntiAi, sanitizeAntiAi } from '@/src/shared/lint/anti-ai-lint';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GEMINI_KEY = process.env.GEMINI_API_KEY!;
const MODEL = process.env.GEMINI_PSEO_MODEL || 'gemini-3.1-pro-preview';

const args = process.argv.slice(2);
const getFlag = (n: string) => args.find((a) => a.startsWith(`--${n}=`))?.split('=')[1];
const DRY = args.includes('--dry-run');
const LIMIT = getFlag('limit') ? parseInt(getFlag('limit')!, 10) : 20;

if (!SUPABASE_URL || !SERVICE_KEY || !GEMINI_KEY) {
  console.error('Variables manquantes (.env.local).');
  process.exit(1);
}
const sb = createClient(SUPABASE_URL, SERVICE_KEY);

// Contraintes longue traîne, applicables à toutes les pièces.
const CONSTRAINTS: Array<{ label: string; slug: string; phrase: string }> = [
  { label: 'petite surface', slug: 'petite-surface', phrase: 'aménager une petite surface' },
  { label: 'petit budget', slug: 'petit-budget', phrase: 'à petit budget' },
  { label: 'peu de lumière', slug: 'peu-de-lumiere', phrase: 'quand on manque de lumière' },
  { label: 'en location', slug: 'en-location', phrase: 'en location, sans percer' },
  { label: 'sans gros travaux', slug: 'sans-gros-travaux', phrase: 'sans gros travaux' },
  { label: 'pour une famille', slug: 'pour-une-famille', phrase: 'pour toute la famille' },
];

// Styles SEO (on exclut 'original' qui n'est pas un style de destination).
const PSEO_STYLES = STYLES.filter((s) => s.slug !== 'original');

function buildCombos() {
  const combos: Array<{ slug: string; room: string; style: string; constraint: typeof CONSTRAINTS[number]; roomName: string; styleName: string }> = [];
  for (const room of ROOM_TYPES) {
    for (const style of PSEO_STYLES) {
      for (const c of CONSTRAINTS) {
        combos.push({
          slug: `${room.slug}-${style.slug}-${c.slug}`,
          room: room.slug,
          style: style.slug,
          constraint: c,
          roomName: room.name,
          styleName: style.name,
        });
      }
    }
  }
  return combos;
}

async function geminiParagraph(roomName: string, styleName: string, constraintLabel: string, strict = false): Promise<string> {
  const prompt = `Rédige un paragraphe UNIQUE de 80 mots environ, en français, donnant 3 conseils d'expert concrets et actionnables pour aménager un(e) ${roomName.toLowerCase()} de style ${styleName} avec la contrainte suivante : ${constraintLabel}.
Ton humain, direct, concret. Varie la longueur des phrases.
Interdits absolus : aucun tiret cadratin ou demi-cadratin, aucun emoji, aucune tournure générique d'IA (pas de "En effet", "il est important de noter", "incontournable", "au cœur de", "n'hésitez pas").${strict ? ' Sois encore plus naturel et direct, comme un architecte qui parle à un client.' : ''}
Réponds UNIQUEMENT avec le paragraphe, sans titre, sans préambule, sans guillemets.`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(120000),
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      // thinkingBudget 512 : en dessous, gemini-3.1-pro renvoie parfois une
      // sortie vide/tronquée (le thinking consomme tout). 512 est fiable et
      // reste raisonnable pour un paragraphe court.
      generationConfig: { temperature: 0.9, maxOutputTokens: 2000, topP: 0.95, thinkingConfig: { thinkingBudget: 512 } },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Réponse vide');
  return text.trim();
}

async function main() {
  const combos = buildCombos();
  const { data: existing, error } = await sb.from('pseo_pages').select('slug');
  if (error) throw error;
  const have = new Set((existing || []).map((r) => r.slug));
  const todo = combos.filter((c) => !have.has(c.slug));

  console.log(`${combos.length} combos possibles, ${have.size} en base, ${todo.length} a generer. Modele: ${MODEL}. Mode: ${DRY ? 'DRY-RUN' : 'ECRITURE'}. Limite: ${LIMIT}.\n`);

  let done = 0, saved = 0, skipped = 0, errors = 0;
  for (const c of todo) {
    if (done >= LIMIT) break;
    done++;
    if (DRY) { console.log(`[TODO] ${c.slug}`); continue; }

    try {
      let para = sanitizeAntiAi(await geminiParagraph(c.roomName, c.styleName, c.constraint.label));
      let verdict = lintAntiAi(para);
      // Retente si le gate échoue OU si la réponse est trop courte (sortie tronquée).
      if (!verdict.passed || para.length < 200) {
        para = sanitizeAntiAi(await geminiParagraph(c.roomName, c.styleName, c.constraint.label, true));
        verdict = lintAntiAi(para);
      }
      if (!verdict.passed || para.length < 200) {
        skipped++;
        console.log(`[SKIP ${verdict.score}] ${c.slug} (gate anti-IA)`);
        continue;
      }

      const h1 = `${c.roomName} ${c.styleName}, ${c.constraint.phrase}`;
      const meta = sanitizeAntiAi(`Conseils pour aménager un ${c.roomName.toLowerCase()} style ${c.styleName.toLowerCase()} ${c.constraint.phrase}. Visualisez le rendu sur votre pièce avec l'IA, essai gratuit.`).slice(0, 160);

      const { error: insErr } = await sb.from('pseo_pages').insert({
        slug: c.slug, locale: 'fr', room: c.room, style: c.style, constraint: c.constraint.label,
        h1_title: h1, meta_description: meta, unique_seo_text: para, anti_ai_score: verdict.score, status: 'draft',
      });
      if (insErr) { errors++; console.log(`[ERR DB] ${c.slug}: ${insErr.message}`); }
      else { saved++; console.log(`[OK ${verdict.score}] ${c.slug}`); }
    } catch (e) {
      errors++;
      console.log(`[ERR] ${c.slug}: ${(e as Error).message}`);
    }
  }

  console.log(`\n--- Bilan ---\nTraites: ${done} | Brouillons crees: ${saved} | Ignores: ${skipped} | Erreurs: ${errors}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
