import { Result, success, failure } from '@/src/shared/types/Result';
import { IGenerationRepository } from '@/src/domain/ports/repositories/IGenerationRepository';
import { ILoggerService } from '@/src/domain/ports/services/ILoggerService';
import { GenerationNotFoundError } from '@/src/domain/errors/GenerationNotFoundError';
import { DomainError } from '@/src/domain/errors/DomainError';

/**
 * Input pour récupérer l'URL de téléchargement d'une génération.
 */
export interface GetGenerationDownloadInput {
  generationId: string;
  /** Toujours issu de la session — la propriété est obligatoirement vérifiée. */
  userId: string;
}

/**
 * Sortie : l'URL source de l'image et un nom de fichier suggéré.
 * La route reste responsable du fetch (safeFetchImage anti-SSRF + timeout),
 * du streaming des octets et des headers HTTP.
 */
export interface GetGenerationDownloadOutput {
  /** URL d'origine externe (output Fal/Gemini / storage) — à fetcher via safeFetchImage. */
  outputImageUrl: string;
  /** Nom de fichier suggéré pour le Content-Disposition. */
  fileName: string;
}

/**
 * Use Case: récupérer l'URL de téléchargement d'une génération.
 *
 * Valide l'existence ET la propriété (le userId vient de la session, jamais du
 * body/query) puis renvoie l'URL de l'image de sortie. Préserve la sémantique
 * de l'ancienne route :
 *  - génération inexistante OU non possédée → GenerationNotFoundError (404)
 *  - génération sans image de sortie → ImageUnavailableError (404)
 *
 * Le transport (fetch SSRF-safe, streaming, headers) reste dans la route.
 */
export class GetGenerationDownloadUseCase {
  constructor(
    private readonly generationRepo: IGenerationRepository,
    private readonly logger: ILoggerService,
  ) {}

  async execute(
    input: GetGenerationDownloadInput,
  ): Promise<Result<GetGenerationDownloadOutput, DomainError>> {
    this.logger.debug('Getting generation download URL', {
      generationId: input.generationId,
    });

    const result = await this.generationRepo.findById(input.generationId);

    if (!result.success) {
      this.logger.error('Failed to load generation for download', result.error as Error, {
        generationId: input.generationId,
      });
      // On masque l'erreur d'infra derrière un 404 (comportement historique de la route).
      return failure(new GenerationNotFoundError(input.generationId));
    }

    const generation = result.data;

    if (!generation) {
      return failure(new GenerationNotFoundError(input.generationId));
    }

    // Vérification de propriété : équivalent du `.eq('user_id', user.id)` historique.
    // Échec → 404 (et non 403) pour ne pas révéler l'existence d'une ressource tierce.
    if (generation.userId !== input.userId) {
      this.logger.warn('Unauthorized download attempt', {
        generationId: input.generationId,
        requestedBy: input.userId,
        ownedBy: generation.userId,
      });
      return failure(new GenerationNotFoundError(input.generationId));
    }

    if (!generation.outputImageUrl) {
      return failure(new ImageUnavailableError(input.generationId));
    }

    return success({
      outputImageUrl: generation.outputImageUrl,
      fileName: `instadeco-${generation.id}.jpg`,
    });
  }
}

/**
 * Erreur : l'image de sortie de la génération n'est pas (encore) disponible.
 * Mappée sur un 404 par la route (message « Image non disponible »).
 */
export class ImageUnavailableError extends DomainError {
  readonly code = 'GENERATION_IMAGE_UNAVAILABLE';
  readonly statusCode = 404;
  readonly generationId: string;

  constructor(generationId: string) {
    super(`Image non disponible: ${generationId}`);
    this.generationId = generationId;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      generationId: this.generationId,
    };
  }
}
