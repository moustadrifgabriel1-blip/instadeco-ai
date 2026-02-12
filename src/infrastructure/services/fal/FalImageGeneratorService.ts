import { fal } from '@fal-ai/client';
import { Result, success, failure } from '@/src/shared/types/Result';
import { 
  IImageGeneratorService, 
  ImageGenerationOptions, 
  ImageGenerationResult 
} from '@/src/domain/ports/services/IImageGeneratorService';

// --- CONSTANTS & MAPPINGS ---

/**
 * Modèle Image-to-Image : l'image source est la BASE de la génération.
 * Le paramètre `strength` contrôle combien l'image change :
 *   0.0 = image identique, 1.0 = image complètement changée.
 * Combiné avec EasyControls depth (scale élevé), cela force la préservation
 * de la structure architecturale (murs, fenêtres, proportions).
 */
const MODEL_PATH = 'fal-ai/flux-general/image-to-image';

/**
 * Negative prompt pour empêcher toute modification structurelle.
 * Utilisé avec NAG (Normalized Attention Guidance) de Flux.
 */
const STRUCTURAL_NEGATIVE_PROMPT = 'different room layout, changed walls, modified windows, different room proportions, architectural changes, different ceiling, changed floor plan, different room shape, added windows, removed windows, moved doors, different perspective, different camera angle, distorted proportions, extra rooms, merged rooms, wider room, narrower room, taller ceiling, lower ceiling, different flooring material change';

/**
 * Paramètres de contrôle par mode de transformation.
 * strength: combien l'image originale est modifiée (0=aucun, 1=total)
 * depthScale: force du contrôle de profondeur (structure spatiale)
 */
const TRANSFORM_PARAMS: Record<string, { strength: number; depthScale: number }> = {
  full_redesign:  { strength: 0.55, depthScale: 1.0 },   // Changer meubles + déco, garder architecture
  keep_layout:    { strength: 0.45, depthScale: 1.2 },   // Changer style meubles, garder positions
  decor_only:     { strength: 0.35, depthScale: 1.3 },   // Changer uniquement déco/accessoires
};

/**
 * Détermine le format d'image optimal pour Fal.ai basé sur le ratio de l'image source
 * Fal.ai supporte: square_hd, square, portrait_4_3, portrait_16_9, landscape_4_3, landscape_16_9
 */
function getOptimalImageSize(width: number, height: number): string | { width: number; height: number } {
  const ratio = width / height;
  
  // Portrait (hauteur > largeur)
  if (ratio < 0.9) {
    if (ratio < 0.65) {
      return "portrait_16_9"; // ratio ~0.56
    }
    return "portrait_4_3"; // ratio ~0.75
  }
  
  // Paysage (largeur > hauteur)
  if (ratio > 1.1) {
    if (ratio > 1.5) {
      return "landscape_16_9"; // ratio ~1.78
    }
    return "landscape_4_3"; // ratio ~1.33
  }
  
  // Carré (~1:1)
  return "square_hd";
}

/**
 * Adapter: Fal.ai Image Generator Service
 * Uses 'fal-ai/flux/dev/controlnet' for State-of-the-Art Interior Design generation.
 * This model respects the input structure (ControlNet Depth) while applying the requested style with high fidelity.
 */
export class FalImageGeneratorService implements IImageGeneratorService {
  private isConfigured = false;

  constructor() {
    this.configure();
  }

  private configure(): void {
    const key = process.env.FAL_KEY || process.env.FAL_API_KEY;
    
    if (key) {
      fal.config({
        credentials: key,
      });
      this.isConfigured = true;
      console.log('[Fal.ai] ✅ Client configured successfully (Flux Dev + ControlNet)');
    } else {
      console.error('[Fal.ai] ❌ CRITICAL: FAL_KEY environment variable is missing!');
      this.isConfigured = false;
    }
  }

  async generate(options: ImageGenerationOptions): Promise<Result<ImageGenerationResult>> {
    if (!this.isConfigured) {
      return failure(new Error('Fal.ai client not configured. Missing FAL_KEY environment variable.'));
    }

    const styleSlug = options.styleSlug || 'moderne';
    const roomType = options.roomType || 'salon';
    const transformMode = options.transformMode || 'full_redesign';

    console.log('[Fal.ai] 🎨 Starting generation (Flux ControlNet):', {
      styleSlug,
      roomType,
      transformMode,
      model: MODEL_PATH,
      inputWidth: options.width,
      inputHeight: options.height,
    });

    try {
      // 1. Utiliser le prompt personnalisé fourni (inclut les instructions du transformMode)
      // Le prompt est construit par l'API route avec buildPrompt() qui gère les différents modes
      let fullPrompt = options.prompt;
      
      // Ajouter les mots-clés de qualité photo à la fin
      const qualityKeywords = 'Professional architectural photograph, shot on 50mm lens, f/2.8, ISO 200, realistic textures, natural lighting, 8k resolution, photorealistic, highly detailed.';
      fullPrompt = `${fullPrompt}\n\n${qualityKeywords}`;

      // 2. Déterminer le format d'image optimal basé sur l'image source
      const imageSize = getOptimalImageSize(options.width || 1024, options.height || 1024);
      console.log('[Fal.ai] 📐 Using image size:', imageSize);

      // 3. Submit to Queue — Image-to-Image avec contrôle de profondeur
      // L'image source sert de BASE (img2img) + EasyControls depth pour double verrou structurel.
      // strength bas = on préserve la structure, on change meubles/déco
      // depthScale élevé = la profondeur 3D de la pièce est strictement respectée
      const params = TRANSFORM_PARAMS[transformMode] || TRANSFORM_PARAMS.full_redesign;
      
      console.log('[Fal.ai] 🔧 Parameters:', {
        strength: params.strength,
        depthScale: params.depthScale,
        transformMode,
      });

      const { request_id } = await fal.queue.submit(MODEL_PATH, {
        input: {
          prompt: fullPrompt,
          image_url: options.controlImageUrl,     // Image source = base img2img
          strength: params.strength,               // Contrôle combien on modifie vs préserve
          easycontrols: [
            {
              control_method_url: "depth",         // Contrôle de profondeur
              image_url: options.controlImageUrl,   // Même image pour le depth map
              image_control_type: "spatial",        // Contrôle spatial (structure)
              scale: params.depthScale              // Force du contrôle de profondeur
            }
          ],
          negative_prompt: STRUCTURAL_NEGATIVE_PROMPT,
          image_size: imageSize, 
          num_inference_steps: 28, 
          guidance_scale: 3.5,
          enable_safety_checker: true,
          output_format: "jpeg"
        } as any,
        webhookUrl: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/v2/webhooks/fal` : undefined,
      });

      console.log('[Fal.ai] ✅ Job submitted successfully:', { request_id });

      return success({
        imageUrl: '',
        providerId: request_id, 
        status: 'pending',
        inferenceTime: 0,
        seed: 0,
      });

    } catch (error: any) {
      console.error('[Fal.ai] ❌ Generation submission failed:', error?.message || error);
      return failure(new Error(`Fal.ai submission failed: ${error?.message || error}`));
    }
  }

  async checkStatus(predictionId: string): Promise<Result<any>> {
    try {
      console.log('[Fal.ai] 🔄 Checking status for:', predictionId);
      
      // Utiliser l'API REST directement pour plus de contrôle
      const FAL_KEY = process.env.FAL_KEY || process.env.FAL_API_KEY;
      const statusUrl = `https://queue.fal.run/${MODEL_PATH}/requests/${predictionId}/status`;
      
      const statusResponse = await fetch(statusUrl, {
        headers: {
          'Authorization': `Key ${FAL_KEY}`,
        }
      });
      
      if (!statusResponse.ok) {
        console.error('[Fal.ai] Status request failed:', statusResponse.status);
        return failure(new Error(`Status check failed: ${statusResponse.status}`));
      }
      
      const statusData = await statusResponse.json();
      const statusCode = (statusData?.status || 'UNKNOWN').toUpperCase();

      console.log(`[Fal.ai] Status: ${statusCode} (${predictionId})`);
      console.log('[Fal.ai] Status response keys:', Object.keys(statusData || {}));

      if (statusCode === 'COMPLETED' || statusCode === 'SUCCEEDED' || statusCode === 'OK') {
        console.log('[Fal.ai] ✅ Job completed, fetching result...');
        
        // D'abord vérifier si le résultat est déjà dans la réponse de status
        // (certaines versions de l'API retournent le résultat directement)
        if (statusData?.images?.[0]?.url) {
          console.log('[Fal.ai] ✅ Image found directly in status response');
          return success({ 
            status: 'succeeded',
            output: { imageUrl: statusData.images[0].url }
          });
        }
        
        if (statusData?.response?.images?.[0]?.url) {
          console.log('[Fal.ai] ✅ Image found in status.response');
          return success({ 
            status: 'succeeded',
            output: { imageUrl: statusData.response.images[0].url }
          });
        }
        
        // Sinon, utiliser l'API REST pour récupérer le résultat
        const resultUrl = `https://queue.fal.run/${MODEL_PATH}/requests/${predictionId}`;
        
        try {
          const resultResponse = await fetch(resultUrl, {
            headers: {
              'Authorization': `Key ${FAL_KEY}`,
            }
          });
          
          const responseText = await resultResponse.text();
          console.log('[Fal.ai] Result response status:', resultResponse.status);
          console.log('[Fal.ai] Result response body (first 500 chars):', responseText.slice(0, 500));
          
          if (!resultResponse.ok) {
            console.error('[Fal.ai] ❌ Result request failed:', resultResponse.status, responseText);
            return failure(new Error(`Result fetch failed: ${resultResponse.status}`));
          }
          
          const data = JSON.parse(responseText);
          console.log('[Fal.ai] Result data keys:', Object.keys(data || {}));
          
          // Flux returns 'images': [{url: ...}]
          const imageUrl = data?.images?.[0]?.url || data?.image?.url || data?.response?.images?.[0]?.url;

          if (!imageUrl) {
            console.error('[Fal.ai] ❌ No image URL in result:', JSON.stringify(data).slice(0, 500));
            return failure(new Error('No image URL in result'));
          }
          
          console.log('[Fal.ai] ✅ Image URL found:', imageUrl.slice(0, 80) + '...');
          
          return success({ 
            status: 'succeeded',
            output: { imageUrl }
          });
        } catch (resultError: any) {
          console.error('[Fal.ai] ❌ Error fetching result:', resultError?.message || resultError);
          return failure(new Error(`Failed to fetch result: ${resultError?.message || resultError}`));
        }
      } else if (['IN_PROGRESS', 'IN_QUEUE', 'QUEUED', 'PENDING', 'RUNNING', 'STARTING'].includes(statusCode)) {
        return success({ status: 'processing', logs: statusData.logs });
      } else if (statusCode === 'FAILED' || statusCode === 'ERROR') {
        const errorMsg = statusData.error || 'Fal.ai job failed';
        return failure(new Error(errorMsg));
      } else {
        return success({ status: 'processing' });
      }
    } catch (error) {
      console.error('[Fal.ai] ❌ Status check failed:', error);
      if ((error as any)?.message?.includes('404')) {
         return failure(new Error('Job not found (404)'));
      }
      return failure(error instanceof Error ? error : new Error('Status check failed'));
    }
  }

  async cancel(predictionId: string): Promise<Result<void>> {
    return success(undefined);
  }
}
