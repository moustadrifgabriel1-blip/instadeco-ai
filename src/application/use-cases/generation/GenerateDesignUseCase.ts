import { Result, success, failure } from '@/src/shared/types/Result';
import { Generation, CreateGenerationInput } from '@/src/domain/entities/Generation';
import { IGenerationRepository } from '@/src/domain/ports/repositories/IGenerationRepository';
import { ICreditRepository } from '@/src/domain/ports/repositories/ICreditRepository';
import { IImageGeneratorService } from '@/src/domain/ports/services/IImageGeneratorService';
import { IStorageService } from '@/src/domain/ports/services/IStorageService';
import { ILoggerService } from '@/src/domain/ports/services/ILoggerService';
import { InsufficientCreditsError } from '@/src/domain/errors/InsufficientCreditsError';
import { ImageGenerationError } from '@/src/domain/errors/ImageGenerationError';
import { DomainError } from '@/src/domain/errors/DomainError';
import { CREDIT_COSTS } from '@/src/shared/constants/pricing';

/**
 * Input pour la génération de design
 */
export interface GenerateDesignInput {
  userId: string;
  styleSlug: string;
  roomType: string;
  imageBase64: string;
  prompt: string;
}

/**
 * Output de la génération
 */
export interface GenerateDesignOutput {
  generation: Generation;
  creditsRemaining: number;
}

/**
 * Use Case: Générer un design d'intérieur
 * 
 * Orchestration:
 * 1. Vérifier les crédits de l'utilisateur
 * 2. Upload l'image source vers le storage
 * 3. Créer l'entrée en base (status: pending)
 * 4. Déduire les crédits
 * 5. Lancer la génération IA
 * 6. Mettre à jour avec le résultat
 */
export class GenerateDesignUseCase {
  constructor(
    private readonly generationRepo: IGenerationRepository,
    private readonly creditRepo: ICreditRepository,
    private readonly imageGenerator: IImageGeneratorService,
    private readonly storage: IStorageService,
    private readonly logger: ILoggerService,
  ) {}

  async execute(input: GenerateDesignInput): Promise<Result<GenerateDesignOutput, DomainError>> {
    const startTime = Date.now();
    
    this.logger.info('Starting design generation', {
      userId: input.userId,
      styleSlug: input.styleSlug,
      roomType: input.roomType,
    });

    // 1. Vérifier les crédits
    const creditsResult = await this.creditRepo.getBalance(input.userId);
    if (!creditsResult.success) {
      this.logger.error('Failed to get credits', creditsResult.error as Error);
      return failure(new ImageGenerationError('Impossible de vérifier les crédits'));
    }

    const currentCredits = creditsResult.data;
    const requiredCredits = CREDIT_COSTS.GENERATION;

    if (currentCredits < requiredCredits) {
      this.logger.warn('Insufficient credits', {
        userId: input.userId,
        currentCredits,
        requiredCredits,
      });
      return failure(new InsufficientCreditsError(currentCredits, requiredCredits));
    }

    // 2. Upload l'image source
    const uploadResult = await this.storage.uploadFromBase64(input.imageBase64, {
      bucket: 'input-images',
      fileName: `${input.userId}/${Date.now()}.jpg`,
      contentType: 'image/jpeg',
    });

    if (!uploadResult.success) {
      this.logger.error('Failed to upload image', uploadResult.error as Error);
      return failure(new ImageGenerationError('Échec de l\'upload de l\'image'));
    }

    const inputImageUrl = uploadResult.data.url;

    // 3. Créer l'entrée en base
    const createInput: CreateGenerationInput = {
      userId: input.userId,
      styleSlug: input.styleSlug,
      roomType: input.roomType,
      inputImageUrl,
      prompt: input.prompt,
    };

    const createResult = await this.generationRepo.create(createInput);
    if (!createResult.success) {
      this.logger.error('Failed to create generation record', createResult.error as Error);
      return failure(new ImageGenerationError('Échec de la création en base'));
    }

    const generation = createResult.data;

    // 4. Déduire les crédits
    const deductResult = await this.creditRepo.deductCredits(
      input.userId,
      requiredCredits,
      `Génération #${generation.id.slice(0, 8)}`,
      generation.id,
    );

    if (!deductResult.success) {
      // Rollback: supprimer la génération
      await this.generationRepo.delete(generation.id);
      this.logger.error('Failed to deduct credits', deductResult.error as Error);
      return failure(new ImageGenerationError('Échec de la déduction des crédits'));
    }

    const creditsRemaining = deductResult.data;

    // 5. Mettre à jour le statut à "processing"
    await this.generationRepo.update(generation.id, { status: 'processing' });

    // 6. Lancer la génération IA (Async)
    const genResult = await this.imageGenerator.generate({
      prompt: input.prompt,
      controlImageUrl: inputImageUrl,
      styleSlug: input.styleSlug,
      roomType: input.roomType,
      width: 1024,
      height: 1024,
      numInferenceSteps: 25,
      guidanceScale: 3.5,
    });

    if (!genResult.success) {
      // Marquer comme failed
      await this.generationRepo.update(generation.id, { status: 'failed' });
      this.logger.error('AI generation submission failed', genResult.error as Error, {
        generationId: generation.id,
      });
      return failure(new ImageGenerationError('La génération IA a échoué au lancement'));
    }

    // 7. Mettre à jour avec le providerId
    // On ne stocke pas encore l'image car elle n'est pas prête
    const updateResult = await this.generationRepo.update(generation.id, {
      status: 'pending', // Pending pour indiquer que c'est en attente externe
      providerId: genResult.data.providerId,
    });

     if (!updateResult.success) {
      this.logger.error('Failed to update generation with providerId', updateResult.error as Error);
      return failure(new ImageGenerationError('Échec de la mise à jour (providerId)'));
    }

    const duration = Date.now() - startTime;
    this.logger.info('Design generation submitted', {
      generationId: generation.id,
      providerId: genResult.data.providerId,
      userId: input.userId,
      duration,
    });

    return success({
      generation: updateResult.data,
      creditsRemaining,
    });
  }
}
