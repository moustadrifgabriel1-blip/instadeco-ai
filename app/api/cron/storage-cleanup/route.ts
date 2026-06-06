import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin-client';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * CRON: Storage Cleanup
 *
 * Purge les buckets Supabase Storage pour rester dans le free tier (1 GB).
 *
 * 1. Supprime les objets de `input-images` plus vieux que INPUT_RETENTION_DAYS
 *    (les inputs ne servent qu'a la generation initiale).
 * 2. Supprime les outputs orphelins de `output-images` (aucune generation
 *    associee en DB) plus vieux que ORPHAN_RETENTION_DAYS.
 *
 * PRUDENCE: ne supprime jamais un output dont l'URL est referencee par une
 * generation existante.
 *
 * Frequence: hebdomadaire (dimanche 4h). Protege par CRON_SECRET.
 */

const INPUT_RETENTION_DAYS = 30;
const ORPHAN_RETENTION_DAYS = 30;
const PAGE_SIZE = 1000;

interface StorageObject {
  name: string;
  created_at: string | null;
}

/** Liste recursivement tous les objets d'un bucket (a plat). */
async function listAllObjects(bucket: string): Promise<StorageObject[]> {
  const results: StorageObject[] = [];

  // Liste les "dossiers" de premier niveau puis leur contenu, plus la racine.
  async function walk(prefix: string): Promise<void> {
    let offset = 0;
    for (;;) {
      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .list(prefix, { limit: PAGE_SIZE, offset });
      if (error) throw new Error(`list(${bucket}/${prefix}): ${error.message}`);
      if (!data || data.length === 0) break;

      for (const entry of data) {
        const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
        // Un "dossier" (pas un fichier) n'a pas de metadata.
        if (entry.id === null || entry.metadata == null) {
          await walk(fullPath);
        } else {
          results.push({
            name: fullPath,
            created_at: entry.created_at ?? null,
          });
        }
      }

      if (data.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }
  }

  await walk('');
  return results;
}

function isOlderThan(createdAt: string | null, days: number): boolean {
  if (!createdAt) return false; // par prudence, on ne touche pas sans date
  const ageMs = Date.now() - new Date(createdAt).getTime();
  return ageMs > days * 24 * 60 * 60 * 1000;
}

async function removeInBatches(bucket: string, paths: string[]): Promise<number> {
  let removed = 0;
  for (let i = 0; i < paths.length; i += PAGE_SIZE) {
    const batch = paths.slice(i, i + PAGE_SIZE);
    const { error } = await supabaseAdmin.storage.from(bucket).remove(batch);
    if (error) throw new Error(`remove(${bucket}): ${error.message}`);
    removed += batch.length;
  }
  return removed;
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // --- 1. Purge des inputs anciens ---
    const inputObjects = await listAllObjects('input-images');
    const inputsToDelete = inputObjects
      .filter((o) => isOlderThan(o.created_at, INPUT_RETENTION_DAYS))
      .map((o) => o.name);
    const inputsRemoved = await removeInBatches('input-images', inputsToDelete);

    // --- 2. Purge des outputs orphelins ---
    // On recupere toutes les URLs d'output referencees en DB pour ne JAMAIS
    // supprimer un fichier lie a une generation existante.
    const { data: generations, error: genError } = await supabaseAdmin
      .from('generations')
      .select('output_image_url')
      .not('output_image_url', 'is', null);

    let outputsRemoved = 0;
    let outputsOrphan = 0;

    if (genError) {
      // En cas d'erreur DB on s'abstient de toucher aux outputs (securite).
      return NextResponse.json({
        success: true,
        inputsRemoved,
        outputsRemoved: 0,
        warning: `Skipped output cleanup: ${genError.message}`,
      });
    }

    // Ensemble des "basenames" referencees (dernier segment de chemin/URL).
    const referenced = new Set<string>();
    for (const row of generations ?? []) {
      const url = (row as { output_image_url: string | null }).output_image_url;
      if (!url) continue;
      const clean = url.split('?')[0];
      const base = clean.substring(clean.lastIndexOf('/') + 1);
      if (base) referenced.add(base);
    }

    const outputObjects = await listAllObjects('output-images');
    const outputsToDelete: string[] = [];
    for (const obj of outputObjects) {
      const base = obj.name.substring(obj.name.lastIndexOf('/') + 1);
      const orphan = !referenced.has(base);
      if (orphan && isOlderThan(obj.created_at, ORPHAN_RETENTION_DAYS)) {
        outputsOrphan += 1;
        outputsToDelete.push(obj.name);
      }
    }
    outputsRemoved = await removeInBatches('output-images', outputsToDelete);

    return NextResponse.json({
      success: true,
      inputsRemoved,
      outputsOrphan,
      outputsRemoved,
      inputRetentionDays: INPUT_RETENTION_DAYS,
      orphanRetentionDays: ORPHAN_RETENTION_DAYS,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
