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

    console.log('[Fal.ai] 🎨 Starting generation (Flux ControlNet):', {
      styleSlug,
      roomType,
      model: MODEL_PATH
    });

    try {
      // 1. Build the prompt
      const stylePrompt = STYLE_PROMPTS[styleSlug] || STYLE_PROMPTS['moderne'];
      const roomPrompt = ROOM_PROMPTS[roomType] || 'interior room';
      
      const fullPrompt = `Cinematic photo of a ${roomPrompt}, ${stylePrompt}. Highly detailed, 8k resolution, professional interior design photography, architectural digest, sharp focus, perfect lighting.`;

      // 2. Submit to Queue
      const { request_id } = await fal.queue.submit(MODEL_PATH, {
        input: {
          prompt: fullPrompt,
          controlnets: [
            {
              path: "https://huggingface.co/XLabs-AI/flux-controlnet-depth-v3/resolve/main/flux-depth-controlnet-v3.safetensors?download=true",
              control_image_url: options.controlImageUrl,
              conditioning_scale: 1.0
            }
          ],
          image_size: "landscape_4_3", 
          
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
      // console.log('[Fal.ai] 🔄 Checking status for:', predictionId);
      
      const status = await fal.queue.status(MODEL_PATH, {
        requestId: predictionId,
        logs: false // Reduce verbosity
      });

      const statusData = (status as any).data || status;
      const statusCode = (statusData?.status || 'UNKNOWN').toUpperCase();

      if (process.env.NODE_ENV === 'development') {
        console.log(`[Fal.ai] Status: ${statusCode} (${predictionId})`);
      }

      if (statusCode === 'COMPLETED' || statusCode === 'SUCCEEDED' || statusCode === 'OK') {
         const result = await fal.queue.result(MODEL_PATH, {
           requestId: predictionId
         });
         
         const data = (result as any).data || result;
         // Flux returns 'images': [{url: ...}]
         const imageUrl = data?.images?.[0]?.url || data?.image?.url;

         if (!imageUrl) {
            console.error('[Fal.ai] ❌ No image URL in result:', data);
            return failure(new Error('No image URL in result'));
         }
         
         return success({ 
           status: 'succeeded',
           output: { imageUrl }
         });
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
