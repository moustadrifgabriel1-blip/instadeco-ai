import { Result, success, failure } from '@/src/shared/types/Result';
import { IGenerationRepository } from '@/src/domain/ports/repositories/IGenerationRepository';
import { ICreditRepository } from '@/src/domain/ports/repositories/ICreditRepository';
import { ILoggerService } from '@/src/domain/ports/services/ILoggerService';
import { CREDIT_COSTS } from '@/src/shared/constants/pricing';

export interface ReconcileStuckGenerationsInput {
  /** Âge minimal (ms) au-delà duquel une génération 'pending'/'processing' est zombie. Défaut 5 min. */
  olderThanMs?: number;
  /** Nombre max de générations traitées par run. Défaut 100. */
  limit?: number;
}

export interface ReconcileStuckGenerationsOutput {
  scanned: number;
  reconciled: number; // transitions effectives → failed (ce run)
  refunded: number; // remboursements réussis
  refundFailures: number; // remboursements en échec (crédit potentiellement perdu → à alerter)
}

/**
 * Use Case : réconciliation SERVEUR des générations zombies.
 *
 * Filet de sécurité indépendant du polling client. Si la fonction serverless est
 * tuée pendant `fal.run()` ET que l'utilisateur ferme l'onglet, la génération reste
 * 'processing' à vie : le crédit déduit n'est jamais remboursé. Ce use case (déclenché
 * par cron) détecte ces zombies et rembourse de façon IDEMPOTENTE.
 *
 * Anti double-remboursement : on rembourse UNIQUEMENT si `markFailedIfPending` a
 * réellement effectué la transition (UPDATE conditionnel atomique). En course avec
 * le polling client (GetGenerationStatusUseCase), un seul des deux transite → un seul
 * remboursement.
 */
export class ReconcileStuckGenerationsUseCase {
  constructor(
    private readonly generationRepo: IGenerationRepository,
    private readonly creditRepo: ICreditRepository,
    private readonly logger: ILoggerService,
  ) {}

  async execute(
    input: ReconcileStuckGenerationsInput = {},
  ): Promise<Result<ReconcileStuckGenerationsOutput>> {
    const olderThanMs = input.olderThanMs ?? 5 * 60 * 1000;
    const limit = input.limit ?? 100;

    const stuckResult = await this.generationRepo.findStuck(olderThanMs, limit);
    if (!stuckResult.success) {
      this.logger.error('Reconcile: échec récupération des générations bloquées', stuckResult.error as Error);
      return failure(stuckResult.error as Error);
    }

    const stuck = stuckResult.data;
    let reconciled = 0;
    let refunded = 0;
    let refundFailures = 0;

    for (const gen of stuck) {
      const transition = await this.generationRepo.markFailedIfPending(gen.id);
      if (!transition.success) {
        this.logger.error('Reconcile: échec transition → failed', transition.error as Error, { generationId: gen.id });
        continue;
      }

      // Déjà transité (polling client ou run concurrent) → ne PAS rembourser à nouveau.
      if (!transition.data.transitioned) {
        continue;
      }

      reconciled += 1;
      const refund = await this.creditRepo.addCredits(
        transition.data.generation.userId,
        CREDIT_COSTS.GENERATION,
        `Remboursement — réconciliation génération zombie #${gen.id.slice(0, 8)}`,
        undefined,
        'refund',
      );

      if (refund.success) {
        refunded += 1;
        this.logger.info('Reconcile: crédit remboursé (zombie)', {
          generationId: gen.id,
          userId: transition.data.generation.userId,
        });
      } else {
        refundFailures += 1;
        this.logger.error('CRITICAL: Reconcile échec remboursement crédit', refund.error as Error, {
          generationId: gen.id,
          userId: transition.data.generation.userId,
        });
      }
    }

    this.logger.info('Reconcile stuck generations terminé', { scanned: stuck.length, reconciled, refunded, refundFailures });
    return success({ scanned: stuck.length, reconciled, refunded, refundFailures });
  }
}
