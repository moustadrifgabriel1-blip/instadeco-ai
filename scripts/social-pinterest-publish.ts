/**
 * social-pinterest-publish.ts — Publie un pin avant/apres sur Pinterest (API v5).
 * Reutilise le composite avant/apres (compose.ts) + la legende partagee, comme les
 * publications Meta. Concu pour le VPS (token refresh + flux long), JAMAIS Vercel.
 *
 * Pinterest expire les tokens : access 30 j, refresh 60 j (continu). Les tokens vivent
 * en DB (table oauth_tokens, service-role only) et sont rafraichis proactivement.
 *
 * IMPORTANT : en acces "Trial", les pins sont SANDBOX (visibles par le proprietaire
 * seul). La publication PUBLIQUE exige l'acces "Standard" (revue d'app Pinterest).
 *
 * Usage :
 *   npx tsx scripts/social-pinterest-publish.ts --auth            # imprime l'URL OAuth
 *   npx tsx scripts/social-pinterest-publish.ts --exchange=<code> # echange le code -> tokens en DB
 *   npx tsx scripts/social-pinterest-publish.ts --setup           # resout/cree le board, affiche son id
 *   npx tsx scripts/social-pinterest-publish.ts --dry-run         # compose + upload, ne publie pas
 *   npx tsx scripts/social-pinterest-publish.ts --limit=1         # publie (image)
 *
 * Secrets (.env.local en local, /etc/instadeco-social.env sur le VPS) :
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   PINTEREST_CLIENT_ID, PINTEREST_CLIENT_SECRET, PINTEREST_BOARD_ID (apres --setup),
 *   PINTEREST_REDIRECT_URI (optionnel, defaut https://instadeco.app/pinterest/callback).
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { composeBeforeAfter } from '../app/api/cron/social-publish/compose';
import { buildCaption, buildPinterestTitle } from '../lib/social/caption';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
if (process.env.SOCIAL_ENV_FILE) {
  dotenv.config({ path: process.env.SOCIAL_ENV_FILE, override: true });
}

const DEMO_GALLERY_USER = 'f88c9b68-eda4-4d67-bfb4-f631d21b37c6';
const API = 'https://api.pinterest.com/v5';
const OAUTH_AUTHORIZE = 'https://www.pinterest.com/oauth/';
const SCOPES = 'pins:read,pins:write,boards:read,boards:write';
const REDIRECT_URI = process.env.PINTEREST_REDIRECT_URI || 'https://instadeco.app/pinterest/callback';
const IMAGE_BUCKET = 'output-images';
const PIN_LINK = 'https://instadeco.app/fr/pro';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const flag = (name: string) => args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
const flagValue = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
const limit = Math.max(1, Math.min(5, parseInt(flagValue('limit') || '1', 10) || 1));

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

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number; // secondes
  refresh_token_expires_in?: number;
  scope?: string;
};

// ---------------------------------------------------------------------------
// OAuth (token expirant, persiste en DB)
// ---------------------------------------------------------------------------
function basicAuthHeader(): string {
  const creds = `${env('PINTEREST_CLIENT_ID')}:${env('PINTEREST_CLIENT_SECRET')}`;
  return 'Basic ' + Buffer.from(creds).toString('base64');
}

async function oauthToken(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(`${API}/oauth/token`, {
    method: 'POST',
    headers: { Authorization: basicAuthHeader(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
    signal: AbortSignal.timeout(30_000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) throw new Error(`oauth/token ${res.status}: ${JSON.stringify(json)}`);
  return json as TokenResponse;
}

async function persistTokens(t: TokenResponse, fallbackRefresh?: string): Promise<void> {
  const now = Date.now();
  await admin.from('oauth_tokens').upsert({
    provider: 'pinterest',
    access_token: t.access_token,
    refresh_token: t.refresh_token || fallbackRefresh || '',
    expires_at: new Date(now + t.expires_in * 1000).toISOString(),
    refresh_token_expires_at: t.refresh_token_expires_in
      ? new Date(now + t.refresh_token_expires_in * 1000).toISOString()
      : null,
    scope: t.scope || SCOPES,
    updated_at: new Date(now).toISOString(),
  });
}

async function getValidAccessToken(): Promise<string> {
  const { data, error } = await admin
    .from('oauth_tokens')
    .select('*')
    .eq('provider', 'pinterest')
    .maybeSingle();
  if (error) throw new Error(`lecture oauth_tokens: ${error.message}`);
  if (!data) throw new Error("Aucun token Pinterest en DB. Lance d'abord --auth puis --exchange=<code>.");

  const remaining = new Date(data.expires_at).getTime() - Date.now();
  if (remaining > 3 * 24 * 3600 * 1000) return data.access_token;

  // Refresh proactif (marge 3 j). On persiste le nouveau refresh_token s'il tourne.
  console.log('  token proche de l expiration, refresh...');
  const refreshed = await oauthToken({ grant_type: 'refresh_token', refresh_token: data.refresh_token });
  await persistTokens(refreshed, data.refresh_token);
  return refreshed.access_token;
}

// ---------------------------------------------------------------------------
// Appels API Pinterest (Bearer)
// ---------------------------------------------------------------------------
// GET si pas de body, POST JSON sinon.
async function pinFetch(token: string, pathname: string, body?: unknown): Promise<{ ok: boolean; status: number; json: any }> {
  const res = await fetch(`${API}${pathname}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30_000),
  });
  return { ok: res.ok, status: res.status, json: await res.json().catch(() => ({})) };
}

// ---------------------------------------------------------------------------
// Board (une fois)
// ---------------------------------------------------------------------------
async function resolveBoardId(token: string): Promise<string> {
  if (process.env.PINTEREST_BOARD_ID) return process.env.PINTEREST_BOARD_ID;
  const list = await pinFetch(token, '/boards?page_size=25');
  if (!list.ok) throw new Error(`liste boards ${list.status}: ${JSON.stringify(list.json)}`);
  const wanted = 'Home staging virtuel';
  const existing = (list.json.items || []).find((b: { name?: string }) => b.name === wanted);
  if (existing?.id) return existing.id as string;
  const created = await pinFetch(token, '/boards', { name: wanted, privacy: 'PUBLIC' });
  if (!created.ok || !created.json.id) throw new Error(`creation board ${created.status}: ${JSON.stringify(created.json)}`);
  return created.json.id as string;
}

// ---------------------------------------------------------------------------
// Selection + composite
// ---------------------------------------------------------------------------
async function selectGenerations(platform: string): Promise<GenRow[]> {
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

  const { data: posted } = await admin.from('social_posts').select('generation_id').eq('platform', platform);
  const done = new Set((posted || []).map((p) => p.generation_id));
  return (candidates as GenRow[]).filter((g) => !done.has(g.id)).slice(0, limit);
}

async function composeAndUpload(gen: GenRow): Promise<string> {
  const composite = await composeBeforeAfter(gen.input_image_url as string, gen.output_image_url as string);
  const key = `social/${gen.id}.jpg`;
  const { error } = await admin.storage
    .from(IMAGE_BUCKET)
    .upload(key, composite, { contentType: 'image/jpeg', upsert: true });
  if (error) throw new Error(`upload composite: ${error.message}`);
  return admin.storage.from(IMAGE_BUCKET).getPublicUrl(key).data.publicUrl;
}

// ---------------------------------------------------------------------------
// Anti-doublon : trace pending -> posted/failed (idempotent via UNIQUE)
// ---------------------------------------------------------------------------
async function claim(genId: string, platform: string): Promise<boolean> {
  const { error } = await admin.from('social_posts').insert({ generation_id: genId, platform, status: 'pending' });
  if (error) {
    // Conflit unique = deja pris par un autre run.
    if (error.code === '23505') return false;
    throw new Error(`claim social_posts: ${error.message}`);
  }
  return true;
}

async function finalize(genId: string, platform: string, ok: boolean, externalId: string | null, errMsg: string | null) {
  await admin
    .from('social_posts')
    .update({ status: ok ? 'posted' : 'failed', external_id: externalId, error: errMsg })
    .eq('generation_id', genId)
    .eq('platform', platform);
}

// ---------------------------------------------------------------------------
// Publication image
// ---------------------------------------------------------------------------
async function publishImagePin(token: string, boardId: string, gen: GenRow, imageUrl: string) {
  const room = gen.room_type_slug || 'piece';
  const style = gen.style_slug || '';
  const res = await pinFetch(token, '/pins', {
    board_id: boardId,
    media_source: { source_type: 'image_url', url: imageUrl },
    title: buildPinterestTitle(gen),
    description: buildCaption(gen).slice(0, 800),
    link: PIN_LINK,
    alt_text: `Avant apres home staging virtuel ${room}${style ? ' en style ' + style : ''}`.slice(0, 500),
  });
  if (!res.ok || !res.json.id) return { ok: false as const, error: `pin ${res.status}: ${JSON.stringify(res.json)}` };
  return { ok: true as const, id: res.json.id as string };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  // --auth : imprimer l'URL d'autorisation.
  if (flag('auth')) {
    const url =
      `${OAUTH_AUTHORIZE}?client_id=${encodeURIComponent(env('PINTEREST_CLIENT_ID'))}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=code&scope=${encodeURIComponent(SCOPES)}&state=instadeco`;
    console.log('1. Ouvre cette URL, autorise, puis copie le parametre "code" de l URL de redirection :\n');
    console.log(url + '\n');
    console.log(`2. Relance : npx tsx scripts/social-pinterest-publish.ts --exchange=<code>`);
    console.log(`   (redirect_uri utilise : ${REDIRECT_URI} — doit etre enregistre a l identique dans l app)`);
    return;
  }

  // --exchange=<code> : echanger le code contre des tokens, persister en DB.
  const code = flagValue('exchange');
  if (code) {
    const t = await oauthToken({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI });
    await persistTokens(t);
    console.log(`Tokens Pinterest stockes en DB. Scope: ${t.scope || SCOPES}. Access expire dans ${Math.round(t.expires_in / 86400)} j.`);
    return;
  }

  // --setup : resoudre/creer le board et afficher l'id.
  if (flag('setup')) {
    const token = await getValidAccessToken();
    const boardId = await resolveBoardId(token);
    console.log(`PINTEREST_BOARD_ID=${boardId}`);
    console.log('Ajoute cette ligne dans /etc/instadeco-social.env (et .env.local).');
    return;
  }

  // Publication image.
  const gens = await selectGenerations('pinterest');
  if (!gens.length) {
    console.log('Aucune generation a publier sur Pinterest (tout est deja poste ou rien d eligible).');
    return;
  }

  const token = DRY_RUN ? '' : await getValidAccessToken();
  const boardId = DRY_RUN ? '' : process.env.PINTEREST_BOARD_ID || (await resolveBoardId(token));

  for (const gen of gens) {
    try {
      console.log(`\n[${gen.id}] ${gen.style_slug || '?'} / ${gen.room_type_slug || '?'}`);
      const imageUrl = await composeAndUpload(gen);
      console.log(`  composite uploade: ${imageUrl}`);

      if (DRY_RUN) {
        console.log('  DRY-RUN : pas de publication.');
        console.log(`  titre: ${buildPinterestTitle(gen)}`);
        continue;
      }

      if (!(await claim(gen.id, 'pinterest'))) {
        console.log('  deja pris (claim), skip');
        continue;
      }
      const r = await publishImagePin(token, boardId, gen, imageUrl);
      await finalize(gen.id, 'pinterest', r.ok, r.ok ? r.id : null, r.ok ? null : r.error);
      console.log(`  Pinterest: ${r.ok ? 'OK ' + r.id + ' (sandbox tant que Trial)' : 'ECHEC ' + r.error}`);
    } catch (e) {
      console.error(`  ERREUR ${gen.id}:`, (e as Error).message);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
