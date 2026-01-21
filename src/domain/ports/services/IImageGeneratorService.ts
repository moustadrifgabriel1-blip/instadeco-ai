import { Result } from '@/src/shared/types/Result';

/**
 * Résultat d'une génération d'image
 */
export interface ImageGenerationResult {
  imageUrl: string;
  seed?: number;
  inferenceTime?: number;
}

/**
 * Options de génération d'image
 */
export interface ImageGenerationOptions {
  prompt: string;
  controlImageUrl: string;
  width?: number;
  height?: number;
  numInferenceSteps?: number;
  guidanceScale?: number;
  seed?: number;
}

/**
 * Port Service - Image Generator
 * Interface pour la génération d'images par IA (Replicate)
 */
export interface IImageGeneratorService {
  /**
   * Génère une image transformée à partir d'une image source
   */
  generate(options: ImageGenerationOptions): Promise<Result<ImageGenerationResult>>;

  /**
   * Vérifie le statut d'une génération en cours
   */
  checkStatus(predictionId: string): Promise<Result<{
    status: 'starting' | 'processing' | 'succeeded' | 'failed';
    output?: string;
    error?: string;
  }>>;

  /**
   * Annule une génération en cours
   */
  cancel(predictionId: string): Promise<Result<void>>;
}
