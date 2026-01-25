import { Result } from '@/src/shared/types/Result';

/**
 * Résultat d'une génération d'image
 */
export interface ImageGenerationResult {
  imageUrl: string;
  providerId?: string; // ID pour le suivi async
  status?: 'pending' | 'processing' | 'succeeded' | 'failed';
  seed?: number;
  inferenceTime?: number;
}

/**
 * Options de génération d'image
 */
export interface ImageGenerationOptions {
  prompt: string;
  controlImageUrl: string;
  /** Style de décoration (moderne, minimaliste, etc.) */
  styleSlug?: string;
  /** Type de pièce (salon, chambre, etc.) */
  roomType?: string;
  width?: number;
  height?: number;
  numInferenceSteps?: number;
  guidanceScale?: number;
  seed?: number;
}

/**
 * Port Service - Image Generator
 * Interface pour la génération d'images par IA (Fal.ai)
 */
export interface IImageGeneratorService {
  /**
   * Génère une image transformée à partir d'une image source
   */
  generate(options: ImageGenerationOptions): Promise<Result<ImageGenerationResult>>;

  /**
   * Vérifie le statut d'une génération en cours
   */
  checkStatus?(predictionId: string): Promise<Result<{
    status: 'starting' | 'processing' | 'succeeded' | 'failed' | string;
    output?: any;
    logs?: string;
  }>>;

  /**
   * Annule une génération en cours
   */
  cancel?(predictionId: string): Promise<Result<void>>;
}
