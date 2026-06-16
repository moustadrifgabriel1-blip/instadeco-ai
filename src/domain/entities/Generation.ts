/**
 * Entité Generation
 * Représente une transformation d'image par IA
 */
export interface Generation {
  readonly id: string;
  readonly userId: string;
  readonly styleSlug: string;
  readonly roomType: string;
  readonly inputImageUrl: string;
  readonly outputImageUrl: string | null;
  readonly status: GenerationStatus;
  readonly prompt: string | null;
  readonly stripeSessionId: string | null;
  readonly providerId?: string; // ID externe (Fal.ai, Replicate...)
  readonly errorMessage?: string | null; // Cause de l'échec (persistée pour diagnostic)
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** Item de galerie publique — anonymisé (jamais de userId ni d'inputImageUrl). */
export interface PublicGalleryItem {
  readonly id: string;
  readonly styleSlug: string;
  readonly roomType: string;
  readonly outputImageUrl: string;
  readonly createdAt: Date;
}

export interface PublicGalleryQuery {
  limit?: number;
  offset?: number;
  styleSlug?: string;
  roomType?: string;
}

export type GenerationStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

export interface CreateGenerationInput {
  userId: string;
  styleSlug: string;
  roomType: string;
  inputImageUrl: string;
  prompt: string;
  providerId?: string;
}

export interface UpdateGenerationInput {
  status?: GenerationStatus;
  outputImageUrl?: string;
  stripeSessionId?: string;
  providerId?: string;
  errorMessage?: string | null;
}
