import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetGenerationStatusUseCase } from '@/src/application/use-cases/generation/GetGenerationStatusUseCase';
import { 
  createMockGenerationRepository, 
  createMockGeneration,
  createMockLogger 
} from '@/src/__tests__/mocks';
import { success, failure } from '@/src/shared/types/Result';
import { GenerationNotFoundError } from '@/src/domain/errors/GenerationNotFoundError';
import { IImageGeneratorService } from '@/src/domain/ports/services/IImageGeneratorService';
import { IStorageService } from '@/src/domain/ports/services/IStorageService';

// Mock pour le service de génération d'images
const createMockImageGeneratorService = (): IImageGeneratorService => ({
  generate: vi.fn().mockResolvedValue(success({ imageUrl: '', providerId: 'test-id', status: 'pending' })),
  checkStatus: vi.fn().mockResolvedValue(success({ status: 'succeeded', output: { imageUrl: 'https://example.com/image.jpg' } })),
});

// Mock pour le service de stockage
const createMockStorageService = (): IStorageService => ({
  uploadFromBuffer: vi.fn().mockResolvedValue(success({ url: 'https://storage.example.com/image.jpg', path: 'image.jpg' })),
  uploadFromBase64: vi.fn().mockResolvedValue(success({ url: 'https://storage.example.com/image.jpg', path: 'image.jpg' })),
  uploadFromUrl: vi.fn().mockResolvedValue(success({ url: 'https://storage.example.com/image.jpg', path: 'image.jpg' })),
  getPublicUrl: vi.fn().mockReturnValue(success('https://storage.example.com/image.jpg')),
  delete: vi.fn().mockResolvedValue(success(undefined)),
  createSignedUrl: vi.fn().mockResolvedValue(success('https://signed.example.com/image.jpg')),
});

describe('GetGenerationStatusUseCase', () => {
  let useCase: GetGenerationStatusUseCase;
  let mockGenerationRepo: ReturnType<typeof createMockGenerationRepository>;
  let mockImageGenerator: IImageGeneratorService;
  let mockStorage: IStorageService;
  let mockLogger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    mockGenerationRepo = createMockGenerationRepository();
    mockImageGenerator = createMockImageGeneratorService();
    mockStorage = createMockStorageService();
    mockLogger = createMockLogger();
    useCase = new GetGenerationStatusUseCase(mockGenerationRepo, mockImageGenerator, mockStorage, mockLogger);
  });

  describe('execute', () => {
    it('should return generation status successfully', async () => {
      // Arrange
      const generationId = 'gen-123';
      const mockGeneration = createMockGeneration({ id: generationId, status: 'completed' });
      mockGenerationRepo.findById = vi.fn().mockResolvedValue(success(mockGeneration));

      // Act
      const result = await useCase.execute({ generationId });

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(generationId);
        expect(result.data.status).toBe('completed');
      }
    });

    it('should return not found error when generation does not exist', async () => {
      // Arrange
      mockGenerationRepo.findById = vi.fn().mockResolvedValue(success(null));

      // Act
      const result = await useCase.execute({ generationId: 'non-existent' });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(GenerationNotFoundError);
      }
    });

    it('should return not found error when user does not own the generation', async () => {
      // Arrange
      const mockGeneration = createMockGeneration({ userId: 'owner-user' });
      mockGenerationRepo.findById = vi.fn().mockResolvedValue(success(mockGeneration));

      // Act
      const result = await useCase.execute({
        generationId: 'gen-123',
        userId: 'different-user',
      });

      // Assert
      expect(result.success).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Unauthorized access attempt',
        expect.any(Object)
      );
    });

    it('should allow access when userId matches generation owner', async () => {
      // Arrange
      const userId = 'user-123';
      const mockGeneration = createMockGeneration({ userId });
      mockGenerationRepo.findById = vi.fn().mockResolvedValue(success(mockGeneration));

      // Act
      const result = await useCase.execute({
        generationId: 'gen-123',
        userId,
      });

      // Assert
      expect(result.success).toBe(true);
    });

    it('should handle repository error gracefully', async () => {
      // Arrange
      mockGenerationRepo.findById = vi.fn().mockResolvedValue(
        failure(new Error('Database error'))
      );

      // Act
      const result = await useCase.execute({ generationId: 'gen-123' });

      // Assert
      expect(result.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should log debug message when getting status', async () => {
      // Arrange
      const generationId = 'gen-456';
      const mockGeneration = createMockGeneration({ id: generationId });
      mockGenerationRepo.findById = vi.fn().mockResolvedValue(success(mockGeneration));

      // Act
      await useCase.execute({ generationId });

      // Assert
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Getting generation status',
        expect.objectContaining({ generationId })
      );
    });
  });
});
