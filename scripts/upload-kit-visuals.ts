/**
 * upload-kit-visuals.ts — Heberge les composites avant/apres du kit outbound sur le
 * storage public (bucket output-images, prefixe outbound/) pour pouvoir les integrer
 * en image inline dans les emails (brouillons Gmail).
 *
 * Pre-requis .env.local : NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 * Usage : npx tsx scripts/upload-kit-visuals.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const DIR = path.resolve(process.cwd(), 'outbound-kit');
const FILES = ['test-moderne.jpg', 'salon-japandi.jpg', 'salon-minimaliste.jpg'];

async function main() {
  const out: Record<string, string> = {};
  for (const f of FILES) {
    const p = path.join(DIR, f);
    if (!fs.existsSync(p)) { console.error('absent:', f); continue; }
    const buf = fs.readFileSync(p);
    const dest = `outbound/${f}`;
    const { error } = await admin.storage.from('output-images').upload(dest, buf, { contentType: 'image/jpeg', upsert: true });
    if (error) { console.error('upload echoue', f, error.message); continue; }
    out[f] = admin.storage.from('output-images').getPublicUrl(dest).data.publicUrl;
  }
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
