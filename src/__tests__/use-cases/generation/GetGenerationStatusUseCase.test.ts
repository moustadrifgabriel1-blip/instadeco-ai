import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetGenerationStatusUseCase } from '@/src/application/use-cases/generation/GetGenerationStatusUseCase';
import { 
  createMockGenerationRepository, 
  createMockGeneration,
  createMockLogger 
} from '@/src/__tests__/mocks';
import { success, failure } from '@/src/shared/types/Result';
import { GenerationNotFoundError } from '@/src/domain/errors/GenerationNotFoundError';

describe('GetGenerationStatusUseCase', () => {
  let useCase: GetGenerationStatusUseCase;
  let mockGenerationRepo: ReturnType<typeof createMockGenerationRepository>;
  let mockLogger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    mockGenerationRepo = createMockGenerationRepository();
    mockLogger = createMockLogger();
    useCase = new GetGenerationStatusUseCase(mockGenerationRepo, mockLogger);
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
