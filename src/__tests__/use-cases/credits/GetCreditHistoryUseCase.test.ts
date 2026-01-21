import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetCreditHistoryUseCase } from '@/src/application/use-cases/credits/GetCreditHistoryUseCase';
import { createMockCreditRepository, createMockLogger, createMockTransaction } from '@/src/__tests__/mocks';
import { success, failure } from '@/src/shared/types/Result';
import { CreditTransaction, CreditTransactionType } from '@/src/domain/entities/Credit';

describe('GetCreditHistoryUseCase', () => {
  let useCase: GetCreditHistoryUseCase;
  let mockCreditRepo: ReturnType<typeof createMockCreditRepository>;
  let mockLogger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    mockCreditRepo = createMockCreditRepository();
    mockLogger = createMockLogger();
    useCase = new GetCreditHistoryUseCase(mockCreditRepo, mockLogger);
  });

  describe('execute', () => {
    it('should return credit history successfully', async () => {
      // Arrange
      const userId = 'user-123';
      const mockTransactions: CreditTransaction[] = [
        createMockTransaction({
          id: 'txn-1',
          userId,
          amount: 10,
          type: 'purchase' as CreditTransactionType,
          description: 'Starter pack',
        }),
        createMockTransaction({
          id: 'txn-2',
          userId,
          amount: -1,
          type: 'generation' as CreditTransactionType,
          description: 'Generation',
        }),
      ];
      mockCreditRepo.getTransactionHistory = vi.fn().mockResolvedValue(success(mockTransactions));

      // Act
      const result = await useCase.execute({ userId });

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].type).toBe('purchase');
      }
    });

    it('should return empty array when no history exists', async () => {
      // Arrange
      mockCreditRepo.getTransactionHistory = vi.fn().mockResolvedValue(success([]));

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
      mockCreditRepo.getTransactionHistory = vi.fn().mockResolvedValue(success([]));

      // Act
      await useCase.execute({ userId, limit });

      // Assert
      expect(mockCreditRepo.getTransactionHistory).toHaveBeenCalledWith(userId, limit);
    });

    it('should use default limit of 50 when not specified', async () => {
      // Arrange
      const userId = 'user-123';
      mockCreditRepo.getTransactionHistory = vi.fn().mockResolvedValue(success([]));

      // Act
      await useCase.execute({ userId });

      // Assert
      expect(mockCreditRepo.getTransactionHistory).toHaveBeenCalledWith(userId, 50);
    });

    it('should handle repository error gracefully', async () => {
      // Arrange
      mockCreditRepo.getTransactionHistory = vi.fn().mockResolvedValue(
        failure(new Error('Database error'))
      );

      // Act
      const result = await useCase.execute({ userId: 'user-123' });

      // Assert
      expect(result.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
