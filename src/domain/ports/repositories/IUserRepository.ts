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
   * Récupère un utilisateur par son ID d'abonnement Stripe.
   * Sert au mapping des events de renouvellement/annulation (invoice.paid,
   * customer.subscription.deleted) qui ne portent pas l'userId.
   */
  findByStripeSubscriptionId(subscriptionId: string): Promise<Result<User | null>>;

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

  /**
   * Définit le consentement marketing d'un profil par email.
   * Idempotent : 0 ligne affectée (email non inscrit) = no-op sans erreur.
   */
  setMarketingConsentByEmail(email: string, consent: boolean): Promise<Result<void>>;
}
