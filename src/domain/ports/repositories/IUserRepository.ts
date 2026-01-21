import { User, CreateUserInput, UpdateUserInput } from '../../entities/User';
import { Result } from '@/src/shared/types/Result';

/**
 * Port Repository - User
 * Interface pour la persistance des utilisateurs
 */
export interface IUserRepository {
  /**
   * Crée un nouvel utilisateur
   */
  create(input: CreateUserInput): Promise<Result<User>>;

  /**
   * Récupère un utilisateur par ID
   */
  findById(id: string): Promise<Result<User | null>>;

  /**
   * Récupère un utilisateur par email
   */
  findByEmail(email: string): Promise<Result<User | null>>;

  /**
   * Met à jour un utilisateur
   */
  update(id: string, input: UpdateUserInput): Promise<Result<User>>;

  /**
   * Supprime un utilisateur
   */
  delete(id: string): Promise<Result<void>>;

  /**
   * Vérifie si un utilisateur existe
   */
  exists(id: string): Promise<Result<boolean>>;
}
