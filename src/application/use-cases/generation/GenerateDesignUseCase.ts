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
 * Extraire les dimensions d'une image à partir de son base64 (JPEG/PNG)
 * Utilise les headers binaires pour éviter de charger l'image complète
 */
function getImageDimensionsFromBase64(base64: string): { width: number; height: number } | null {
  try {
    // Nettoyer le prefix data:image/...;base64,
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // PNG: dimensions aux octets 16-23
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }
    
    // JPEG: chercher le marqueur SOF0/SOF2
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
      let offset = 2;
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xFF) break;
        const marker = buffer[offset + 1];
        // SOF0 (0xC0), SOF1 (0xC1), SOF2 (0xC2)
        if (marker >= 0xC0 && marker <= 0xC2) {
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          return { width, height };
        }
        const length = buffer.readUInt16BE(offset + 2);
        offset += 2 + length;
      }
    }
    
    // WEBP: "RIFF" + 4 bytes size + "WEBP" + chunk type
    if (buffer.length > 30 &&
        buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
      // VP8 lossy
      if (buffer[12] === 0x56 && buffer[13] === 0x50 && buffer[14] === 0x38 && buffer[15] === 0x20) {
        const width = buffer.readUInt16LE(26) & 0x3FFF;
        const height = buffer.readUInt16LE(28) & 0x3FFF;
        return { width, height };
      }
      // VP8L lossless
      if (buffer[12] === 0x56 && buffer[13] === 0x50 && buffer[14] === 0x38 && buffer[15] === 0x4C) {
        const bits = buffer.readUInt32LE(21);
        const width = (bits & 0x3FFF) + 1;
        const height = ((bits >> 14) & 0x3FFF) + 1;
        return { width, height };
      }
      // VP8X extended
      if (buffer[12] === 0x56 && buffer[13] === 0x50 && buffer[14] === 0x38 && buffer[15] === 0x58) {
        const width = (buffer.readUIntLE(24, 3) + 1);
        const height = (buffer.readUIntLE(27, 3) + 1);
        return { width, height };
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Input pour la génération de design
 */
export interface GenerateDesignInput {
  userId: string;
  styleSlug: string;
  roomType: string;
  imageBase64: string;
  prompt: string;
  /** Mode de transformation: full_redesign, keep_layout, decor_only */
  transformMode?: 'full_redesign' | 'keep_layout' | 'decor_only';
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

    // 2. Extraire les dimensions de l'image source
    const imageDimensions = getImageDimensionsFromBase64(input.imageBase64);
    const imageWidth = imageDimensions?.width || 1024;
    const imageHeight = imageDimensions?.height || 1024;
    
    this.logger.info('Detected image dimensions', { imageWidth, imageHeight });

    // 3. Upload l'image source
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

    // 4. Créer l'entrée en base
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

    // 7. Lancer la génération IA (Async)
    // Utiliser une URL signée temporaire pour que Fal.ai puisse accéder à l'image
    let controlImageUrl = inputImageUrl;
    
    // Si l'URL est une URL Supabase Storage, générer une URL signée (1h)
    if (inputImageUrl.includes('supabase')) {
      // Extraire le path depuis l'URL publique (après /object/public/input-images/)
      const pathMatch = inputImageUrl.match(/\/input-images\/(.+)$/);
      if (pathMatch) {
        const filePath = pathMatch[1];
        const signedResult = await this.storage.createSignedUrl('input-images', filePath, 3600);
        if (signedResult.success) {
          controlImageUrl = signedResult.data;
          this.logger.info('Using signed URL for Fal.ai access');
        } else {
          // Fallback: envoyer le base64 directement à Fal.ai
          controlImageUrl = input.imageBase64;
          this.logger.warn('Signed URL failed, sending base64 to Fal.ai directly');
        }
      } else {
        // Fallback: envoyer le base64 directement
        controlImageUrl = input.imageBase64;
        this.logger.warn('Could not extract path from Supabase URL, sending base64');
      }
    }

    const genResult = await this.imageGenerator.generate({
      prompt: input.prompt,
      controlImageUrl,
      styleSlug: input.styleSlug,
      roomType: input.roomType,
      transformMode: input.transformMode || 'full_redesign',
      width: imageWidth,
      height: imageHeight,
      numInferenceSteps: 25,
      guidanceScale: 3.5,
    });

    if (!genResult.success) {
      // Marquer comme failed
      await this.generationRepo.update(generation.id, { status: 'failed' });
      this.logger.error('AI generation failed', genResult.error as Error, {
        generationId: generation.id,
      });
      return failure(new ImageGenerationError('La génération IA a échoué'));
    }

    // 7. L'image est déjà générée (fal.run synchrone) → Upload vers Supabase Storage
    const outputImageUrl = genResult.data.imageUrl;
    let finalOutputUrl = outputImageUrl;

    if (outputImageUrl) {
      const uploadOutputResult = await this.storage.uploadFromUrl(outputImageUrl, {
        bucket: 'output-images',
        fileName: `${input.userId}/${generation.id}.jpg`,
        contentType: 'image/jpeg',
      });

      if (uploadOutputResult.success) {
        finalOutputUrl = uploadOutputResult.data.url;
        this.logger.info('Output image uploaded to Supabase Storage', {
          generationId: generation.id,
        });
      } else {
        // Fallback: utiliser l'URL fal.ai directement (temporaire)
        this.logger.warn('Failed to upload output to storage, using fal.ai URL directly', {
          error: (uploadOutputResult.error as Error)?.message,
        });
      }
    }

    // 8. Mettre à jour comme completed avec l'image finale
    const updateResult = await this.generationRepo.update(generation.id, {
      status: 'completed',
      outputImageUrl: finalOutputUrl,
      providerId: genResult.data.providerId || '',
    });

     if (!updateResult.success) {
      this.logger.error('Failed to update generation with providerId', updateResult.error as Error);
      return failure(new ImageGenerationError('Échec de la mise à jour (providerId)'));
    }

    const duration = Date.now() - startTime;
    this.logger.info('Design generation completed', {
      generationId: generation.id,
      userId: input.userId,
      duration,
      hasOutputImage: !!finalOutputUrl,
    });

    return success({
      generation: updateResult.data,
      creditsRemaining,
    });
  }
}
