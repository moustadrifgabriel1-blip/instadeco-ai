import { Generation, CreateGenerationInput, UpdateGenerationInput } from '../../entities/Generation';
import { Result } from '@/src/shared/types/Result';

/**
 * Port Repository - Generation
 * Interface pour la persistance des générations
 */
export interface IGenerationRepository {
  /**
   * Crée une nouvelle génération
   */
  create(input: CreateGenerationInput): Promise<Result<Generation>>;

  /**
   * Récupère une génération par ID
   */
  findById(id: string): Promise<Result<Generation | null>>;

  /**
   * Récupère toutes les générations d'un utilisateur
   */
  findByUserId(userId: string, limit?: number): Promise<Result<Generation[]>>;

  /**
   * Met à jour une génération
   */
  update(id: string, input: UpdateGenerationInput): Promise<Result<Generation>>;

  /**
   * Supprime une génération
   */
  delete(id: string): Promise<Result<void>>;

  /**
   * Compte le nombre de générations d'un utilisateur
   */
  countByUserId(userId: string): Promise<Result<number>>;
}
