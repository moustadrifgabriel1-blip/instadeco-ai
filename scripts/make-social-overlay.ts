/**
 * make-social-overlay.ts — Genere UNE fois l'overlay PNG (trait or + badges
 * AVANT/APRES) du visuel avant/apres social. On le pre-rend en local (les polices
 * existent ici) puis on l'embarque en base64 dans le code de la route social-publish,
 * car sharp ne rend pas le texte SVG sur le runtime serverless Vercel (pas de fonts).
 *
 * Usage : npx tsx scripts/make-social-overlay.ts
 * Sortie : public/social/before-after-overlay.png (+ le base64 affiche pour copie).
 */
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

const W = 1080;
const H = 1350;
const DIV = 6;
const HALF = (H - DIV) / 2; // 672
const AFTER_TOP = HALF + DIV; // 678

const NAVY = '#0B1020';
const GOLD = '#C9A24A';
const GOLD_TEXT = '#EAD9A8';

function badge(x: number, y: number, label: string): string {
  const w = 232;
  const h = 72;
  return `
    <rect x="${x}" y="${y}" rx="14" ry="14" width="${w}" height="${h}" fill="${NAVY}" fill-opacity="0.82" stroke="${GOLD}" stroke-width="2"/>
    <text x="${x + w / 2}" y="${y + h / 2 + 11}" font-family="Georgia, 'Times New Roman', serif" font-size="32" font-weight="600" letter-spacing="4" fill="${GOLD_TEXT}" text-anchor="middle">${label}</text>`;
}

const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="${HALF}" width="${W}" height="${DIV}" fill="${GOLD}"/>
  ${badge(40, 40, 'AVANT')}
  ${badge(40, AFTER_TOP + 40, 'APRÈS')}
</svg>`;

async function main() {
  const out = path.resolve(process.cwd(), 'public/social/before-after-overlay.png');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  fs.writeFileSync(out, buf);
  console.log(`OK ${out} (${(buf.byteLength / 1024).toFixed(1)} KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
