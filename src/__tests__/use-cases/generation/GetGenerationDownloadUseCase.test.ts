import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  GetGenerationDownloadUseCase,
  ImageUnavailableError,
} from '@/src/application/use-cases/generation/GetGenerationDownloadUseCase';
import {
  createMockGenerationRepository,
  createMockGeneration,
  createMockLogger,
} from '@/src/__tests__/mocks';
import { success, failure } from '@/src/shared/types/Result';
import { GenerationNotFoundError } from '@/src/domain/errors/GenerationNotFoundError';

describe('GetGenerationDownloadUseCase', () => {
  let useCase: GetGenerationDownloadUseCase;
  let mockGenerationRepo: ReturnType<typeof createMockGenerationRepository>;
  let mockLogger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    mockGenerationRepo = createMockGenerationRepository();
    mockLogger = createMockLogger();
    useCase = new GetGenerationDownloadUseCase(mockGenerationRepo, mockLogger);
  });

  it('renvoie l’URL et un nom de fichier quand la génération existe, appartient à l’utilisateur et a une image', async () => {
    const generation = createMockGeneration({
      id: 'gen-abc',
      userId: 'user-123',
      status: 'completed',
      outputImageUrl: 'https://storage.test/output.jpg',
    });
    mockGenerationRepo.findById = vi.fn().mockResolvedValue(success(generation));

    const result = await useCase.execute({ generationId: 'gen-abc', userId: 'user-123' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.outputImageUrl).toBe('https://storage.test/output.jpg');
      expect(result.data.fileName).toBe('instadeco-gen-abc.jpg');
    }
    expect(mockGenerationRepo.findById).toHaveBeenCalledWith('gen-abc');
  });

  it('renvoie GenerationNotFoundError quand la génération n’existe pas', async () => {
    mockGenerationRepo.findById = vi.fn().mockResolvedValue(success(null));

    const result = await useCase.execute({ generationId: 'missing', userId: 'user-123' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(GenerationNotFoundError);
      expect(result.error.statusCode).toBe(404);
    }
  });

  it('renvoie GenerationNotFoundError (404, pas 403) quand l’utilisateur n’est pas propriétaire', async () => {
    const generation = createMockGeneration({
      userId: 'owner-user',
      outputImageUrl: 'https://storage.test/output.jpg',
    });
    mockGenerationRepo.findById = vi.fn().mockResolvedValue(success(generation));

    const result = await useCase.execute({ generationId: 'gen-123', userId: 'different-user' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(GenerationNotFoundError);
    }
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Unauthorized download attempt',
      expect.any(Object),
    );
  });

  it('renvoie ImageUnavailableError (404) quand la génération n’a pas d’image de sortie', async () => {
    const generation = createMockGeneration({
      userId: 'user-123',
      status: 'pending',
      outputImageUrl: null,
    });
    mockGenerationRepo.findById = vi.fn().mockResolvedValue(success(generation));

    const result = await useCase.execute({ generationId: 'gen-123', userId: 'user-123' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ImageUnavailableError);
      expect(result.error.statusCode).toBe(404);
    }
  });

  it('masque une erreur d’infra du repository derrière un 404 et log l’erreur', async () => {
    mockGenerationRepo.findById = vi.fn().mockResolvedValue(failure(new Error('DB down')));

    const result = await useCase.execute({ generationId: 'gen-123', userId: 'user-123' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(GenerationNotFoundError);
    }
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
