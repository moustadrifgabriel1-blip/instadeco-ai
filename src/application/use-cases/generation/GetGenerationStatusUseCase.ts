import { Result, success, failure } from '@/src/shared/types/Result';
import { Generation } from '@/src/domain/entities/Generation';
import { IGenerationRepository } from '@/src/domain/ports/repositories/IGenerationRepository';
import { ICreditRepository } from '@/src/domain/ports/repositories/ICreditRepository';
import { IImageGeneratorService } from '@/src/domain/ports/services/IImageGeneratorService';
import { IStorageService } from '@/src/domain/ports/services/IStorageService';
import { ILoggerService } from '@/src/domain/ports/services/ILoggerService';
import { GenerationNotFoundError } from '@/src/domain/errors/GenerationNotFoundError';
import { DomainError } from '@/src/domain/errors/DomainError';
import { CREDIT_COSTS } from '@/src/shared/constants/pricing';

/**
 * ⚠️ FICHIER CRITIQUE — NE PAS MODIFIER SANS RAISON MAJEURE
 * 
 * Ce Use Case est appelé par le polling client (GET /api/v2/generations/[id]/status)
 * pour vérifier si une génération est terminée.
 * 
 * ARCHITECTURE (février 2026) :
 * - La génération utilise fal.run() SYNCHRONE dans GenerateDesignUseCase
 * - Le résultat est déjà en DB avec status='completed' + outputImageUrl quand ce use case est appelé
 * - Ce use case ne fait QUE lire la DB et retourner le statut
 * - Il NE contacte PAS fal.ai (plus besoin, tout est synchrone)
 * 
 * Si une génération est bloquée en 'processing' > 2 min, on la marque en 'failed'
 * (sécurité anti-zombies si le serveur crash pendant fal.run).
 */

/**
 * Input pour récupérer le statut
 */
export interface GetGenerationStatusInput {
  generationId: string;
  userId?: string; // Optionnel pour vérification de propriété
}

/**
 * Use Case: Récupérer le statut d'une génération
 * 
 * Avec l'architecture synchrone (fal.run), le statut est déjà en DB.
 * Ce use case gère aussi les cas zombies (génération bloquée).
 */
export class GetGenerationStatusUseCase {
  constructor(
    private readonly generationRepo: IGenerationRepository,
    private readonly creditRepo: ICreditRepository,
    private readonly imageGenerator: IImageGeneratorService,
    private readonly storage: IStorageService,
    private readonly logger: ILoggerService,
  ) {}

  async execute(input: GetGenerationStatusInput): Promise<Result<Generation, DomainError>> {
    this.logger.debug('Getting generation status', {
      generationId: input.generationId,
    });

    const result = await this.generationRepo.findById(input.generationId);

    if (!result.success) {
      this.logger.error('Failed to get generation', result.error as Error);
      return failure(new GenerationNotFoundError(input.generationId));
    }

    const generation = result.data;

    if (!generation) {
      return failure(new GenerationNotFoundError(input.generationId));
    }

    // Vérifier la propriété si userId fourni
    if (input.userId && generation.userId !== input.userId) {
      this.logger.warn('Unauthorized access attempt', {
        generationId: input.generationId,
        requestedBy: input.userId,
        ownedBy: generation.userId,
      });
      return failure(new GenerationNotFoundError(input.generationId));
    }

    // Si statut complet ou échoué, retourner directement
    if (generation.status === 'completed' || generation.status === 'failed') {
      return success(generation);
    }

    // Protection anti-zombie : si une génération est en 'pending' ou 'processing'  
    // depuis plus de 2 minutes, c'est que le serveur a crashé pendant fal.run()
    // → marquer comme 'failed' pour débloquer l'utilisateur
    if (generation.status === 'pending' || generation.status === 'processing') {
      const ageMs = Date.now() - new Date(generation.updatedAt).getTime();
      const TWO_MINUTES = 2 * 60 * 1000;

      if (ageMs > TWO_MINUTES) {
        this.logger.warn('Zombie generation detected, marking as failed', {
          generationId: generation.id,
          ageMs,
          status: generation.status,
        });

        // Transition conditionnelle atomique : garantit qu'UN SEUL appelant
        // (sous polling concurrent toutes les 3s) effectue réellement la
        // transition processing/pending → failed, et donc qu'on ne rembourse
        // qu'une seule fois.
        const transitionResult = await this.generationRepo.markFailedIfPending(generation.id);

        if (!transitionResult.success) {
          this.logger.error(
            'Failed to mark zombie generation as failed',
            transitionResult.error as Error,
            { generationId: generation.id },
          );
          // On retourne l'état lu : l'utilisateur retentera au prochain poll.
          return success(generation);
        }

        const { transitioned, generation: updatedGen } = transitionResult.data;

        // 🔴 REMBOURSEMENT — l'utilisateur ne doit JAMAIS perdre un crédit pour
        // une génération ratée. On ne rembourse QUE si CET appel a réellement
        // effectué la transition (anti double-remboursement).
        if (transitioned) {
          const refundResult = await this.creditRepo.addCredits(
            updatedGen.userId,
            CREDIT_COSTS.GENERATION,
            `Remboursement — génération zombie #${updatedGen.id.slice(0, 8)}`,
          );

          if (refundResult.success) {
            this.logger.info('Credits refunded for zombie generation', {
              userId: updatedGen.userId,
              generationId: updatedGen.id,
              amount: CREDIT_COSTS.GENERATION,
            });
          } else {
            this.logger.error(
              'CRITICAL: Failed to refund credits for zombie generation',
              refundResult.error as Error,
              { userId: updatedGen.userId, generationId: updatedGen.id },
            );
          }
        }

        return success(updatedGen);
      }
    }

    return success(generation);
  }
}
