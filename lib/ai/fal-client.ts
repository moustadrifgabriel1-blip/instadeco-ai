import Replicate from 'replicate';

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

// Client Replicate
const replicate = new Replicate({
  auth: REPLICATE_API_TOKEN,
});

// Modèle Flux.1 avec ControlNet sur Replicate
// ControlNet Canny préserve les contours (murs, fenêtres, structure)
// ControlNet Depth préserve la profondeur de la pièce
const REPLICATE_MODEL = 'black-forest-labs/flux-1.1-pro-ultra';
const REPLICATE_CONTROLNET_MODEL = 'black-forest-labs/flux-canny-pro';

// ============================================
// TYPES
// ============================================

export interface FalGenerationOptions {
  /** URL de l'image source (conditioning image) */
  imageUrl: string;
  /** Type de pièce (salon, chambre, cuisine, etc.) */
  roomType: string;
  /** Style de décoration (boheme, minimaliste, industriel, etc.) */
  style: string;
  /** Mode ControlNet: canny (contours) ou depth (profondeur) */
  controlMode?: 'canny' | 'depth';
  /** Force de l'image source (0.0 à 1.0) - plus élevé = plus fidèle */
  imageStrength?: number;
  /** Nombre d'étapes d'inférence (plus = meilleure qualité) */
  numInferenceSteps?: number;
  /** Guidance scale (adhérence au prompt) */
  guidanceScale?: number;
}

export interface FalGenerationResponse {
  requestId: string;
  status: string;
}

export interface FalStatusResponse {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  progress?: number;
  images?: Array<{ url: string; content_type?: string }>;
  error?: string;
}

export interface FalResultResponse {
  images: Array<{ url: string; width: number; height: number }>;
  timings?: { inference: number };
  seed?: number;
  prompt?: string;
}

// ============================================
// PROMPT TEMPLATE PROFESSIONNEL
// ============================================

/**
 * Génère le prompt optimisé pour la décoration d'intérieur
 * Ce prompt est conçu pour produire des rendus photoréalistes de qualité professionnelle
 */
export function buildInteriorDesignPrompt(roomType: string, style: string): string {
  return `A high-end photorealistic interior design photography of ${roomType}, style ${style}, 8k resolution, cinematic lighting, architectural digest style, highly detailed textures, realistic shadows, professional photography, soft sunlight through windows.`;
}

/**
 * Prompt négatif pour éviter les artefacts courants
 */
export const NEGATIVE_PROMPT = 'blurry, low quality, distorted, deformed, ugly, bad proportions, watermark, text, logo, cartoon, anime, illustration, painting, drawing, unrealistic, oversaturated';

// ============================================
// STYLES DE DÉCORATION DISPONIBLES
// ============================================

export const DECORATION_STYLES = {
  boheme: 'bohemian chic with natural textures, macramé, indoor plants, warm earth tones',
  minimaliste: 'minimalist scandinavian with clean lines, neutral colors, light wood furniture',
  industriel: 'industrial loft with exposed brick, metal fixtures, concrete floors, Edison bulbs',
  moderne: 'modern contemporary with sleek furniture, elegant finishes, subtle luxury',
  classique: 'classic elegant with traditional furniture, crown moldings, refined details',
  japandi: 'japandi fusion with zen minimalism, natural materials, muted palette',
  midcentury: 'mid-century modern with iconic furniture, warm wood, retro accents',
  coastal: 'coastal style with white and blue palette, natural light, beach-inspired decor',
  farmhouse: 'modern farmhouse with rustic wood, shiplap walls, cozy textiles',
  artdeco: 'art deco with geometric patterns, gold accents, luxurious materials',
} as const;

export type DecorationStyle = keyof typeof DECORATION_STYLES;

// ============================================
// TYPES DE PIÈCES
// ============================================

export const ROOM_TYPES = {
  salon: 'living room',
  chambre: 'bedroom',
  cuisine: 'kitchen',
  'salle-de-bain': 'bathroom',
  bureau: 'home office',
  'salle-a-manger': 'dining room',
  entree: 'entryway',
  terrasse: 'terrace',
} as const;

export type RoomType = keyof typeof ROOM_TYPES;

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Soumettre une génération à Fal.ai avec ControlNet
 * L'image source est utilisée comme conditioning image pour préserver
 * la structure des murs et fenêtres à 100%
 */
export async function submitGeneration(
  options: FalGenerationOptions
): Promise<FalGenerationResponse> {
  if (!REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN non configurée');
  }

  // Traduire le type de pièce si c'est une clé connue
  const roomTypeEnglish = ROOM_TYPES[options.roomType as RoomType] || options.roomType;
  
  // Enrichir le style si c'est une clé connue
  const styleDescription = DECORATION_STYLES[options.style as DecorationStyle] || options.style;
  
  // Construire le prompt professionnel
  const prompt = buildInteriorDesignPrompt(roomTypeEnglish, styleDescription);
  
  console.log('[Replicate] Submitting generation with prompt:', prompt);
  console.log('[Replicate] Conditioning image:', options.imageUrl.substring(0, 50) + '...');
  console.log('[Replicate] Control mode:', options.controlMode || 'canny');

  try {
    // Utiliser Flux Canny Pro pour le ControlNet
    const prediction = await replicate.predictions.create({
      model: 'black-forest-labs/flux-canny-pro',
      input: {
        // Prompt principal optimisé pour la décoration d'intérieur
        prompt: prompt,
        
        // IMAGE SOURCE = CONTROL IMAGE (paramètre correct pour flux-canny-pro)
        control_image: options.imageUrl,
        
        // Paramètres de génération (noms corrects)
        steps: options.numInferenceSteps ?? 28,
        guidance: options.guidanceScale ?? 3.5,
      },
    });

    console.log('[Replicate] Prediction created:', prediction.id);
    
    return {
      requestId: prediction.id,
      status: prediction.status.toUpperCase(),
    };
  } catch (error) {
    console.error('[Replicate] API error:', error);
    throw new Error(`Replicate API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Vérifier le statut d'une génération
 */
export async function checkGenerationStatus(
  requestId: string
): Promise<FalStatusResponse> {
  if (!REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN non configurée');
  }

  try {
    const prediction = await replicate.predictions.get(requestId);
    
    console.log('[Replicate] Status:', prediction.status);
    
    // Mapper les statuts Replicate vers notre format
    const statusMap: Record<string, FalStatusResponse['status']> = {
      'starting': 'IN_QUEUE',
      'processing': 'IN_PROGRESS',
      'succeeded': 'COMPLETED',
      'failed': 'FAILED',
      'canceled': 'FAILED',
    };

    return {
      status: statusMap[prediction.status] || 'IN_PROGRESS',
      progress: prediction.status === 'processing' ? 50 : undefined,
      images: prediction.status === 'succeeded' && prediction.output
        ? [{ url: Array.isArray(prediction.output) ? prediction.output[0] : prediction.output }]
        : undefined,
      error: typeof prediction.error === 'string' ? prediction.error : undefined,
    };
  } catch (error) {
    console.error('[Replicate] Status check error:', error);
    throw new Error(`Replicate status check error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

/**
 * Récupérer le résultat d'une génération terminée
 */
export async function getGenerationResult(requestId: string): Promise<FalResultResponse> {
  if (!REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN non configurée');
  }

  try {
    const prediction = await replicate.predictions.get(requestId);
    
    if (prediction.status !== 'succeeded') {
      throw new Error(`Generation not completed. Status: ${prediction.status}`);
    }

    const imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    
    console.log('[Replicate] Generation complete. Image URL:', imageUrl);
    
    return {
      images: [{ 
        url: imageUrl,
        width: 1024,
        height: 768,
      }],
      timings: prediction.metrics?.predict_time ? { inference: prediction.metrics.predict_time } : undefined,
      seed: undefined,
      prompt: undefined,
    };
  } catch (error) {
    console.error('[Replicate] Result fetch error:', error);
    throw new Error(`Replicate result fetch error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

/**
 * Fonction utilitaire pour générer une image de décoration d'intérieur
 * Combine toutes les étapes en une seule fonction
 * Utilise Replicate.ai avec Flux.1 Canny Pro (ControlNet)
 */
export async function generateInteriorDesign(options: {
  imageUrl: string;
  roomType: string;
  style: string;
  controlMode?: 'canny' | 'depth';
}): Promise<FalGenerationResponse> {
  return submitGeneration({
    imageUrl: options.imageUrl,
    roomType: options.roomType,
    style: options.style,
    controlMode: options.controlMode || 'canny',
    imageStrength: 0.85, // 85% fidèle à la structure originale
    numInferenceSteps: 28,
    guidanceScale: 7.5,
  });
}
