import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ListUserGenerationsUseCase } from '@/src/application/use-cases/generation/ListUserGenerationsUseCase';
import { 
  createMockGenerationRepository, 
  createMockGeneration,
  createMockLogger 
} from '@/src/__tests__/mocks';
import { success, failure } from '@/src/shared/types/Result';

describe('ListUserGenerationsUseCase', () => {
  let useCase: ListUserGenerationsUseCase;
  let mockGenerationRepo: ReturnType<typeof createMockGenerationRepository>;
  let mockLogger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    mockGenerationRepo = createMockGenerationRepository();
    mockLogger = createMockLogger();
    useCase = new ListUserGenerationsUseCase(mockGenerationRepo, mockLogger);
  });

  describe('execute', () => {
    it('should return list of generations successfully', async () => {
      // Arrange
      const userId = 'user-123';
      const mockGenerations = [
        createMockGeneration({ id: 'gen-1', status: 'completed' }),
        createMockGeneration({ id: 'gen-2', status: 'pending' }),
        createMockGeneration({ id: 'gen-3', status: 'processing' }),
      ];
      mockGenerationRepo.findByUserId = vi.fn().mockResolvedValue(success(mockGenerations));

      // Act
      const result = await useCase.execute({ userId });

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(3);
        expect(result.data[0].id).toBe('gen-1');
      }
    });

    it('should return empty array when user has no generations', async () => {
      // Arrange
      mockGenerationRepo.findByUserId = vi.fn().mockResolvedValue(success([]));

      // Act
      const result = await useCase.execute({ userId: 'new-user' });

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });

    it('should return validation error when userId is empty', async () => {
      // Act
      const result = await useCase.execute({ userId: '' });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('userId');
      }
    });

    it('should respect limit parameter', async () => {
      // Arrange
      const userId = 'user-123';
      const limit = 10;

      // Act
      await useCase.execute({ userId, limit });

      // Assert
      expect(mockGenerationRepo.findByUserId).toHaveBeenCalledWith(userId, limit);
    });

    it('should use default limit of 50 when not specified', async () => {
      // Arrange
      const userId = 'user-123';

      // Act
      await useCase.execute({ userId });

      // Assert
      expect(mockGenerationRepo.findByUserId).toHaveBeenCalledWith(userId, 50);
    });

    it('should handle repository error gracefully', async () => {
      // Arrange
      mockGenerationRepo.findByUserId = vi.fn().mockResolvedValue(
        failure(new Error('Database error'))
      );

      // Act
      const result = await useCase.execute({ userId: 'user-123' });

      // Assert
      expect(result.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should log debug messages for listing and result count', async () => {
      // Arrange
      const userId = 'user-456';
      const mockGenerations = [createMockGeneration()];
      mockGenerationRepo.findByUserId = vi.fn().mockResolvedValue(success(mockGenerations));

      // Act
      await useCase.execute({ userId });

      // Assert
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Listing user generations',
        expect.objectContaining({ userId })
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Generations retrieved',
        expect.objectContaining({ userId, count: 1 })
      );
    });
  });
});
