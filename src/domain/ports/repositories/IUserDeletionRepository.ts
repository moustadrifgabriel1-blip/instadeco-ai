import { Result } from '@/src/shared/types/Result';

/**
 * Port Repository - Suppression de compte en cascade (RGPD Art. 17).
 *
 * Encapsule les opérations Supabase nécessaires à l'effacement complet d'un
 * utilisateur : nettoyage du storage, suppression des leads associés, puis
 * suppression du compte auth (qui déclenche la cascade SQL ON DELETE CASCADE
 * sur profiles / generations / credit_transactions / projects / referrals).
 *
 * Repo DÉDIÉ à la suppression : il ne réutilise volontairement aucun port
 * existant pour préserver l'ordre/cascade exact et l'idempotence.
 */
export interface IUserDeletionRepository {
  /**
   * Supprime du storage toutes les images (input + output) des générations de
   * l'utilisateur. Opération « best effort » : ne doit JAMAIS bloquer la
   * suppression du compte. En cas d'échec storage, renvoie failure (l'appelant
   * décide de logger sans interrompre).
   */
  deleteUserStorage(userId: string): Promise<Result<void>>;

  /**
   * Supprime les leads marketing associés à cet email (table optionnelle).
   * Non bloquant : la table peut ne pas exister.
   */
  deleteLeadsByEmail(email: string): Promise<Result<void>>;

  /**
   * Supprime le compte auth de l'utilisateur via le service_role.
   * Déclenche la cascade SQL sur les tables liées. Opération bloquante :
   * un échec ici doit faire échouer la suppression du compte.
   */
  deleteAuthUser(userId: string): Promise<Result<void>>;
}
