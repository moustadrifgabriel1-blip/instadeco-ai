/**
 * generate-gallery-batch.ts — Alimente la galerie publique avec de vrais rendus
 * avant/apres, a partir de pieces VIDES DIFFERENTES (full HD, libres de droits
 * Pexels, QA visuelle faite). Genere via le VRAI moteur (GeminiImageGeneratorService)
 * et INSERE chaque rendu comme une generation `completed` du compte demo.
 *
 * Conformite : sources = pieces vides stock (Pexels), aucune photo d'utilisateur.
 * input_image_url n'est PAS affichee par la galerie (elle ne montre que le rendu).
 * Slugs de style VALIDES uniquement (contrainte DB).
 *
 * Usage : npx tsx scripts/generate-gallery-batch.ts
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
  pexelsId: string;
  style: string; // slug VALIDE
  room: string; // room_type_slug
}

// 6 pieces vides DIFFERENTES (QA visuelle OK), un style premium chacune.
const SOURCES: Source[] = [
  { pexelsId: '803908', style: 'minimaliste', room: 'salon' },
  { pexelsId: '6835105', style: 'classique', room: 'salle-a-manger' },
  { pexelsId: '8146207', style: 'japandi', room: 'bureau' },
  { pexelsId: '8146337', style: 'midcentury', room: 'salon' },
  { pexelsId: '3958955', style: 'coastal', room: 'salon' },
  { pexelsId: '4030075', style: 'boheme', room: 'salon' },
];

const srcUrl = (id: string) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1600`;

async function uploadSource(id: string, style: string): Promise<string> {
  const res = await fetch(srcUrl(id));
  if (!res.ok) throw new Error(`download ${id} failed (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  const fpath = `${DEMO}/gallery-${style}-${buf.byteLength}.jpg`;
  const { error } = await admin.storage
    .from('input-images')
    .upload(fpath, buf, { contentType: 'image/jpeg', upsert: true });
  if (error) throw new Error(`upload failed: ${error.message}`);
  return admin.storage.from('input-images').getPublicUrl(fpath).data.publicUrl;
}

async function main() {
  const svc = new GeminiImageGeneratorService();
  let ok = 0;

  for (const s of SOURCES) {
    console.log(`\n--- ${s.style} / ${s.room} (pexels ${s.pexelsId}) ---`);
    try {
      const input = await uploadSource(s.pexelsId, s.style);
      const r = await svc.generate({
        prompt: '',
        controlImageUrl: input,
        styleSlug: s.style,
        roomType: s.room,
        transformMode: 'full_redesign',
      });
      if (!r.success) {
        console.error('FAIL generate ->', r.error.message);
        continue;
      }
      const { error } = await admin.from('generations').insert({
        user_id: DEMO,
        style_slug: s.style,
        room_type_slug: s.room,
        input_image_url: input,
        output_image_url: r.data.imageUrl,
        transform_mode: 'full_redesign',
        status: 'completed',
        progress: 100,
        completed_at: new Date().toISOString(),
      });
      if (error) {
        console.error('FAIL insert ->', error.message);
        continue;
      }
      ok++;
      console.log('OK ->', r.data.imageUrl);
    } catch (e) {
      console.error('THROW ->', e instanceof Error ? e.message : String(e));
    }
  }

  console.log(`\n=== ${ok}/${SOURCES.length} insérés en galerie ===`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
