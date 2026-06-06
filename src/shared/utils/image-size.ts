/**
 * Utilitaires de dimensionnement d'image — partagés entre les routes de génération.
 *
 * Évite la duplication entre /api/trial/generate, GenerateDesignUseCase et
 * FalImageGeneratorService, et corrige le bug historique de /api/trial/generate
 * qui forçait toujours `landscape_4_3` (photos portrait déformées).
 *
 * 100% sans dépendance : on lit uniquement les en-têtes binaires JPEG / PNG / WEBP.
 */

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Extrait les dimensions d'une image depuis son base64 (data URI ou base64 brut).
 * Supporte JPEG, PNG et WEBP. Retourne null si le format n'est pas reconnu.
 */
export function getImageDimensionsFromBase64(base64: string): ImageDimensions | null {
  try {
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // PNG : dimensions aux octets 16-23
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
    }

    // JPEG : chercher un marqueur SOF0/SOF1/SOF2
    if (buffer[0] === 0xff && buffer[1] === 0xd8) {
      let offset = 2;
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xff) break;
        const marker = buffer[offset + 1];
        if (marker >= 0xc0 && marker <= 0xc2) {
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          return { width, height };
        }
        const length = buffer.readUInt16BE(offset + 2);
        offset += 2 + length;
      }
    }

    // WEBP : "RIFF" .... "WEBP"
    if (
      buffer.length > 30 &&
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    ) {
      // VP8 (lossy)
      if (buffer[12] === 0x56 && buffer[13] === 0x50 && buffer[14] === 0x38 && buffer[15] === 0x20) {
        return {
          width: buffer.readUInt16LE(26) & 0x3fff,
          height: buffer.readUInt16LE(28) & 0x3fff,
        };
      }
      // VP8L (lossless)
      if (buffer[12] === 0x56 && buffer[13] === 0x50 && buffer[14] === 0x38 && buffer[15] === 0x4c) {
        const bits = buffer.readUInt32LE(21);
        return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
      }
      // VP8X (extended)
      if (buffer[12] === 0x56 && buffer[13] === 0x50 && buffer[14] === 0x38 && buffer[15] === 0x58) {
        return { width: buffer.readUIntLE(24, 3) + 1, height: buffer.readUIntLE(27, 3) + 1 };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Valide qu'un base64 est bien une image supportée (JPEG/PNG/WEBP) via ses MAGIC BYTES,
 * et non un simple préfixe `data:image/...` falsifiable. N'décode que l'en-tête (~64 chars)
 * pour rester O(1) même sur de gros payloads → défense anti-bombe/anti-spoof MIME.
 */
export function isSupportedImageBase64(base64: string): boolean {
  try {
    const data = base64.replace(/^data:image\/\w+;base64,/, '');
    const head = Buffer.from(data.slice(0, 64), 'base64');
    if (head.length < 12) return false;
    // PNG
    if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) return true;
    // JPEG
    if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return true;
    // WEBP (RIFF .... WEBP)
    if (
      head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 &&
      head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Formats supportés par Fal.ai flux-general/image-to-image.
 */
export type FalImageSize =
  | 'square_hd'
  | 'portrait_4_3'
  | 'portrait_16_9'
  | 'landscape_4_3'
  | 'landscape_16_9';

/**
 * Détermine le format Fal optimal à partir d'un ratio largeur/hauteur.
 * Préserve l'orientation de la photo source (le bug corrigé : portrait → landscape).
 */
export function getOptimalImageSize(width: number, height: number): FalImageSize {
  const ratio = width / height;

  // Portrait (hauteur > largeur)
  if (ratio < 0.9) {
    return ratio < 0.65 ? 'portrait_16_9' : 'portrait_4_3';
  }

  // Paysage (largeur > hauteur)
  if (ratio > 1.1) {
    return ratio > 1.5 ? 'landscape_16_9' : 'landscape_4_3';
  }

  // Carré (~1:1)
  return 'square_hd';
}

/**
 * Déduit directement le format Fal depuis un base64, avec fallback sûr.
 * @param fallback format si les dimensions sont illisibles (défaut landscape_4_3)
 */
export function getFalImageSizeFromBase64(
  base64: string,
  fallback: FalImageSize = 'landscape_4_3',
): FalImageSize {
  const dims = getImageDimensionsFromBase64(base64);
  if (!dims || !dims.width || !dims.height) return fallback;
  return getOptimalImageSize(dims.width, dims.height);
}
