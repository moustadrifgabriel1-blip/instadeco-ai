import { Style, CreateStyleInput } from '../../entities/Style';
import { Result } from '@/src/shared/types/Result';

/**
 * Port Repository - Style
 * Interface pour la gestion des styles de décoration
 */
export interface IStyleRepository {
  /**
   * Récupère tous les styles disponibles
   */
  findAll(): Promise<Result<Style[]>>;

  /**
   * Récupère un style par slug
   */
  findBySlug(slug: string): Promise<Result<Style | null>>;

  /**
   * Récupère un style par ID
   */
  findById(id: string): Promise<Result<Style | null>>;

  /**
   * Crée un nouveau style
   */
  create(input: CreateStyleInput): Promise<Result<Style>>;

  /**
   * Récupère les styles par catégorie
   */
  findByCategory(category: string): Promise<Result<Style[]>>;

  /**
   * Récupère les styles premium uniquement
   */
  findPremiumStyles(): Promise<Result<Style[]>>;
}
