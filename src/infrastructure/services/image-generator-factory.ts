/**
 * Image Generator Factory
 *
 * Sélectionne l'implémentation de IImageGeneratorService selon la variable
 * d'environnement IMAGE_PROVIDER :
 *   - 'gemini' → GeminiImageGeneratorService (Google Gemini 2.5 Flash Image / Nano Banana)
 *   - 'fal'    → FalImageGeneratorService (défaut — ne rien casser en prod)
 *
 * Défaut = 'fal' pour préserver le comportement existant. En local, où seule
 * GEMINI_API_KEY est présente, il suffit de poser IMAGE_PROVIDER=gemini dans .env.local.
 */
import { IImageGeneratorService } from '@/src/domain/ports/services/IImageGeneratorService';
import { FalImageGeneratorService } from '@/src/infrastructure/services/fal/FalImageGeneratorService';
import { GeminiImageGeneratorService } from '@/src/infrastructure/services/gemini/GeminiImageGeneratorService';

export type ImageProvider = 'fal' | 'gemini';

export function createImageGeneratorService(): IImageGeneratorService {
  const provider = (process.env.IMAGE_PROVIDER || 'fal').toLowerCase() as ImageProvider;

  if (provider === 'gemini') {
    console.log('[ImageFactory] Provider sélectionné: gemini (Nano Banana)');
    return new GeminiImageGeneratorService();
  }

  if (provider !== 'fal') {
    console.warn(
      `[ImageFactory] IMAGE_PROVIDER="${provider}" inconnu — fallback sur 'fal'.`,
    );
  } else {
    console.log('[ImageFactory] Provider sélectionné: fal (Flux)');
  }

  return new FalImageGeneratorService();
}
