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
  readonly hdUnlocked: boolean;
  readonly stripeSessionId: string | null;
  readonly providerId?: string; // ID externe (Fal.ai, Replicate...)
  readonly createdAt: Date;
  readonly updatedAt: Date;
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
}

export interface UpdateGenerationInput {
  status?: GenerationStatus;
  outputImageUrl?: string;
  hdUnlocked?: boolean;
  stripeSessionId?: string;
  providerId?: string;
}
