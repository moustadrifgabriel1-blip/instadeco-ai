import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetUserCreditsUseCase } from '@/src/application/use-cases/credits/GetUserCreditsUseCase';
import { createMockCreditRepository, createMockLogger } from '@/src/__tests__/mocks';
import { success, failure } from '@/src/shared/types/Result';

describe('GetUserCreditsUseCase', () => {
  let useCase: GetUserCreditsUseCase;
  let mockCreditRepo: ReturnType<typeof createMockCreditRepository>;
  let mockLogger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    mockCreditRepo = createMockCreditRepository();
    mockLogger = createMockLogger();
    useCase = new GetUserCreditsUseCase(mockCreditRepo, mockLogger);
  });

  describe('execute', () => {
    it('should return credits balance successfully', async () => {
      // Arrange
      const userId = 'user-123';
      mockCreditRepo.getBalance = vi.fn().mockResolvedValue(success(25));

      // Act
      const result = await useCase.execute({ userId });

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.balance).toBe(25);
      }
      expect(mockCreditRepo.getBalance).toHaveBeenCalledWith(userId);
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

    it('should handle repository error gracefully', async () => {
      // Arrange
      mockCreditRepo.getBalance = vi.fn().mockResolvedValue(
        failure(new Error('Database connection failed'))
      );

      // Act
      const result = await useCase.execute({ userId: 'user-123' });

      // Assert
      expect(result.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should log debug message when getting credits', async () => {
      // Arrange
      const userId = 'user-456';

      // Act
      await useCase.execute({ userId });

      // Assert
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Getting user credits',
        expect.objectContaining({ userId })
      );
    });
  });
});
