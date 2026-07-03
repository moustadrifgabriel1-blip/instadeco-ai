/**
 * Compression / redimensionnement d'image côté client (navigateur uniquement).
 *
 * Objectif perf-02 : éviter d'envoyer l'image source brute (~5 Mo) en base64
 * dans le body POST de la génération. On redimensionne le côté long à ~1600px
 * et on ré-encode en JPEG qualité ~0.85 pour viser < 1.5 Mo, ce qui réduit la
 * durée des fonctions serverless (cout GB-s) et le temps de réponse, sans
 * dégrader visiblement la qualité de génération.
 *
 * Fallback : si l'API canvas / createImageBitmap échoue, on retombe sur la
 * lecture base64 brute du fichier d'origine.
 */

const DEFAULT_MAX_DIMENSION = 1600;
const DEFAULT_QUALITY = 0.85;

/** Lit un File en data URI base64 (sans compression). Fallback de sécurité. */
export function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Reconstruit un File à partir d'un data URI (base64). Sert à réhydrater une
 * photo transférée entre pages via sessionStorage (carry-over essai → generate).
 * Retourne null si le data URI est invalide.
 */
export function dataUrlToFile(dataUrl: string, filename = 'photo.jpg'): File | null {
  try {
    const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!match) return null;
    const mime = match[1];
    const binary = atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const ext = mime.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    const name = filename.replace(/\.[^.]+$/, '') + '.' + ext;
    return new File([bytes], name, { type: mime });
  } catch {
    return null;
  }
}

function canvasToDataUrl(
  canvas: HTMLCanvasElement,
  quality: number,
): string {
  // toDataURL est synchrone et largement supporté ; renvoie un JPEG compressé.
  return canvas.toDataURL('image/jpeg', quality);
}

async function decodeImage(
  file: Blob,
): Promise<{ width: number; height: number; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; cleanup: () => void }> {
  // Voie rapide : createImageBitmap (décodage hors thread principal).
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file);
    return {
      width: bitmap.width,
      height: bitmap.height,
      draw: (ctx, w, h) => ctx.drawImage(bitmap, 0, 0, w, h),
      cleanup: () => bitmap.close(),
    };
  }

  // Voie de repli : élément <img> + Object URL.
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
      draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
      cleanup: () => URL.revokeObjectURL(url),
    };
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}

export interface CompressOptions {
  /** Côté long maximal en pixels (défaut 1600). */
  maxDimension?: number;
  /** Qualité JPEG 0–1 (défaut 0.85). */
  quality?: number;
}

/**
 * Compresse une image et retourne un data URI JPEG (base64).
 * En cas d'échec de l'API canvas, retombe sur le base64 brut du fichier.
 */
export async function compressImageToDataUrl(
  file: Blob,
  options: CompressOptions = {},
): Promise<string> {
  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const quality = options.quality ?? DEFAULT_QUALITY;

  if (typeof document === 'undefined') {
    // Pas d'environnement DOM : fallback base64 brut.
    return fileToDataUrl(file);
  }

  let decoded: Awaited<ReturnType<typeof decodeImage>> | null = null;
  try {
    decoded = await decodeImage(file);

    const { width, height } = decoded;
    if (!width || !height) {
      throw new Error('Dimensions image invalides');
    }

    // Calcul du facteur d'échelle (ne jamais agrandir).
    const longestSide = Math.max(width, height);
    const scale = longestSide > maxDimension ? maxDimension / longestSide : 1;
    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Contexte canvas indisponible');
    }
    ctx.imageSmoothingQuality = 'high';
    // Fond blanc pour éviter le noir sur les PNG transparents convertis en JPEG.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    decoded.draw(ctx, targetWidth, targetHeight);

    const dataUrl = canvasToDataUrl(canvas, quality);
    if (!dataUrl || !dataUrl.startsWith('data:image')) {
      throw new Error('Encodage canvas vide');
    }
    return dataUrl;
  } catch {
    // Fallback : base64 brut du fichier d'origine (qualité préservée).
    return fileToDataUrl(file);
  } finally {
    decoded?.cleanup();
  }
}
