/**
 * prospect-before-after.ts — Produit un visuel avant/apres BRANDE a partir d'une
 * photo de piece (annonce immo ou piece vide), pour l'outbound agents immobiliers
 * (playbook docs/ACQUISITION_PRO_M4.md). Fork de generate-proof-batch.ts : meme
 * moteur que le produit (GeminiImageGeneratorService) + meme composite que les
 * publications sociales (composeBeforeAfter).
 *
 * Le rendu sort sobre et credible (style par defaut "moderne"), pas tape a l'oeil :
 * le but est qu'un agent se projette sur son bien, pas un effet demo.
 *
 * Pre-requis .env.local : GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 *
 * Usage :
 *   npx tsx scripts/prospect-before-after.ts --url="https://.../piece.jpg" --label=durand
 *   npx tsx scripts/prospect-before-after.ts --url="..." --label=durand --style=japandi --room=chambre
 *   npx tsx scripts/prospect-before-after.ts --batch=scripts/data/prospects-photos.json
 *
 * Le format batch attend un JSON : [{ "label": "durand", "url": "https://...", "style": "moderne", "room": "salon" }, ...]
 *
 * Sortie : un JPEG avant/apres 4:5 brande par entree, dans ./outbound-kit/<label>.jpg
 *
 * Conformite : le before/after sur la photo d'un bien tiers est une demarche B2B
 * (interet legitime). N'utiliser que des photos d'annonces publiquement accessibles.
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
if (process.env.SOCIAL_ENV_FILE) {
  dotenv.config({ path: process.env.SOCIAL_ENV_FILE, override: true });
}

import { createClient } from '@supabase/supabase-js';
import { GeminiImageGeneratorService } from '@/src/infrastructure/services/gemini/GeminiImageGeneratorService';
import { composeBeforeAfter } from '../app/api/cron/social-publish/compose';

// Compte demo (storage RGPD) : on y depose la source pour une URL stable et maitrisee.
const DEMO = 'f88c9b68-eda4-4d67-bfb4-f631d21b37c6';

// Slugs de style VALIDES (cf. presets produit). Sobres en tete pour l'outbound.
const VALID_STYLES = new Set([
  'moderne', 'minimaliste', 'midcentury', 'japandi', 'boheme', 'coastal', 'artdeco', 'classique',
]);

interface Entry {
  label: string;
  url: string;
  style?: string;
  room?: string;
}

const args = process.argv.slice(2);
const flagValue = (name: string) =>
  args.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variable d'environnement manquante : ${name}`);
  return v;
}

const admin = createClient(env('NEXT_PUBLIC_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));

function slugify(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function uploadSource(url: string, label: string): Promise<string> {
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`telechargement source echoue (${res.status}) ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const fpath = `${DEMO}/prospect-${slugify(label)}-${buf.byteLength}.jpg`;
  const { error } = await admin.storage
    .from('input-images')
    .upload(fpath, buf, { contentType: 'image/jpeg', upsert: true });
  if (error) throw new Error(`upload source echoue: ${error.message}`);
  return admin.storage.from('input-images').getPublicUrl(fpath).data.publicUrl;
}

async function processOne(svc: GeminiImageGeneratorService, e: Entry, outDir: string): Promise<{ label: string; out: string } | null> {
  const style = (e.style && VALID_STYLES.has(e.style)) ? e.style : 'moderne';
  const room = e.room || 'salon';
  console.log(`\n--- ${e.label} (${style} / ${room}) ---`);

  const source = await uploadSource(e.url, e.label);
  console.log('source ->', source);

  const r = await svc.generate({
    prompt: '',
    controlImageUrl: source,
    styleSlug: style,
    roomType: room,
    transformMode: 'full_redesign',
  });
  if (!r.success) {
    console.error('ECHEC rendu ->', r.error.message);
    return null;
  }
  console.log('rendu ->', r.data.imageUrl);

  const composite = await composeBeforeAfter(source, r.data.imageUrl);
  const outPath = path.join(outDir, `${slugify(e.label)}.jpg`);
  fs.writeFileSync(outPath, composite);
  console.log('avant/apres ->', outPath);
  return { label: e.label, out: outPath };
}

async function main() {
  const outDir = path.resolve(process.cwd(), flagValue('out') || 'outbound-kit');
  fs.mkdirSync(outDir, { recursive: true });

  let entries: Entry[];
  const batch = flagValue('batch');
  if (batch) {
    entries = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), batch), 'utf8'));
  } else {
    const url = flagValue('url');
    if (!url) throw new Error('Fournir --url=<photo> et --label=<nom>, ou --batch=<fichier.json>');
    entries = [{ label: flagValue('label') || 'prospect', url, style: flagValue('style'), room: flagValue('room') }];
  }

  const svc = new GeminiImageGeneratorService();
  const done: Array<{ label: string; out: string }> = [];
  for (const e of entries) {
    try {
      const r = await processOne(svc, e, outDir);
      if (r) done.push(r);
    } catch (err) {
      console.error(`ERREUR sur ${e.label}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`\n=== ${done.length}/${entries.length} avant/apres generes dans ${outDir} ===`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
