import { Generation } from '@/src/domain/entities/Generation';

/**
 * DTO pour la génération (exposé à l'API/UI)
 */
export interface GenerationDTO {
  id: string;
  userId: string;
  styleSlug: string;
  roomType: string;
  inputImageUrl: string;
  outputImageUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO pour la création de génération
 */
export interface CreateGenerationDTO {
  styleSlug: string;
  roomType: string;
  imageBase64: string;
}

/**
 * DTO pour le résultat de génération
 */
export interface GenerationResultDTO {
  generation: GenerationDTO;
  creditsRemaining: number;
}
