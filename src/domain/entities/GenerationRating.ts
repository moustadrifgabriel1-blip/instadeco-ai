/**
 * Entité GenerationRating
 * Représente la note (1-5) et le feedback laissés par un utilisateur
 * sur une génération d'image. Sert à mesurer la qualité perçue.
 */
export interface GenerationRating {
  readonly id: string;
  readonly generationId: string;
  readonly userId: string;
  readonly rating: RatingValue;
  readonly feedbackText: string | null;
  readonly createdAt: Date;
}

/**
 * Note de 1 à 5.
 */
export type RatingValue = 1 | 2 | 3 | 4 | 5;

export interface UpsertGenerationRatingInput {
  generationId: string;
  userId: string;
  rating: RatingValue;
  feedbackText?: string | null;
}
