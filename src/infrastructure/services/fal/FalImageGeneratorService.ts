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

    console.log('[Fal.ai] 🎨 Starting generation:', {
      styleSlug,
      roomType,
      imageUrl: options.controlImageUrl?.substring(0, 50) + '...',
      model: 'half-moon-ai/ai-home/style'
    });

    // Essayer d'abord avec le modèle spécialisé AI-Home
    const aiHomeResult = await this.generateWithAIHome(options, styleSlug, roomType);
    if (aiHomeResult.success) {
      return aiHomeResult;
    }

    console.warn('[Fal.ai] ⚠️ AI-Home failed, trying Flux Kontext fallback...');
    
    // Fallback sur Flux Kontext
    return this.generateWithFluxKontext(options);
  }

  /**
   * Génération avec le modèle spécialisé AI-Home (recommandé pour la déco)
   */
  private async generateWithAIHome(
    options: ImageGenerationOptions,
    styleSlug: string,
    roomType: string
  ): Promise<Result<ImageGenerationResult>> {
    try {
      const startTime = Date.now();

      const style = STYLE_MAPPING[styleSlug] || 'modern-interior';
      const architectureType = ROOM_MAPPING[roomType] || 'living room-interior';
      const colorPalette = COLOR_PALETTES[styleSlug] || COLOR_PALETTES['default'];

      console.log('[Fal.ai] 🏠 AI-Home params:', {
        style,
        architectureType,
        colorPalette,
      });

      const result: any = await fal.subscribe('half-moon-ai/ai-home/style', {
        input: {
          input_image_url: options.controlImageUrl,
          architecture_type: architectureType,
          style: style,
          color_palette: colorPalette,
          input_image_strength: 0.85, // Préserve bien la structure
          enhanced_rendering: true, // Meilleure qualité
          output_format: 'jpeg',
          additional_elements: '', // Pourrait être utilisé pour ajouter des éléments
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === 'IN_PROGRESS') {
            console.log('[Fal.ai] 🔄 Processing...');
          }
        },
      });

      const inferenceTime = Date.now() - startTime;

      // fal.subscribe retourne { data: { image: { url: ... }, status: ... }, requestId: ... }
      const data = result?.data || result;
      const imageUrl = data?.image?.url;

      console.log('[Fal.ai] ✅ AI-Home success! Result:', {
        hasImage: !!imageUrl,
        status: data?.status,
        requestId: result?.requestId,
      });
      
      if (!imageUrl) {
        console.error('[Fal.ai] ❌ No image URL in AI-Home response:', JSON.stringify(result, null, 2));
        return failure(new Error('AI-Home model returned no image URL'));
      }

      return success({
        imageUrl,
        inferenceTime,
        seed: 0,
      });

    } catch (error) {
      console.error('[Fal.ai] ❌ AI-Home generation failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return failure(new Error(`AI-Home generation failed: ${message}`));
    }
  }

  /**
   * Fallback: Génération avec Flux Kontext pour l'édition d'images
   */
  private async generateWithFluxKontext(options: ImageGenerationOptions): Promise<Result<ImageGenerationResult>> {
    try {
      const startTime = Date.now();

      console.log('[Fal.ai] 🔄 Flux Kontext fallback with prompt:', options.prompt.substring(0, 100) + '...');

      const result: any = await fal.subscribe('fal-ai/flux-pro/kontext', {
        input: {
          prompt: options.prompt,
          image_url: options.controlImageUrl,
          guidance_scale: options.guidanceScale || 3.5,
          num_images: 1,
          output_format: 'jpeg',
          safety_tolerance: '5', // Plus permissif pour les designs d'intérieur
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === 'IN_PROGRESS') {
            console.log('[Fal.ai] 🔄 Kontext processing...');
          }
        },
      });

      const inferenceTime = Date.now() - startTime;

      // fal.subscribe retourne { data: { images: [{ url: ... }] }, requestId: ... }
      const data = result?.data || result;
      let imageUrl = '';
      if (data?.images && data.images.length > 0) {
        imageUrl = data.images[0].url;
      }

      console.log('[Fal.ai] ✅ Flux Kontext success!', { hasImage: !!imageUrl });

      if (!imageUrl) {
        console.error('[Fal.ai] ❌ No image URL in Kontext response:', JSON.stringify(result, null, 2));
        return failure(new Error('Flux Kontext returned no image URL'));
      }

      return success({
        imageUrl,
        inferenceTime,
        seed: data?.seed ?? 0,
      });

    } catch (error) {
      console.error('[Fal.ai] ❌ Flux Kontext fallback failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return failure(new Error(`All Fal.ai generation methods failed: ${message}`));
    }
  }

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

  // Méthodes non utilisées avec fal.subscribe (attente synchrone)
  async checkStatus(predictionId: string): Promise<Result<any>> {
    return success({ status: 'succeeded' });
  }

  async cancel(predictionId: string): Promise<Result<void>> {
    return success(undefined);
  }
}
