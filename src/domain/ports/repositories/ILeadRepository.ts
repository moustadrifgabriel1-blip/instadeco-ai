import { Result } from '@/src/shared/types/Result';

export interface CaptureLeadInput {
  email: string;
  source: string;
  name?: string;
  metadata?: Record<string, string>;
}

/**
 * Port Repository - Lead (capture email marketing).
 */
export interface ILeadRepository {
  /** Vrai si un lead existe déjà pour cet email (dédup, sans révéler au client). */
  existsByEmail(email: string): Promise<Result<boolean>>;

  /** Crée un lead (email normalisé en minuscules). */
  create(input: CaptureLeadInput): Promise<Result<void>>;

  /** Marque un lead comme désinscrit (idempotent ; 0 ligne = no-op sans erreur). */
  markUnsubscribed(email: string): Promise<Result<void>>;
}
