/**
 * generate-proof-batch.ts — Génère des avant/après de DÉMONSTRATION via le VRAI
 * moteur du produit (GeminiImageGeneratorService), à partir de photos de pièces
 * vides. But : enrichir les preuves produit du site avec de vrais rendus.
 *
 * Pré-requis .env.local : GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 * Usage : npx tsx scripts/generate-proof-batch.ts
 *
 * Conformité : on n'utilise que des photos sources libres de droits ou du compte
 * démo (RGPD). Les rendus viennent du même modèle que le produit (preuve honnête).
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { GeminiImageGeneratorService } from '@/src/infrastructure/services/gemini/GeminiImageGeneratorService';

interface Job {
  label: string;
  photoUrl: string;
  style: string;
  room: string;
  mode: 'full_redesign' | 'keep_layout' | 'decor_only' | 'home_staging';
}

// Pièce vide du compte démo (RGPD ok). POC : même pièce, styles variés = polyvalence.
const EMPTY_LIVING =
  'https://tocgrsdlegabfkykhdrz.supabase.co/storage/v1/object/public/input-images/f88c9b68-eda4-4d67-bfb4-f631d21b37c6/1781787540154.jpg';

// Set de preuves : la MEME piece vide demo, declinee en styles premium.
// Memes cadrage/structure preserves (moteur Gemini), polyvalence demontree.
const JOBS: Job[] = [
  { label: 'salon-scandinave', photoUrl: EMPTY_LIVING, style: 'scandinave', room: 'salon', mode: 'full_redesign' },
  { label: 'salon-industriel', photoUrl: EMPTY_LIVING, style: 'industriel', room: 'salon', mode: 'full_redesign' },
  { label: 'salon-japandi', photoUrl: EMPTY_LIVING, style: 'japandi', room: 'salon', mode: 'full_redesign' },
  { label: 'salon-midcentury', photoUrl: EMPTY_LIVING, style: 'midcentury', room: 'salon', mode: 'full_redesign' },
  { label: 'salon-minimaliste', photoUrl: EMPTY_LIVING, style: 'minimaliste', room: 'salon', mode: 'full_redesign' },
  { label: 'salon-boheme', photoUrl: EMPTY_LIVING, style: 'boheme', room: 'salon', mode: 'full_redesign' },
];

async function main() {
  const svc = new GeminiImageGeneratorService();
  const out: Array<{ label: string; style: string; room: string; input: string; output: string }> = [];

  for (const j of JOBS) {
    console.log(`\n--- ${j.label} ---`);
    const r = await svc.generate({
      prompt: '',
      controlImageUrl: j.photoUrl,
      styleSlug: j.style,
      roomType: j.room,
      transformMode: j.mode,
    });
    if (r.success) {
      console.log('OK ->', r.data.imageUrl);
      out.push({ label: j.label, style: j.style, room: j.room, input: j.photoUrl, output: r.data.imageUrl });
    } else {
      console.error('FAIL ->', r.error.message);
    }
  }

  console.log('\n=== RESULTATS ===');
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
