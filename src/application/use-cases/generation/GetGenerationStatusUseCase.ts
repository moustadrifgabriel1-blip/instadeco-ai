import { Result, success, failure } from '@/src/shared/types/Result';
import { Generation } from '@/src/domain/entities/Generation';
import { IGenerationRepository } from '@/src/domain/ports/repositories/IGenerationRepository';
import { IImageGeneratorService } from '@/src/domain/ports/services/IImageGeneratorService';
import { IStorageService } from '@/src/domain/ports/services/IStorageService';
import { ILoggerService } from '@/src/domain/ports/services/ILoggerService';
import { GenerationNotFoundError } from '@/src/domain/errors/GenerationNotFoundError';
import { DomainError } from '@/src/domain/errors/DomainError';

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

        const updatedGen = await this.generationRepo.update(generation.id, {
          status: 'failed',
        });

        if (updatedGen.success) {
          return success(updatedGen.data);
        }
      }
    }

    return success(generation);
  }
}
