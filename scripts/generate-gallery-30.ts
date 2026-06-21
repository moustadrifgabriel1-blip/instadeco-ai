/**
 * generate-gallery-30.ts — Génère N rendus de galerie à partir de pièces vides
 * DIFFÉRENTES validées (QA visuelle). Lit /tmp/gallery_sources.json :
 *   [{ "id": "<pexelsId>", "room": "<room_type_slug>", "style": "<style_slug VALIDE>" }, ...]
 * Pour chaque : télécharge la source HD, l'upload sur input-images (compte démo),
 * génère via Gemini (full_redesign), insère une generation `completed` du compte démo.
 *
 * Écrit les IDs des générations créées dans /tmp/gallery_new_ids.json (pour le
 * nettoyage « remplacer les vieilles images »).
 *
 * Usage : npx tsx scripts/generate-gallery-30.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { GeminiImageGeneratorService } from '@/src/infrastructure/services/gemini/GeminiImageGeneratorService';

const DEMO = 'f88c9b68-eda4-4d67-bfb4-f631d21b37c6';
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface Source { id: string; room: string; style: string; }

const srcUrl = (id: string) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1600`;

async function uploadSource(id: string, style: string): Promise<string> {
  const res = await fetch(srcUrl(id));
  if (!res.ok) throw new Error(`download ${id} failed (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  const fpath = `${DEMO}/gallery30-${id}-${style}.jpg`;
  const { error } = await admin.storage
    .from('input-images')
    .upload(fpath, buf, { contentType: 'image/jpeg', upsert: true });
  if (error) throw new Error(`upload failed: ${error.message}`);
  return admin.storage.from('input-images').getPublicUrl(fpath).data.publicUrl;
}

async function main() {
  const sources: Source[] = JSON.parse(
    fs.readFileSync('/tmp/gallery_sources.json', 'utf8'),
  );
  console.log(`Sources a generer : ${sources.length}`);
  const svc = new GeminiImageGeneratorService();
  const newIds: string[] = [];
  let ok = 0;

  for (const s of sources) {
    console.log(`\n--- ${s.style} / ${s.room} (pexels ${s.id}) ---`);
    try {
      const input = await uploadSource(s.id, s.style);
      const r = await svc.generate({
        prompt: '',
        controlImageUrl: input,
        styleSlug: s.style,
        roomType: s.room,
        transformMode: 'full_redesign',
      });
      if (!r.success) { console.error('FAIL generate ->', r.error.message); continue; }
      const { data, error } = await admin
        .from('generations')
        .insert({
          user_id: DEMO,
          style_slug: s.style,
          room_type_slug: s.room,
          input_image_url: input,
          output_image_url: r.data.imageUrl,
          transform_mode: 'full_redesign',
          status: 'completed',
          progress: 100,
          completed_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (error) { console.error('FAIL insert ->', error.message); continue; }
      newIds.push(data.id);
      ok++;
      console.log('OK ->', r.data.imageUrl);
    } catch (e) {
      console.error('THROW ->', e instanceof Error ? e.message : String(e));
    }
  }

  fs.writeFileSync('/tmp/gallery_new_ids.json', JSON.stringify(newIds));
  console.log(`\n=== ${ok}/${sources.length} insérés. IDs -> /tmp/gallery_new_ids.json ===`);
}

main().catch((e) => { console.error(e); process.exit(1); });
