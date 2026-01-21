import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AddCreditsUseCase } from '@/src/application/use-cases/credits/AddCreditsUseCase';
import { createMockCreditRepository, createMockLogger } from '@/src/__tests__/mocks';
import { success, failure } from '@/src/shared/types/Result';

describe('AddCreditsUseCase', () => {
  let useCase: AddCreditsUseCase;
  let mockCreditRepo: ReturnType<typeof createMockCreditRepository>;
  let mockLogger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    mockCreditRepo = createMockCreditRepository();
    mockLogger = createMockLogger();
    useCase = new AddCreditsUseCase(mockCreditRepo, mockLogger);
  });

  describe('execute', () => {
    it('should add credits successfully', async () => {
      // Arrange
      const input = {
        userId: 'user-123',
        amount: 10,
        description: 'Starter pack purchase',
        stripeSessionId: 'cs_test_123',
      };
      mockCreditRepo.addCredits = vi.fn().mockResolvedValue(success(35));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.newBalance).toBe(35);
        expect(result.data.creditsAdded).toBe(10);
      }
      expect(mockCreditRepo.addCredits).toHaveBeenCalledWith(
        input.userId,
        input.amount,
        input.description,
        input.stripeSessionId
      );
    });

    it('should return validation error when userId is empty', async () => {
      // Act
      const result = await useCase.execute({
        userId: '',
        amount: 10,
        description: 'Test',
      });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('userId');
      }
    });

    it('should return validation error when amount is zero', async () => {
      // Act
      const result = await useCase.execute({
        userId: 'user-123',
        amount: 0,
        description: 'Test',
      });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('positif');
      }
    });

    it('should return validation error when amount is negative', async () => {
      // Act
      const result = await useCase.execute({
        userId: 'user-123',
        amount: -5,
        description: 'Test',
      });

      // Assert
      expect(result.success).toBe(false);
    });

    it('should handle repository error gracefully', async () => {
      // Arrange
      mockCreditRepo.addCredits = vi.fn().mockResolvedValue(
        failure(new Error('Database error'))
      );

      // Act
      const result = await useCase.execute({
        userId: 'user-123',
        amount: 10,
        description: 'Test',
      });

      // Assert
      expect(result.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should log successful credit addition', async () => {
      // Arrange
      mockCreditRepo.addCredits = vi.fn().mockResolvedValue(success(20));

      // Act
      await useCase.execute({
        userId: 'user-123',
        amount: 10,
        description: 'Test',
      });

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Credits added successfully',
        expect.objectContaining({
          userId: 'user-123',
          creditsAdded: 10,
          newBalance: 20,
        })
      );
    });
  });
});
