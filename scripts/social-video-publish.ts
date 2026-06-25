/**
 * social-video-publish.ts — Publie une video avant/apres (Reel Instagram + video
 * Facebook) a partir d'un rendu de la galerie demo. Concu pour tourner sur le VPS
 * Hetzner (ffmpeg statique), JAMAIS sur Vercel (encodage video + polling Meta jusqu'a
 * 5 min, hors limite serverless 60s).
 *
 * Pipeline : selection generation demo -> download avant/apres -> ffmpeg (volet dore
 * 4:5) -> upload Supabase (bucket public) -> Reel IG (conteneur REELS + polling +
 * publish) + video FB (/videos file_url + polling) -> trace social_posts -> cleanup.
 *
 * Conformite : compte demo RGPD uniquement (f88c9b68-...), donnees reelles, anti-doublon
 * via social_posts (platform 'instagram_reel' / 'facebook_video').
 *
 * Usage :
 *   npx tsx scripts/social-video-publish.ts --limit=1
 *   npx tsx scripts/social-video-publish.ts --dry-run   (rend + upload, ne publie PAS)
 *
 * Secrets requis (.env.local en local, /etc/instadeco-cron.env sur le VPS) :
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   META_PAGE_ACCESS_TOKEN, META_IG_USER_ID, META_FB_PAGE_ID.
 * ffmpeg : via FFMPEG_PATH (defaut 'ffmpeg' sur le PATH ; VPS = /opt/instadeco/bin/ffmpeg).
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { spawn } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import { buildCaption } from '../lib/social/caption';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const DEMO_GALLERY_USER = 'f88c9b68-eda4-4d67-bfb4-f631d21b37c6';
const GRAPH_VERSION = 'v21.0'; // aligne sur la route image (validee en prod)
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;
const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';
const VIDEO_BUCKET = 'social-video';
const W = 1080;
const H = 1350; // 4:5

// Polling Meta : 6 essais x 60s = 5 min max (le VPS n'a pas la limite 60s de Vercel).
const POLL_TRIES = 6;
const POLL_INTERVAL_MS = 60_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const limit = Math.max(
  1,
  Math.min(5, parseInt(args.find((a) => a.startsWith('--limit='))?.split('=')[1] || '1', 10) || 1),
);

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variable d'environnement manquante : ${name}`);
  return v;
}

const admin = createClient(env('NEXT_PUBLIC_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));

type GenRow = {
  id: string;
  style_slug: string | null;
  room_type_slug: string | null;
  input_image_url: string | null;
  output_image_url: string | null;
};

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------
async function selectGenerations(): Promise<GenRow[]> {
  const { data: candidates, error } = await admin
    .from('generations')
    .select('id, style_slug, room_type_slug, input_image_url, output_image_url')
    .eq('status', 'completed')
    .eq('user_id', DEMO_GALLERY_USER)
    .not('input_image_url', 'is', null)
    .not('output_image_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(60);
  if (error) throw new Error(`select generations: ${error.message}`);

  const { data: posted } = await admin
    .from('social_posts')
    .select('generation_id')
    .eq('platform', 'instagram_reel');
  const done = new Set((posted || []).map((p) => p.generation_id));

  return (candidates as GenRow[]).filter((g) => !done.has(g.id)).slice(0, limit);
}

// ---------------------------------------------------------------------------
// Download
// ---------------------------------------------------------------------------
async function download(url: string, dest: string): Promise<void> {
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`download ${res.status} ${url}`);
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

// ---------------------------------------------------------------------------
// Encodage ffmpeg (volet dore -> fallback crossfade)
// ---------------------------------------------------------------------------
function filterGraph(transition: 'wiperight' | 'fade'): string {
  const base =
    `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,fps=30,format=yuv420p[b];` +
    `[1:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,fps=30,format=yuv420p[a];` +
    `[b][a]xfade=transition=${transition}:duration=2:offset=1.5[xf]`;
  if (transition === 'wiperight') {
    // Barre doree (#C9A24A) qui suit le front du volet, puis correctif full-range->tv.
    return (
      base +
      `;color=c=0xC9A24A:s=6x${H}:d=6.5[bar];` +
      `[xf][bar]overlay=x='(t-1.5)/2*${W}-3':y=0:eval=frame:shortest=1,` +
      `scale=out_range=tv:out_color_matrix=bt709,format=yuv420p[v]`
    );
  }
  return base + `;[xf]scale=out_range=tv:out_color_matrix=bt709,format=yuv420p[v]`;
}

function runFfmpeg(beforePath: string, afterPath: string, outPath: string, transition: 'wiperight' | 'fade'): Promise<void> {
  const ff = [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-loop', '1', '-t', '3.5', '-i', beforePath,
    '-loop', '1', '-t', '5.0', '-i', afterPath,
    '-f', 'lavfi', '-t', '7', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
    '-filter_complex', filterGraph(transition),
    '-map', '[v]', '-map', '2:a', '-t', '6.5',
    '-c:v', 'libx264', '-profile:v', 'high', '-level', '4.0', '-pix_fmt', 'yuv420p', '-color_range', 'tv',
    '-c:a', 'aac', '-b:a', '128k', '-ac', '2', '-ar', '44100', '-movflags', '+faststart',
    outPath,
  ];
  return new Promise((resolve, reject) => {
    const p = spawn(FFMPEG, ff);
    let stderr = '';
    p.stderr.on('data', (d) => (stderr += d.toString()));
    p.on('error', reject);
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg ${code}: ${stderr.slice(-500)}`))));
  });
}

async function renderVideo(beforePath: string, afterPath: string, outPath: string): Promise<'wiperight' | 'fade'> {
  try {
    await runFfmpeg(beforePath, afterPath, outPath, 'wiperight');
    return 'wiperight';
  } catch (e) {
    console.warn('  volet dore indisponible, fallback crossfade:', (e as Error).message);
    await runFfmpeg(beforePath, afterPath, outPath, 'fade');
    return 'fade';
  }
}

// ---------------------------------------------------------------------------
// Upload Supabase (URL publique pour Meta)
// ---------------------------------------------------------------------------
async function uploadVideo(genId: string, outPath: string): Promise<string> {
  const buf = fs.readFileSync(outPath);
  const key = `${genId}.mp4`;
  const { error } = await admin.storage
    .from(VIDEO_BUCKET)
    .upload(key, buf, { contentType: 'video/mp4', upsert: true });
  if (error) throw new Error(`upload video: ${error.message}`);
  return admin.storage.from(VIDEO_BUCKET).getPublicUrl(key).data.publicUrl;
}

// ---------------------------------------------------------------------------
// Publication Meta
// ---------------------------------------------------------------------------
type PublishResult = { ok: true; id: string } | { ok: false; error: string };

async function postForm(url: string, params: Record<string, string>): Promise<{ ok: boolean; json: any }> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
    signal: AbortSignal.timeout(30_000),
  });
  return { ok: res.ok, json: await res.json().catch(() => ({})) };
}

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  return res.json().catch(() => ({}));
}

async function publishInstagramReel(igUserId: string, token: string, videoUrl: string, caption: string): Promise<PublishResult> {
  // 1. Conteneur REELS.
  const container = await postForm(`${GRAPH}/${igUserId}/media`, {
    media_type: 'REELS',
    video_url: videoUrl,
    caption,
    share_to_feed: 'true',
    access_token: token,
  });
  if (!container.ok || !container.json.id) return { ok: false, error: `container: ${JSON.stringify(container.json)}` };
  const creationId = container.json.id as string;

  // 2. Polling jusqu'a FINISHED.
  for (let i = 0; i < POLL_TRIES; i++) {
    await sleep(POLL_INTERVAL_MS);
    const st = await getJson(`${GRAPH}/${creationId}?fields=status_code,status&access_token=${encodeURIComponent(token)}`);
    const code = st?.status_code;
    if (code === 'FINISHED') break;
    if (code === 'ERROR' || code === 'EXPIRED') return { ok: false, error: `status ${code}: ${st?.status || ''}` };
    if (i === POLL_TRIES - 1) return { ok: false, error: `timeout polling (dernier status_code=${code})` };
  }

  // 3. Publication.
  const pub = await postForm(`${GRAPH}/${igUserId}/media_publish`, { creation_id: creationId, access_token: token });
  if (!pub.ok || !pub.json.id) return { ok: false, error: `publish: ${JSON.stringify(pub.json)}` };
  return { ok: true, id: pub.json.id as string };
}

async function publishFacebookVideo(pageId: string, token: string, videoUrl: string, caption: string): Promise<PublishResult> {
  const res = await postForm(`${GRAPH}/${pageId}/videos`, {
    file_url: videoUrl,
    description: caption,
    access_token: token,
  });
  if (!res.ok || !res.json.id) return { ok: false, error: `videos: ${JSON.stringify(res.json)}` };
  const videoId = res.json.id as string;

  // Confirmation best-effort (FB publie en asynchrone ; on logue le statut sans bloquer le succes).
  for (let i = 0; i < POLL_TRIES; i++) {
    await sleep(POLL_INTERVAL_MS);
    const st = await getJson(`${GRAPH}/${videoId}?fields=status&access_token=${encodeURIComponent(token)}`);
    const vs = st?.status?.video_status;
    if (vs === 'ready') break;
    if (vs === 'error') return { ok: false, error: `video_status error: ${JSON.stringify(st?.status)}` };
    if (i === POLL_TRIES - 1) console.warn(`  FB video ${videoId} pas encore 'ready' (status=${vs}), traitement continue cote Meta`);
  }
  return { ok: true, id: videoId };
}

async function recordPost(genId: string, platform: 'instagram_reel' | 'facebook_video', r: PublishResult): Promise<void> {
  await admin.from('social_posts').insert({
    generation_id: genId,
    platform,
    status: r.ok ? 'posted' : 'failed',
    external_id: r.ok ? r.id : null,
    error: r.ok ? null : r.error,
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  if (FFMPEG !== 'ffmpeg' && !fs.existsSync(FFMPEG)) {
    console.error(`ffmpeg introuvable a ${FFMPEG} (FFMPEG_PATH). Abandon sans erreur.`);
    return;
  }

  const gens = await selectGenerations();
  if (!gens.length) {
    console.log('Aucune generation video a publier (tout est deja poste ou rien d eligible).');
    return;
  }

  const token = DRY_RUN ? '' : env('META_PAGE_ACCESS_TOKEN');
  const igUserId = DRY_RUN ? '' : env('META_IG_USER_ID');
  const fbPageId = DRY_RUN ? '' : env('META_FB_PAGE_ID');

  for (const gen of gens) {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `instadeco-video-${gen.id}-`));
    const beforePath = path.join(tmp, 'before.jpg');
    const afterPath = path.join(tmp, 'after.jpg');
    const outPath = path.join(tmp, 'out.mp4');
    try {
      console.log(`\n[${gen.id}] ${gen.style_slug || '?'} / ${gen.room_type_slug || '?'}`);
      await download(gen.input_image_url as string, beforePath);
      await download(gen.output_image_url as string, afterPath);

      const effet = await renderVideo(beforePath, afterPath, outPath);
      const sizeKo = (fs.statSync(outPath).size / 1024).toFixed(0);
      console.log(`  video rendue (${effet}, ${sizeKo} Ko)`);

      const videoUrl = await uploadVideo(gen.id, outPath);
      console.log(`  uploadee: ${videoUrl}`);

      const caption = buildCaption(gen);

      if (DRY_RUN) {
        console.log('  DRY-RUN : pas de publication. Legende :');
        console.log(caption.split('\n').map((l) => '    ' + l).join('\n'));
        continue;
      }

      const ig = await publishInstagramReel(igUserId, token, videoUrl, caption);
      console.log(`  Instagram Reel: ${ig.ok ? 'OK ' + ig.id : 'ECHEC ' + ig.error}`);
      await recordPost(gen.id, 'instagram_reel', ig);

      const fb = await publishFacebookVideo(fbPageId, token, videoUrl, caption);
      console.log(`  Facebook video: ${fb.ok ? 'OK ' + fb.id : 'ECHEC ' + fb.error}`);
      await recordPost(gen.id, 'facebook_video', fb);
    } catch (e) {
      console.error(`  ERREUR ${gen.id}:`, (e as Error).message);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
