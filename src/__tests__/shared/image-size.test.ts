/**
 * Tests de validation magic-bytes et de dimensionnement (src/shared/utils/image-size.ts).
 *
 * On construit des en-têtes binaires PNG/JPEG minimaux pour vérifier que la
 * détection repose bien sur les MAGIC BYTES (et non sur le préfixe data: URI
 * falsifiable), et que l'orientation source est préservée.
 */
import { describe, it, expect } from 'vitest';
import {
  isSupportedImageBase64,
  getImageDimensionsFromBase64,
  getOptimalImageSize,
  getFalImageSizeFromBase64,
} from '@/src/shared/utils/image-size';

/** Construit un en-tête PNG valide avec largeur/hauteur données. */
function pngBase64(width: number, height: number): string {
  const buf = Buffer.alloc(24);
  buf.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0); // signature
  buf.writeUInt32BE(13, 8); // longueur chunk IHDR
  buf.set([0x49, 0x48, 0x44, 0x52], 12); // "IHDR"
  buf.writeUInt32BE(width, 16);
  buf.writeUInt32BE(height, 20);
  return buf.toString('base64');
}

/** Construit un en-tête JPEG minimal (SOF0) avec largeur/hauteur données. */
function jpegBase64(width: number, height: number): string {
  const buf = Buffer.alloc(20); // ≥12 octets pour le check magic-bytes (head.length >= 12)
  buf.set([0xff, 0xd8], 0); // SOI
  buf.set([0xff, 0xc0], 2); // SOF0
  buf.writeUInt16BE(17, 4); // longueur segment
  buf[6] = 8; // précision
  buf.writeUInt16BE(height, 7);
  buf.writeUInt16BE(width, 9);
  return buf.toString('base64');
}

describe('isSupportedImageBase64 (magic bytes)', () => {
  it('accepte un vrai PNG', () => {
    expect(isSupportedImageBase64(pngBase64(800, 600))).toBe(true);
  });

  it('accepte un vrai JPEG', () => {
    expect(isSupportedImageBase64(jpegBase64(800, 600))).toBe(true);
  });

  it('rejette un préfixe data:image falsifié sans vrais magic bytes', () => {
    const fake = 'data:image/png;base64,' + Buffer.from('not an image at all').toString('base64');
    expect(isSupportedImageBase64(fake)).toBe(false);
  });

  it('rejette une chaîne vide ou trop courte', () => {
    expect(isSupportedImageBase64('')).toBe(false);
    expect(isSupportedImageBase64('AAAA')).toBe(false);
  });
});

describe('getImageDimensionsFromBase64', () => {
  it('lit les dimensions PNG', () => {
    expect(getImageDimensionsFromBase64(pngBase64(1024, 768))).toEqual({ width: 1024, height: 768 });
  });

  it('lit les dimensions JPEG', () => {
    expect(getImageDimensionsFromBase64(jpegBase64(640, 480))).toEqual({ width: 640, height: 480 });
  });

  it('gère le préfixe data: URI', () => {
    const withPrefix = 'data:image/png;base64,' + pngBase64(200, 100);
    expect(getImageDimensionsFromBase64(withPrefix)).toEqual({ width: 200, height: 100 });
  });

  it('retourne null pour un format non reconnu', () => {
    expect(getImageDimensionsFromBase64(Buffer.from('hello world').toString('base64'))).toBeNull();
  });
});

describe('getOptimalImageSize', () => {
  it('détecte le portrait', () => {
    expect(getOptimalImageSize(600, 800)).toBe('portrait_4_3');
    expect(getOptimalImageSize(540, 960)).toBe('portrait_16_9');
  });

  it('détecte le paysage', () => {
    expect(getOptimalImageSize(800, 600)).toBe('landscape_4_3');
    expect(getOptimalImageSize(1920, 1080)).toBe('landscape_16_9');
  });

  it('détecte le carré', () => {
    expect(getOptimalImageSize(512, 512)).toBe('square_hd');
  });
});

describe('getFalImageSizeFromBase64', () => {
  it('préserve l\'orientation portrait (régression historique)', () => {
    expect(getFalImageSizeFromBase64(jpegBase64(600, 1000))).toBe('portrait_16_9');
  });

  it('retombe sur le fallback si les dimensions sont illisibles', () => {
    const garbage = Buffer.from('not an image').toString('base64');
    expect(getFalImageSizeFromBase64(garbage)).toBe('landscape_4_3');
    expect(getFalImageSizeFromBase64(garbage, 'square_hd')).toBe('square_hd');
  });
});
