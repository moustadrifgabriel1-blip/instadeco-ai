/**
 * make-legal-overlay.ts — Génère UNE fois les 2 overlays PNG de l'export conforme :
 *   1. la bannière « mention légale » (composée en bas d'un rendu seul) ;
 *   2. le gabarit de la paire avant/après (badges AVANT/APRÈS + trait or + bannière).
 *
 * Pré-rendu en local (les polices existent ici) puis embarqué en base64 dans
 * lib/image/legal-overlay-data.ts, car sharp ne rend pas le texte SVG sur le
 * runtime serverless Vercel (pas de fonts). Même technique que make-social-overlay.ts.
 *
 * Usage : npx tsx scripts/make-legal-overlay.ts
 * Sortie : lib/image/legal-overlay-data.ts (écrasé) + PNG de contrôle dans /tmp scratch.
 */
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

const NAVY = '#0B1020';
const GOLD = '#C9A24A';
const GOLD_TEXT = '#EAD9A8';
const MENTION = 'Image virtuellement meublée · Photos non contractuelles';

// Bannière seule : composée en bas d'un rendu (resize à la largeur de l'image).
const BANNER_W = 1608;
const BANNER_H = 64;

// Paire avant/après : 2 images 800x600 + trait or 8px + bannière 64px.
const PAIR_W = 1608;
const PAIR_IMG_H = 600;
const PAIR_H = PAIR_IMG_H + BANNER_H; // 664
const DIV_X = 800;
const DIV_W = 8;

function bannerSvg(width: number, height: number, y = 0): string {
  return `
    <rect x="0" y="${y}" width="${width}" height="${height}" fill="${NAVY}" fill-opacity="0.92"/>
    <text x="${width / 2}" y="${y + height / 2 + 9}" font-family="Helvetica, Arial, sans-serif" font-size="26" letter-spacing="1.5" fill="#EAEAEA" text-anchor="middle">${MENTION}</text>`;
}

function badge(x: number, y: number, label: string): string {
  const w = 176;
  const h = 56;
  return `
    <rect x="${x}" y="${y}" rx="12" ry="12" width="${w}" height="${h}" fill="${NAVY}" fill-opacity="0.82" stroke="${GOLD}" stroke-width="2"/>
    <text x="${x + w / 2}" y="${y + h / 2 + 9}" font-family="Georgia, 'Times New Roman', serif" font-size="26" font-weight="600" letter-spacing="3" fill="${GOLD_TEXT}" text-anchor="middle">${label}</text>`;
}

const bannerOnlySvg = `<svg width="${BANNER_W}" height="${BANNER_H}" xmlns="http://www.w3.org/2000/svg">${bannerSvg(BANNER_W, BANNER_H)}</svg>`;

const pairSvg = `<svg width="${PAIR_W}" height="${PAIR_H}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${DIV_X}" y="0" width="${DIV_W}" height="${PAIR_IMG_H}" fill="${GOLD}"/>
  ${badge(28, 28, 'AVANT')}
  ${badge(DIV_X + DIV_W + 28, 28, 'APRÈS')}
  ${bannerSvg(PAIR_W, BANNER_H, PAIR_IMG_H)}
</svg>`;

async function main() {
  const banner = await sharp(Buffer.from(bannerOnlySvg)).png().toBuffer();
  const pair = await sharp(Buffer.from(pairSvg)).png().toBuffer();

  const out = path.resolve(process.cwd(), 'lib/image/legal-overlay-data.ts');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(
    out,
    `/**
 * Overlays PNG pré-rendus de l'export conforme (mention légale). NE PAS éditer à
 * la main : regénérer via \`npx tsx scripts/make-legal-overlay.ts\` (sharp ne rend
 * pas le texte SVG sur Vercel serverless, d'où le pré-rendu local embarqué).
 */
export const LEGAL_BANNER_W = ${BANNER_W};
export const LEGAL_BANNER_H = ${BANNER_H};
export const LEGAL_BANNER_PNG_BASE64 =
  '${banner.toString('base64')}';

export const LEGAL_PAIR_W = ${PAIR_W};
export const LEGAL_PAIR_IMG_H = ${PAIR_IMG_H};
export const LEGAL_PAIR_H = ${PAIR_H};
export const LEGAL_PAIR_DIV_X = ${DIV_X};
export const LEGAL_PAIR_DIV_W = ${DIV_W};
export const LEGAL_PAIR_OVERLAY_PNG_BASE64 =
  '${pair.toString('base64')}';
`,
  );
  console.log(`OK ${out} (banner ${(banner.byteLength / 1024).toFixed(1)} KB, pair ${(pair.byteLength / 1024).toFixed(1)} KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
