import { Result, success, failure } from '@/src/shared/types/Result';
import { Generation } from '@/src/domain/entities/Generation';
import { IGenerationRepository } from '@/src/domain/ports/repositories/IGenerationRepository';
import { IImageGeneratorService } from '@/src/domain/ports/services/IImageGeneratorService';
import { IStorageService } from '@/src/domain/ports/services/IStorageService';
import { ILoggerService } from '@/src/domain/ports/services/ILoggerService';
import { GenerationNotFoundError } from '@/src/domain/errors/GenerationNotFoundError';
import { DomainError } from '@/src/domain/errors/DomainError';

/**
 * Input pour récupérer le statut
 */
export interface GetGenerationStatusInput {
  generationId: string;
  userId?: string; // Optionnel pour vérification de propriété
}

/**
 * Use Case: Récupérer le statut d'une génération
 * Si le statut local est 'pending' ou 'processing', on vérifie auprès du provider (Fal.ai)
 * et on met à jour si terminé.
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

    // Si en attente et providerId existe, vérifier le statut externe
    if ((generation.status === 'pending' || generation.status === 'processing') && generation.providerId) {
      if (typeof this.imageGenerator.checkStatus === 'function') {
        this.logger.debug('Checking external status', { providerId: generation.providerId });
        
        const statusCheck = await this.imageGenerator.checkStatus(generation.providerId);
        
        if (statusCheck.success) {
          const { status, output } = statusCheck.data;
          this.logger.debug('External status response', { status, hasOutput: !!output?.imageUrl });
          
          if (status === 'succeeded' && output?.imageUrl) {
            // Télécharger et stocker l'image finale
            this.logger.info('Generation succeeded, uploading image...', { generationId: generation.id });
            
            const uploadResult = await this.storage.uploadFromUrl(output.imageUrl, {
              bucket: 'output-images',
              fileName: `${generation.userId}/${generation.id}.jpg`,
              contentType: 'image/jpeg',
            });

            if (uploadResult.success) {
              this.logger.info('Image uploaded, updating DB...', { url: uploadResult.data.url });
              
              const updatedGen = await this.generationRepo.update(generation.id, {
                 status: 'completed',
                 outputImageUrl: uploadResult.data.url
              });
              
              if (updatedGen.success) {
                this.logger.info('Generation completed successfully!', { generationId: generation.id });
                return success(updatedGen.data);
              } else {
                this.logger.error('Failed to update generation in DB', updatedGen.error as Error);
              }
            } else {
              this.logger.error('Failed to upload output image', uploadResult.error as Error);
              // CRITICAL FIX: Return the Fal.ai URL directly if Supabase upload fails
              // This prevents the generation from being stuck forever
              this.logger.warn('Fallback: Using Fal.ai URL directly');
              const fallbackUpdate = await this.generationRepo.update(generation.id, {
                status: 'completed',
                outputImageUrl: output.imageUrl
              });
              if (fallbackUpdate.success) return success(fallbackUpdate.data);
            }
          } else if (status === 'failed') {
            this.logger.error('External generation failed');
            const updatedGen = await this.generationRepo.update(generation.id, { status: 'failed' });
             if (updatedGen.success) return success(updatedGen.data);
          }
        } else {
          this.logger.error('External status check failed', statusCheck.error as Error);
        }
      }
    }

    return success(generation);
  }
}
