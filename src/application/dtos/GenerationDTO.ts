import { Generation, GenerationStatus } from '@/src/domain/entities/Generation';

/**
 * DTO pour la génération (exposé à l'API/UI)
 * 
 * ⚠️ NE PAS MODIFIER — Ce DTO est le contrat API entre le serveur et le client.
 * Tout changement de type ici casse le frontend.
 */
export interface GenerationDTO {
  id: string;
  userId: string;
  styleSlug: string;
  roomType: string;
  inputImageUrl: string;
  outputImageUrl: string | null;
  status: GenerationStatus;
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
