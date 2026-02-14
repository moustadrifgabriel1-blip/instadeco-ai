/**
 * ⚠️⚠️⚠️ FICHIER CRITIQUE — NE PAS MODIFIER SANS RAISON MAJEURE ⚠️⚠️⚠️
 * 
 * Ce fichier gère la génération d'images via Fal.ai.
 * Il utilise fal.run() en mode SYNCHRONE (pas de queue/polling).
 * 
 * HISTORIQUE DES BUGS (février 2026) :
 * - fal.queue.submit() + fal.queue.result() RÉ-EXÉCUTE le modèle au lieu de retourner le cache
 * - Les URLs temporaires de fal.ai expirent entre submit et result
 * - Solution : fal.run() synchrone qui retourne l'image directement
 * 
 * RÈGLES :
 * 1. TOUJOURS utiliser fal.run() — JAMAIS fal.queue.submit()
 * 2. TOUJOURS uploader l'image via fal.storage.upload() AVANT fal.run()
 * 3. Ne JAMAIS envoyer de data URI base64 directement à fal.ai
 * 4. checkStatus() est DEPRECATED et ne doit PAS être réactivé
 * 
 * Lire docs/GENERATION_ARCHITECTURE.md pour l'architecture complète.
 */
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

      // ✅ Utiliser fal.run() synchrone (fal.queue.submit + result re-exécute le modèle)
      const startGen = Date.now();
      
      // Upload l'image vers fal.ai storage pour accès fiable
      let falImageUrl = options.controlImageUrl;
      try {
        if (options.controlImageUrl.startsWith('http')) {
          // Télécharger l'image depuis l'URL externe (Supabase signed URL)
          const imgResponse = await fetch(options.controlImageUrl);
          if (!imgResponse.ok) {
            throw new Error(`Failed to download image: ${imgResponse.status}`);
          }
          const imgBlob = await imgResponse.blob();
          const imgFile = new File([imgBlob], 'input.jpg', { type: imgBlob.type || 'image/jpeg' });
          falImageUrl = await fal.storage.upload(imgFile);
          console.log('[Fal.ai] ✅ Image uploaded to fal storage:', falImageUrl.slice(0, 80));
        } else if (options.controlImageUrl.startsWith('data:')) {
          // Base64 data URI → convertir en blob et uploader
          const base64Data = options.controlImageUrl.split(',')[1];
          const mimeType = options.controlImageUrl.split(';')[0].split(':')[1] || 'image/jpeg';
          const buffer = Buffer.from(base64Data, 'base64');
          const blob = new Blob([buffer], { type: mimeType });
          falImageUrl = await fal.storage.upload(blob);
          console.log('[Fal.ai] ✅ Base64 image uploaded to fal storage:', falImageUrl.slice(0, 80));
        }
        // Si c'est déjà une fal.ai storage URL, on la garde telle quelle
      } catch (uploadErr: any) {
        console.warn('[Fal.ai] ⚠️ fal.storage.upload failed, using original URL:', uploadErr?.message);
        // Fallback: utiliser l'URL originale
      }

      const result = await fal.run(MODEL_PATH, {
        input: {
          prompt: fullPrompt,
          image_url: falImageUrl,                  // Image source = base img2img
          strength: params.strength,               // Contrôle combien on modifie vs préserve
          easycontrols: [
            {
              control_method_url: "depth",         // Contrôle de profondeur
              image_url: falImageUrl,               // Même image pour le depth map
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
      });

      const inferenceTime = (Date.now() - startGen) / 1000;
      
      // Extraire l'URL de l'image générée
      const outputImageUrl = (result as any)?.data?.images?.[0]?.url 
        || (result as any)?.images?.[0]?.url 
        || (result as any)?.data?.image?.url
        || (result as any)?.image?.url;
      
      if (!outputImageUrl) {
        console.error('[Fal.ai] ❌ No image URL in result:', JSON.stringify(result).slice(0, 500));
        return failure(new Error('Fal.ai returned no image URL'));
      }

      console.log('[Fal.ai] ✅ Generation completed in', inferenceTime, 's:', outputImageUrl.slice(0, 80));

      return success({
        imageUrl: outputImageUrl,
        providerId: (result as any)?.requestId || '',
        status: 'succeeded',
        inferenceTime,
        seed: (result as any)?.data?.seed || (result as any)?.seed || 0,
      });

    } catch (error: any) {
      console.error('[Fal.ai] ❌ Generation failed:', error?.message || error);
      return failure(new Error(`Fal.ai generation failed: ${error?.message || error}`));
    }
  }

  /**
   * @deprecated Plus utilisé — la génération est synchrone via fal.run().
   * Gardé pour conformité avec l'interface IImageGeneratorService.
   * NE PAS RÉACTIVER sans lire docs/GENERATION_ARCHITECTURE.md
   */
  async checkStatus(predictionId: string): Promise<Result<any>> {
    console.warn('[Fal.ai] ⚠️ checkStatus() appelé mais plus nécessaire (génération synchrone)');
    return success({ status: 'succeeded' });
  }

  async cancel(predictionId: string): Promise<Result<void>> {
    return success(undefined);
  }
}
