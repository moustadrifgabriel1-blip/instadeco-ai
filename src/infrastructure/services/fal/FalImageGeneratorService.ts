import { fal } from '@fal-ai/client';
import { Result, success, failure } from '@/src/shared/types/Result';
import { 
  IImageGeneratorService, 
  ImageGenerationOptions, 
  ImageGenerationResult 
} from '@/src/domain/ports/services/IImageGeneratorService';

/**
 * Adapter: Fal.ai Image Generator Service
 * Implémente IImageGeneratorService avec Fal.ai (Flux.1 + ControlNet)
 */
export class FalImageGeneratorService implements IImageGeneratorService {
  constructor() {
    // Configuration explicite de la clé pour s'assurer qu'elle est bien prise en compte
    // même si le client tente de la lire automatiquement.
    const key = process.env.FAL_KEY || process.env.FAL_API_KEY;
    
    if (key) {
      fal.config({
        credentials: key,
      });
    } else {
      console.warn('[Fal.ai] Warning: FAL_KEY environment variable is missing.');
    }
  }

  async generate(options: ImageGenerationOptions): Promise<Result<ImageGenerationResult>> {
    try {
      console.log('[Fal.ai] Starting generation with options:', {
        prompt: options.prompt,
        width: options.width,
        height: options.height,
        model: 'fal-ai/flux/dev/controlnet'
      });

      const startTime = Date.now();
      
      // Endpoint pour Flux.1 Dev avec ControlNet
      const result: any = await fal.subscribe('fal-ai/flux/dev/controlnet', {
        input: {
          prompt: options.prompt,
          control_image_url: options.controlImageUrl,
          control_type: "depth", // Utilisation de Depth pour préserver la structure de la pièce
          num_inference_steps: options.numInferenceSteps || 28,
          guidance_scale: options.guidanceScale || 3.5,
          controlnet_conditioning_scale: 0.95,
          width: options.width || 1024,
          height: options.height || 1024,
          seed: options.seed,
          enable_safety_checker: false,
          output_format: "jpeg",
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === 'IN_PROGRESS') {
            update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      });

      console.log('[Fal.ai] Generation success:', result);

      const inferenceTime = Date.now() - startTime;
      
      // Extraction de l'URL de l'image
      // fal retourne souvent images: [{url: ...}] ou image: {url: ...} selon le modèle
      let imageUrl = '';
      if (result.images && result.images.length > 0) {
        imageUrl = result.images[0].url;
      } else if (result.image && result.image.url) {
        imageUrl = result.image.url;
      } else {
         console.error('[Fal.ai] Unexpected output format:', result);
         return failure(new Error('Fal.ai returned unexpected output format'));
      }

      return success({
        imageUrl,
        inferenceTime,
        seed: result.seed ?? options.seed ?? 0,
      });

    } catch (error) {
      // Log détaillé de l'erreur pour le débogage serveur
      console.error('[Fal.ai] Generation FAILED:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      const message = error instanceof Error ? error.message : 'Unknown error';
      return failure(new Error(`Fal generation failed: ${message}`));
    }
  }

  // Les méthodes suivantes ne sont pas utilisées car nous utilisons fal.subscribe (attente active)
  
  async checkStatus(predictionId: string): Promise<Result<any>> {
    return success({ status: 'succeeded' });
  }

  async cancel(predictionId: string): Promise<Result<void>> {
    return success(undefined);
  }
}
