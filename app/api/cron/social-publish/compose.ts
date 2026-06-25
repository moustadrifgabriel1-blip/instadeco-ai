import sharp from 'sharp';
import { OVERLAY_PNG_BASE64 } from './overlay-data';

/**
 * Compose un visuel avant/apres "wahou" pour les reseaux : format 4:5 (1080x1350,
 * le plus grand dans le feed Instagram). Piece vide en haut ("avant"), rendu stylise
 * en bas ("apres"), trait or + badges nuit/or (overlay pre-rendu, cf. overlay-data.ts
 * car sharp ne rend pas le texte SVG sur Vercel serverless).
 *
 * Retourne un Buffer JPEG. Leve si une image est inaccessible (l'appelant retombe
 * alors sur la publication simple du rendu).
 */
const W = 1080;
const H = 1350;
const DIV = 6;
const HALF = (H - DIV) / 2; // 672
const AFTER_TOP = HALF + DIV; // 678
const NAVY = '#0B1020';

async function fetchImage(url: string): Promise<Buffer> {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`fetch image ${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function composeBeforeAfter(beforeUrl: string, afterUrl: string): Promise<Buffer> {
  const [beforeRaw, afterRaw] = await Promise.all([fetchImage(beforeUrl), fetchImage(afterUrl)]);
  const overlay = Buffer.from(OVERLAY_PNG_BASE64, 'base64');

  const [top, bottom] = await Promise.all([
    sharp(beforeRaw).resize(W, HALF, { fit: 'cover' }).toBuffer(),
    sharp(afterRaw).resize(W, HALF, { fit: 'cover' }).toBuffer(),
  ]);

  return sharp({ create: { width: W, height: H, channels: 3, background: NAVY } })
    .composite([
      { input: top, top: 0, left: 0 },
      { input: bottom, top: AFTER_TOP, left: 0 },
      { input: overlay, top: 0, left: 0 },
    ])
    .jpeg({ quality: 86 })
    .toBuffer();
}
