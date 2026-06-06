/**
 * Service: GeminiImageGeneratorService
 *
 * Implémentation alternative du port IImageGeneratorService basée sur
 * Google Gemini 2.5 Flash Image ("Nano Banana"), en REST PUR (aucune dépendance npm).
 *
 * Pourquoi Gemini ici ?
 *  - L'environnement local possède GEMINI_API_KEY mais PAS de FAL_KEY → Fal ne tourne pas.
 *  - Gemini fait du vrai image-to-image sémantique : il "comprend" la pièce et peut
 *    verrouiller la structure architecturale (murs, fenêtres, perspective) bien mieux
 *    qu'un img2img Flux piloté par strength, ce qui est exactement le besoin déco avant/après.
 *
 * Pattern REST repris à l'identique de GeminiAIContentService :
 *  - endpoint v1beta /models/MODEL:generateContent?key=KEY
 *  - fetch + AbortSignal.timeout + retries avec backoff
 *  - logs préfixés (ici [GeminiImage])
 *
 * Flux de données :
 *  1. On récupère l'image source (URL http OU data: base64) → buffer base64 + mimeType.
 *  2. On envoie { text: prompt, inline_data: { mime_type, data } } à Gemini avec
 *     generationConfig.responseModalities = ['TEXT','IMAGE'].
 *  3. Gemini renvoie l'image éditée en base64 dans candidates[0].content.parts[].inlineData.data.
 *  4. On uploade ce base64 sur Supabase Storage (bucket output-images) → URL publique.
 *     Si Supabase n'est pas configuré (cas dev local), on retombe sur un data: URI
 *     pour que la génération reste exploitable.
 */
import { Result, success, failure } from '@/src/shared/types/Result';
import {
  IImageGeneratorService,
  ImageGenerationOptions,
  ImageGenerationResult,
} from '@/src/domain/ports/services/IImageGeneratorService';
import { uploadImageFromBase64 } from '@/lib/supabase/storage';
import { safeFetchImage } from '@/src/shared/utils/safe-url';
import {
  buildGeminiImagePrompt,
  type TransformMode,
} from '@/src/infrastructure/services/gemini/gemini-image-presets';

/** Forme minimale de la réponse generateContent qui nous intéresse. */
interface GeminiImagePart {
  text?: string;
  // Le SDK REST renvoie inlineData (camelCase) en sortie ; on tolère inline_data par sécurité.
  inlineData?: { mimeType?: string; data?: string };
  inline_data?: { mime_type?: string; data?: string };
}
interface GeminiImageResponse {
  candidates?: Array<{
    content?: { parts?: GeminiImagePart[] };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
}

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Modèle image par défaut. Surchargable via GEMINI_IMAGE_MODEL (ex: gemini-3-pro-image).
const DEFAULT_IMAGE_MODEL = 'gemini-2.5-flash-image';

// La génération d'image est plus longue qu'un appel texte court mais reste < 1 min.
const FETCH_TIMEOUT_MS = 120_000;

const VALID_MODES: TransformMode[] = [
  'full_redesign',
  'keep_layout',
  'decor_only',
  'home_staging',
];

export class GeminiImageGeneratorService implements IImageGeneratorService {
  private apiKey: string;
  private model: string;
  private endpoint: string;
  private maxRetries = 2;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.model = process.env.GEMINI_IMAGE_MODEL || DEFAULT_IMAGE_MODEL;
    this.endpoint = `${GEMINI_BASE_URL}/${this.model}:generateContent`;
    console.log(
      '[GeminiImage] Modèle:',
      this.model,
      '| API Key présente:',
      !!this.apiKey,
      '| Timeout:',
      FETCH_TIMEOUT_MS / 1000 + 's',
    );
    if (!this.apiKey) {
      console.error('[GeminiImage] ❌ GEMINI_API_KEY manquant — le service ne fonctionnera pas.');
    }
  }

  async generate(
    options: ImageGenerationOptions,
  ): Promise<Result<ImageGenerationResult>> {
    if (!this.apiKey) {
      return failure(
        new Error('Gemini non configuré. Variable GEMINI_API_KEY manquante.'),
      );
    }

    const styleSlug = options.styleSlug || 'moderne';
    const roomType = options.roomType || 'salon';
    const transformMode: TransformMode = VALID_MODES.includes(
      options.transformMode as TransformMode,
    )
      ? (options.transformMode as TransformMode)
      : 'full_redesign';

    console.log('[GeminiImage] 🎨 Démarrage génération:', {
      model: this.model,
      styleSlug,
      roomType,
      transformMode,
    });

    // 1. Récupérer l'image source en base64 + mimeType
    let source: { base64: string; mimeType: string };
    try {
      source = await this.loadSourceImage(options.controlImageUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[GeminiImage] ❌ Chargement image source échoué:', message);
      return failure(new Error(`Image source illisible: ${message}`));
    }

    // 2. Construire le prompt mode-aware (verrou structurel + style)
    const prompt = buildGeminiImagePrompt({
      basePrompt: options.prompt,
      transformMode,
      styleSlug,
      roomType,
    });

    const requestBody = JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: source.mimeType,
                data: source.base64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        // Bas = on reste fidèle à la photo source (peu d'invention/dérive).
        temperature: 0.4,
      },
    });

    // 3. Appel REST avec retries (même logique que GeminiAIContentService)
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      const startGen = Date.now();
      try {
        console.log(`[GeminiImage] 🚀 Tentative ${attempt}/${this.maxRetries}`);

        const response = await fetch(`${this.endpoint}?key=${this.apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
          body: requestBody,
        });

        if (!response.ok) {
          const errorText = await response.text();
          // 4xx ≠ retry utile (clé invalide, modèle inconnu, requête invalide) → on sort.
          if (response.status >= 400 && response.status < 500) {
            return failure(
              new Error(
                `Erreur API Gemini ${response.status}: ${errorText.slice(0, 500)}`,
              ),
            );
          }
          throw new Error(
            `Erreur API Gemini ${response.status}: ${errorText.slice(0, 500)}`,
          );
        }

        const data: GeminiImageResponse = await response.json();

        // Blocage de sécurité éventuel
        const blockReason =
          data.promptFeedback?.blockReason ||
          data.candidates?.[0]?.finishReason;
        const outImage = this.extractImagePart(data);

        if (!outImage) {
          // Pas d'image : souvent un blocage SAFETY ou une réponse vide.
          const textPart = data.candidates?.[0]?.content?.parts?.find(
            (p) => p.text,
          )?.text;
          console.error(
            '[GeminiImage] ❌ Aucune image dans la réponse. finishReason:',
            blockReason,
            '| texte:',
            textPart?.slice(0, 200),
          );
          if (
            blockReason &&
            /SAFETY|BLOCK|PROHIBITED/i.test(String(blockReason))
          ) {
            return failure(
              new Error(
                'Gemini: image bloquée par le filtre de sécurité. Essayez une autre photo.',
              ),
            );
          }
          // Réponse vide → retry possible
          throw new Error('Réponse Gemini sans image (vide).');
        }

        const inferenceTime = (Date.now() - startGen) / 1000;

        // 4. Uploader le base64 sur Supabase (ou fallback data: URI en dev)
        const imageUrl = await this.persistImage(
          outImage.base64,
          outImage.mimeType,
        );

        console.log(
          '[GeminiImage] ✅ Génération terminée en',
          inferenceTime,
          's:',
          imageUrl.slice(0, 80),
        );

        return success({
          imageUrl,
          providerId: `gemini-${this.model}-${Date.now()}`,
          status: 'succeeded',
          inferenceTime,
        });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(
          `[GeminiImage] ❌ Tentative ${attempt}/${this.maxRetries} échouée:`,
          lastError.message,
        );
        if (attempt < this.maxRetries) {
          const delay = attempt * 3000; // 3s, 6s
          console.log(`[GeminiImage] ⏳ Retry dans ${delay / 1000}s...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    return failure(
      new Error(
        `Gemini: échec après ${this.maxRetries} tentatives: ${lastError?.message}`,
      ),
    );
  }

  /**
   * Charge l'image source. controlImageUrl peut être :
   *  - une URL http(s) (ex: Supabase signed URL) → on la télécharge
   *  - un data: URI base64 → on le décode directement
   */
  private async loadSourceImage(
    controlImageUrl: string,
  ): Promise<{ base64: string; mimeType: string }> {
    if (!controlImageUrl) {
      throw new Error('controlImageUrl vide');
    }

    if (controlImageUrl.startsWith('data:')) {
      const match = controlImageUrl.match(/^data:([^;]+);base64,([\s\S]+)$/);
      if (!match) {
        throw new Error('data: URI base64 malformé');
      }
      return { mimeType: match[1] || 'image/jpeg', base64: match[2] };
    }

    if (controlImageUrl.startsWith('http')) {
      // safeFetchImage = garde anti-SSRF (rejette IP internes/metadata) + timeout
      const res = await safeFetchImage(controlImageUrl);
      if (!res.ok) {
        throw new Error(`téléchargement échoué (${res.status})`);
      }
      const mimeType = res.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await res.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      return { mimeType: mimeType.split(';')[0], base64 };
    }

    throw new Error('controlImageUrl doit être une URL http(s) ou un data: URI');
  }

  /**
   * Extrait la première part image de la réponse, en tolérant inlineData (sortie)
   * et inline_data (par robustesse).
   */
  private extractImagePart(
    data: GeminiImageResponse,
  ): { base64: string; mimeType: string } | null {
    const parts = data.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      const inline = part.inlineData;
      if (inline?.data) {
        return { base64: inline.data, mimeType: inline.mimeType || 'image/png' };
      }
      const snake = part.inline_data;
      if (snake?.data) {
        return { base64: snake.data, mimeType: snake.mime_type || 'image/png' };
      }
    }
    return null;
  }

  /**
   * Persiste l'image générée. On uploade sur Supabase Storage (bucket output-images)
   * via uploadImageFromBase64. Si Supabase n'est pas configuré (dev local sans clés),
   * on retombe sur un data: URI exploitable plutôt que de faire échouer la génération.
   */
  private async persistImage(base64: string, mimeType: string): Promise<string> {
    const hasSupabase =
      !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!hasSupabase) {
      console.warn(
        '[GeminiImage] ⚠️ Supabase non configuré (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) — retour d\'un data: URI au lieu d\'une URL publique.',
      );
      return `data:${mimeType || 'image/png'};base64,${base64}`;
    }

    try {
      // uploadImageFromBase64(base64String, userId, folder) — folder 'outputs' = bucket output-images.
      // userId 'gemini' sert juste de préfixe de chemin (pas de contrainte d'auth ici).
      return await uploadImageFromBase64(base64, 'gemini', 'outputs');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(
        '[GeminiImage] ⚠️ Upload Supabase échoué, fallback data: URI:',
        message,
      );
      return `data:${mimeType || 'image/png'};base64,${base64}`;
    }
  }

  /**
   * Génération synchrone : pas de polling. Présent pour conformité avec l'interface.
   */
  async checkStatus(predictionId: string): Promise<Result<any>> {
    return success({ status: 'succeeded' });
  }

  async cancel(predictionId: string): Promise<Result<void>> {
    return success(undefined);
  }
}
