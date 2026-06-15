import { Result, success, failure } from '@/src/shared/types/Result';
import { IUserDeletionRepository } from '@/src/domain/ports/repositories/IUserDeletionRepository';
import { ILoggerService } from '@/src/domain/ports/services/ILoggerService';

export interface DeleteAccountInput {
  /** Toujours fourni par la session côté route, jamais par le body. */
  userId: string;
  /** Email de l'utilisateur (issu de la session) — sert au nettoyage des leads. */
  email: string | null | undefined;
}

/**
 * Use Case : suppression de compte utilisateur (RGPD Art. 17 — droit à l'effacement).
 *
 * Préserve l'ordre/cascade exact de la route d'origine :
 *   1. Nettoyage du storage (images input/output des générations) — NON bloquant
 *      (un échec storage ne doit pas empêcher la suppression du compte).
 *   2. Suppression des leads associés à l'email — NON bloquant (table optionnelle).
 *   3. Suppression du compte auth via service_role — BLOQUANT
 *      (déclenche la cascade SQL sur profiles / generations / credit_transactions /
 *      projects / referrals).
 *
 * L'identité (userId/email) provient TOUJOURS de la session côté route :
 * l'utilisateur ne peut supprimer que son propre compte.
 */
export class DeleteAccountUseCase {
  constructor(
    private readonly deletionRepo: IUserDeletionRepository,
    private readonly logger: ILoggerService,
  ) {}

  async execute(input: DeleteAccountInput): Promise<Result<{ deleted: true }>> {
    const { userId, email } = input;

    // 1. Nettoyage du storage — best effort, ne bloque jamais la suppression.
    const storage = await this.deletionRepo.deleteUserStorage(userId);
    if (!storage.success) {
      this.logger.error('[Delete Account] Storage cleanup error', storage.error as Error, { userId });
    }

    // 2. Suppression des leads par email — best effort (table optionnelle).
    if (email) {
      const leads = await this.deletionRepo.deleteLeadsByEmail(email);
      if (!leads.success) {
        this.logger.warn('[Delete Account] Leads cleanup ignored', { userId, error: leads.error.message });
      }
    }

    // 3. Suppression du compte auth (cascade) — bloquant.
    const authDelete = await this.deletionRepo.deleteAuthUser(userId);
    if (!authDelete.success) {
      this.logger.error('[Delete Account] Error', authDelete.error as Error, { userId });
      return failure(authDelete.error);
    }

    this.logger.info(`[Delete Account] User ${userId} deleted successfully`, { userId });

    return success({ deleted: true });
  }
}
