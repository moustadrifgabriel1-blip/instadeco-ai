import sharp from 'sharp';
import {
  LEGAL_BANNER_W,
  LEGAL_BANNER_H,
  LEGAL_BANNER_PNG_BASE64,
  LEGAL_PAIR_W,
  LEGAL_PAIR_IMG_H,
  LEGAL_PAIR_H,
  LEGAL_PAIR_DIV_X,
  LEGAL_PAIR_DIV_W,
  LEGAL_PAIR_OVERLAY_PNG_BASE64,
} from './legal-overlay-data';

/**
 * Export conforme : la mention « Image virtuellement meublée · Photos non
 * contractuelles » est incrustée dans les pixels (pas un simple calque CSS),
 * pour que l'image reste honnête une fois copiée sur un portail ou une annonce.
 * Overlays pré-rendus (cf. legal-overlay-data.ts), composition sharp uniquement.
 */

const NAVY = '#0B1020';

/**
 * Garde anti-bombe de décompression : une image de quelques centaines de Ko peut
 * se décoder en centaines de Mo (16000x16000 monochrome ≈ 768 Mo en raw) et faire
 * tomber la fonction serverless. 50 Mpx couvre très largement une photo de bien.
 * `.rotate()` sans argument applique l'orientation EXIF (photo de téléphone couchée).
 */
const SHARP_OPTS = { limitInputPixels: 50_000_000, failOn: 'none' as const };

/** Incruste la bannière de mention légale en bas d'un rendu (largeur adaptée). */
export async function addLegalMention(image: Buffer): Promise<Buffer> {
  const source = await sharp(image, SHARP_OPTS).rotate().jpeg({ quality: 95 }).toBuffer();
  const meta = await sharp(source, SHARP_OPTS).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (!width || !height) throw new Error('Image illisible (dimensions absentes)');

  // Ratio d'origine conservé : un plancher en dur écraserait le texte (illisible)
  // sur les images étroites. La bannière reste proportionnelle à la largeur.
  const bannerH = Math.max(1, Math.round((width * LEGAL_BANNER_H) / LEGAL_BANNER_W));
  const banner = await sharp(Buffer.from(LEGAL_BANNER_PNG_BASE64, 'base64'))
    .resize(width, bannerH)
    .png()
    .toBuffer();

  return sharp(source, SHARP_OPTS)
    .composite([{ input: banner, top: Math.max(0, height - bannerH), left: 0 }])
    .jpeg({ quality: 90 })
    .toBuffer();
}

/**
 * Paire avant/après côte à côte (annonce/portail) : photo d'origine à gauche,
 * rendu à droite, trait or, badges AVANT/APRÈS et mention légale en bas.
 */
export async function composeLegalBeforeAfter(before: Buffer, after: Buffer): Promise<Buffer> {
  const overlay = Buffer.from(LEGAL_PAIR_OVERLAY_PNG_BASE64, 'base64');
  const imgW = LEGAL_PAIR_DIV_X;

  const [left, right] = await Promise.all([
    sharp(before, SHARP_OPTS).rotate().resize(imgW, LEGAL_PAIR_IMG_H, { fit: 'cover' }).toBuffer(),
    sharp(after, SHARP_OPTS).rotate().resize(imgW, LEGAL_PAIR_IMG_H, { fit: 'cover' }).toBuffer(),
  ]);

  return sharp({ create: { width: LEGAL_PAIR_W, height: LEGAL_PAIR_H, channels: 3, background: NAVY } })
    .composite([
      { input: left, top: 0, left: 0 },
      { input: right, top: 0, left: imgW + LEGAL_PAIR_DIV_W },
      { input: overlay, top: 0, left: 0 },
    ])
    .jpeg({ quality: 90 })
    .toBuffer();
}
