/**
 * generate-proof-batch.ts — Génère des avant/après de DÉMONSTRATION via le VRAI
 * moteur du produit (GeminiImageGeneratorService), à partir de photos de pièces
 * VIDES DIFFÉRENTES (full HD, libres de droits Pexels). But : enrichir les
 * preuves produit du site avec de vrais rendus, sur des pièces variées.
 *
 * Pré-requis .env.local : GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 * Usage : npx tsx scripts/generate-proof-batch.ts
 *
 * Conformité : sources = photos de pièces vides libres de droits (Pexels), aucune
 * photo d'utilisateur réel. Les rendus viennent du même modèle que le produit.
 * Les sources sont re-uploadées sur notre storage (input-images du compte démo)
 * pour des URLs stables et maîtrisées.
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { GeminiImageGeneratorService } from '@/src/infrastructure/services/gemini/GeminiImageGeneratorService';

const DEMO = 'f88c9b68-eda4-4d67-bfb4-f631d21b37c6';
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface Source {
  label: string;
  url: string; // photo de pièce vide full HD (Pexels)
  style: string; // slug VALIDE (cf. contrainte DB)
  room: string;
}

// Pièces vides DIFFÉRENTES, une par rendu, un style premium chacune.
const SOURCES: Source[] = [
  { label: 'japandi', url: 'https://images.pexels.com/photos/8146330/pexels-photo-8146330.jpeg?auto=compress&cs=tinysrgb&w=1600', style: 'japandi', room: 'salon' },
  { label: 'midcentury', url: 'https://images.pexels.com/photos/3935327/pexels-photo-3935327.jpeg?auto=compress&cs=tinysrgb&w=1600', style: 'midcentury', room: 'salon' },
  { label: 'minimaliste', url: 'https://images.pexels.com/photos/8146213/pexels-photo-8146213.jpeg?auto=compress&cs=tinysrgb&w=1600', style: 'minimaliste', room: 'salon' },
  { label: 'moderne', url: 'https://images.pexels.com/photos/7031621/pexels-photo-7031621.jpeg?auto=compress&cs=tinysrgb&w=1600', style: 'moderne', room: 'salon' },
];

async function uploadSource(url: string, label: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download source failed (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  const fpath = `${DEMO}/proof-${label}-${buf.byteLength}.jpg`;
  const { error } = await admin.storage
    .from('input-images')
    .upload(fpath, buf, { contentType: 'image/jpeg', upsert: true });
  if (error) throw new Error(`upload failed: ${error.message}`);
  return admin.storage.from('input-images').getPublicUrl(fpath).data.publicUrl;
}

async function main() {
  const svc = new GeminiImageGeneratorService();
  const out: Array<{ label: string; style: string; room: string; input: string; output: string }> = [];

  for (const s of SOURCES) {
    console.log(`\n--- ${s.label} (${s.style}) ---`);
    const input = await uploadSource(s.url, s.label);
    console.log('source uploaded ->', input);
    const r = await svc.generate({
      prompt: '',
      controlImageUrl: input,
      styleSlug: s.style,
      roomType: s.room,
      transformMode: 'full_redesign',
    });
    if (r.success) {
      console.log('OK ->', r.data.imageUrl);
      out.push({ label: s.label, style: s.style, room: s.room, input, output: r.data.imageUrl });
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
