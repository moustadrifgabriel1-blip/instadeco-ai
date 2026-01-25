import { fal } from '@fal-ai/client';
import { Result, success, failure } from '@/src/shared/types/Result';
import { 
  IImageGeneratorService, 
  ImageGenerationOptions, 
  ImageGenerationResult 
} from '@/src/domain/ports/services/IImageGeneratorService';

/**
 * Mapping des styles de l'app vers les styles Fal.ai AI-Home
 * Modèle: half-moon-ai/ai-home/style
 */
const STYLE_MAPPING: Record<string, string> = {
  'moderne': 'modern-interior',
  'minimaliste': 'minimalistic-interior',
  'boheme': 'bohemian-interior',
  'industriel': 'industrial-interior',
  'classique': 'luxury-interior', // Plus proche que vintage
  'japandi': 'japanese-interior',
  'midcentury': 'mid century-interior',
  'coastal': 'tropical-interior', // Proche du coastal
  'farmhouse': 'farmhouse-interior',
  'artdeco': 'art deco-interior',
  // Styles supplémentaires supportés
  'scandinave': 'scandinavian-interior',
  'luxe': 'luxury-interior',
  'zen': 'zen-interior',
  'cozy': 'cozy-interior',
  'vintage': 'vintage-interior',
  'loft': 'loft-interior',
};

/**
 * Mapping des types de pièces de l'app vers les architecture_type Fal.ai
 */
const ROOM_MAPPING: Record<string, string> = {
  'salon': 'living room-interior',
  'chambre': 'bedroom-interior',
  'chambre-enfant': 'kids bedroom-interior',
  'cuisine': 'kitchen-interior',
  'salle-de-bain': 'bathroom-interior',
  'bureau': 'home office-interior',
  'salle-a-manger': 'dining room-interior',
  'entree': 'other-interior',
  'terrasse': 'courtyard-exterior',
};

/**
 * Palettes de couleurs suggérées par style
 */
const COLOR_PALETTES: Record<string, string> = {
  'moderne': 'muted sands',
  'minimaliste': 'arctic mist',
  'boheme': 'golden beige',
  'industriel': 'earthy neutrals',
  'classique': 'refined blues',
  'japandi': 'muted horizon',
  'midcentury': 'retro rust',
  'coastal': 'ocean breeze',
  'farmhouse': 'earthy tones',
  'artdeco': 'golden sapphire',
  'default': 'surprise me',
};

/**
 * Adapter: Fal.ai Image Generator Service
 * Utilise le modèle spécialisé half-moon-ai/ai-home/style pour la décoration d'intérieur
 * Avec fallback sur fal-ai/flux-pro/kontext si nécessaire
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
      console.log('[Fal.ai] ✅ Client configured successfully');
    } else {
      console.error('[Fal.ai] ❌ CRITICAL: FAL_KEY environment variable is missing!');
      this.isConfigured = false;
    }
  }

  async generate(options: ImageGenerationOptions): Promise<Result<ImageGenerationResult>> {
    if (!this.isConfigured) {
      return failure(new Error('Fal.ai client not configured. Missing FAL_KEY environment variable.'));
    }

    // Extraire le style et le type de pièce depuis le prompt ou les options
    const styleSlug = options.styleSlug || this.extractStyleFromPrompt(options.prompt);
    const roomType = options.roomType || this.extractRoomFromPrompt(options.prompt);

    console.log('[Fal.ai] 🎨 Starting generation (Queue Mode):', {
      styleSlug,
      roomType,
      imageUrl: options.controlImageUrl?.substring(0, 50) + '...',
      model: 'half-moon-ai/ai-home/style'
    });

    try {
      const style = STYLE_MAPPING[styleSlug] || 'modern-interior';
      const architectureType = ROOM_MAPPING[roomType] || 'living room-interior';
      const colorPalette = COLOR_PALETTES[styleSlug] || COLOR_PALETTES['default'];

      // Utiliser fal.queue.submit au lieu de fal.subscribe
      const { request_id } = await fal.queue.submit('half-moon-ai/ai-home/style', {
        input: {
          input_image_url: options.controlImageUrl,
          architecture_type: architectureType,
          style: style,
          color_palette: colorPalette,
          input_image_strength: 0.90,
          num_inference_steps: 25,
          output_format: 'jpeg',
        },
        webhookUrl: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/v2/webhooks/fal` : undefined,
      });

      console.log('[Fal.ai] ✅ Job submitted successfully:', { request_id });

      // Retourner le pending status
      return success({
        imageUrl: '', // Sera rempli plus tard
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

  // Vérifier le statut d'un job
  async checkStatus(predictionId: string): Promise<Result<any>> {
    try {
      const status = await fal.queue.status('half-moon-ai/ai-home/style', {
        requestId: predictionId,
        logs: true // Récupérer les logs
      });

      console.log('[Fal.ai] 🔄 Status check:', { predictionId, status: (status as any).status });

      if ((status as any).status === 'COMPLETED') {
         const result = await fal.queue.result('half-moon-ai/ai-home/style', {
           requestId: predictionId
         });
         
         const data = (result as any).data || result;
         const imageUrl = data?.image?.url;
         
         return success({ 
           status: 'succeeded',
           output: { imageUrl }
         });
      } else if ((status as any).status === 'IN_PROGRESS' || (status as any).status === 'IN_QUEUE') {
        return success({ status: 'processing' });
      } else {
        return failure(new Error(`Fal.ai job failed with status: ${(status as any).status}`));
      }
    } catch (error) {
      console.error('[Fal.ai] ❌ Status check failed:', error);
      return failure(error instanceof Error ? error : new Error('Status check failed'));
    }
  }

  /* SUPPRESSION DE generateWithAIHome et generateWithFluxKontext pour le moment car passage en mode Queue */
  
  /**
   * Extraire le style depuis le prompt (fallback si non fourni)
   */
  private extractStyleFromPrompt(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    const styles = Object.keys(STYLE_MAPPING);
    return styles.find(s => lowerPrompt.includes(s)) || 'moderne';
  }

  /**
   * Extraire le type de pièce depuis le prompt (fallback si non fourni)
   */
  private extractRoomFromPrompt(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    const roomKeywords: Record<string, string> = {
      'living room': 'salon',
      'kids bedroom': 'chambre-enfant',
      'bedroom': 'chambre',
      'kitchen': 'cuisine',
      'bathroom': 'salle-de-bain',
      'office': 'bureau',
      'dining': 'salle-a-manger',
      'entryway': 'entree',
      'terrace': 'terrasse',
    };
    
    for (const [keyword, roomType] of Object.entries(roomKeywords)) {
      if (lowerPrompt.includes(keyword)) {
        return roomType;
      }
    }
    return 'salon';
  }

  async cancel(predictionId: string): Promise<Result<void>> {
    return success(undefined);
  }
}
