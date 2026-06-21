/**
 * Image Generator Factory
 *
 * Sélectionne l'implémentation de IImageGeneratorService :
 *   - 'gemini' → GeminiImageGeneratorService (Google Gemini 2.5 Flash Image / Nano Banana)
 *   - 'fal'    → FalImageGeneratorService (Flux)
 *
 * IMAGE_PROVIDER explicite est toujours prioritaire. Sans variable, on choisit le
 * provider dont la clé est réellement présente : Gemini est le moteur configuré et
 * financé (il n'y a pas de FAL_KEY). L'ancien défaut « fal en dur » faisait échouer
 * TOUTE génération web faute de clé FAL, en local comme en prod.
 */
import { IImageGeneratorService } from '@/src/domain/ports/services/IImageGeneratorService';
import { FalImageGeneratorService } from '@/src/infrastructure/services/fal/FalImageGeneratorService';
import { GeminiImageGeneratorService } from '@/src/infrastructure/services/gemini/GeminiImageGeneratorService';

export type ImageProvider = 'fal' | 'gemini';

export function createImageGeneratorService(): IImageGeneratorService {
  const explicit = process.env.IMAGE_PROVIDER?.toLowerCase();
  const provider: ImageProvider =
    explicit === 'gemini' || explicit === 'fal'
      ? explicit
      : process.env.GEMINI_API_KEY
        ? 'gemini'
        : 'fal';

  if (explicit && explicit !== 'gemini' && explicit !== 'fal') {
    console.warn(`[ImageFactory] IMAGE_PROVIDER="${explicit}" inconnu — choix automatique: ${provider}.`);
  }

  if (provider === 'gemini') {
    console.log('[ImageFactory] Provider sélectionné: gemini (Nano Banana)');
    return new GeminiImageGeneratorService();
  }

  console.log('[ImageFactory] Provider sélectionné: fal (Flux)');
  return new FalImageGeneratorService();
}
