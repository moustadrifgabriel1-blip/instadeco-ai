import { fal } from '@fal-ai/client';
import { Result, success, failure } from '@/src/shared/types/Result';
import { 
  IImageGeneratorService, 
  ImageGenerationOptions, 
  ImageGenerationResult 
} from '@/src/domain/ports/services/IImageGeneratorService';

// --- CONSTANTS & MAPPINGS ---

const MODEL_PATH = 'fal-ai/flux-general';

// Enhanced prompts for Flux to ensure "World-Class Interior Design" quality
const STYLE_PROMPTS: Record<string, string> = {
  'original': 'same existing interior style, improved organization, better lighting, enhanced aesthetics while preserving the current design character and furniture style',
  'moderne': 'modern interior design, sleek lines, contemporary italian furniture, neutral color palette, warm lighting, high-end finishing, architectural digest style, 8k, photorealistic',
  'minimaliste': 'minimalist interior design, wabi-sabi influence, clean lines, decluttered space, natural materials, light oak wood, soft white walls, serene atmosphere, high quality textures',
  'boheme': 'bohemian chic interior, eclectic decor, rattan furniture, layered textiles, persian rugs, indoor plants, warm earth tones, cozy atmosphere, macrame details, natural lighting',
  'industriel': 'industrial loft style, exposed brick walls, metal accents, leather furniture, concrete floors, high ceilings, factory windows, raw materials, urban chic aesthetic, dramatic lighting',
  'classique': 'luxury classic interior, haussmannian style, moldings on walls, velvet upholstery, crystal chandelier, gold accents, marble fireplace, sophisticated antique furniture, timeless elegance',
  'japandi': 'japandi style, blend of japanese rustic minimalism and scandinavian functionality, light wood, low profile furniture, beige and grey tones, organic shapes, zen atmosphere, soft textures',
  'midcentury': 'mid-century modern interior, eames era furniture, teak wood, organic curves, geometric patterns, olive green and mustard yellow accents, retro mood, clean architectural lines',
  'coastal': 'coastal hamptons style, light and airy, white wood paneling, linen fabrics, soft blue and sand tones, beach house vibe, natural light, elegant and relaxed atmosphere',
  'farmhouse': 'modern farmhouse interior, rustic wooden beams, shiplap walls, comfortable overstuffed furniture, neutral warm tones, vintage accessories, cozy and inviting, country living style',
  'artdeco': 'art deco interior, geometric patterns, velvet furniture, brass and gold metallic accents, rich jewel tones, emerald green, symmetry, glamorous and opulent atmosphere, great gatsby style',
  'ludique': 'playful kids room interior, vibrant but harmonious colors, creative furniture shapes, educational decor, soft rugs, organized toy storage, whimsical atmosphere, safe and cozy for children',
  // Fallbacks
  'scandinave': 'scandinavian interior design, hygge atmosphere, light wood, white walls, functional design, cozy textiles, clean and bright',
  'luxe': 'ultra luxury interior design, marble floors, silk drapes, custom furniture, gold leaf details, expensive materials, penthouse vibe, cinematic lighting',
  'zen': 'zen sanctuary interior, bamboo accents, pebble stones, water feature, minimal furniture, meditation space, soft diffused lighting, peaceful',
  'cozy': 'ultra cozy interior, warm fireplace, fluffy blankets, soft lighting, reading nook, warm wood tones, inviting atmosphere, hygge',
  'vintage': 'vintage retro interior, curated antique pieces, wallpaper with floral patterns, velvet textures, nostalgic atmosphere, wes anderson style',
  'loft': 'new york loft style, open plan, huge windows, exposed pipes, concrete ceiling, artistic decor, spacious and urban',
};

const ROOM_PROMPTS: Record<string, string> = {
  'salon': 'spacious living room',
  'chambre': 'master bedroom',
  'chambre-enfant': 'kids bedroom, playful but organized',
  'cuisine': 'gourmet kitchen with island',
  'salle-de-bain': 'luxury spa bathroom',
  'bureau': 'home office workspace',
  'salle-a-manger': 'dining room with large table',
  'entree': 'entryway hallway',
  'terrasse': 'outdoor terrace patio',
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

      // 3. Submit to Queue
      // NOTE: Using easycontrols with "depth" control method - this is the simplest and most reliable
      // approach for structure-preserving generation on Fal.ai's flux-general endpoint.
      // EasyControl handles depth map generation internally.
      const { request_id } = await fal.queue.submit(MODEL_PATH, {
        input: {
          prompt: fullPrompt,
          easycontrols: [
            {
              control_method_url: "depth", // Built-in depth control
              image_url: options.controlImageUrl,
              image_control_type: "spatial", // "spatial" for structure, "subject" for style
              // Ajuster le scale selon le mode:
              // - rearrange: PLUS BAS (0.4) pour donner liberté de déplacer les meubles
              // - decor_only: très haut (1.2) car on garde TOUT sauf la déco
              // - keep_layout: haut (1.0) car on garde les positions exactes
              // - full_redesign: moyen (0.7) pour transformer tout en gardant la structure de base
              scale: transformMode === 'rearrange' ? 0.4 : 
                     transformMode === 'decor_only' ? 1.2 : 
                     transformMode === 'keep_layout' ? 1.0 : 0.7
            }
          ],
          image_size: imageSize, 
          
          num_inference_steps: 28, 
          guidance_scale: 3.5, 
          enable_safety_checker: false,
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
