import { vi } from 'vitest';
import { Result, success, failure } from '@/src/shared/types/Result';
import { ICreditRepository } from '@/src/domain/ports/repositories/ICreditRepository';
import { CreditTransaction, CreditTransactionType } from '@/src/domain/entities/Credit';

/**
 * Crée une transaction mock
 */
function createMockTransaction(overrides: Partial<CreditTransaction> = {}): CreditTransaction {
  return {
    id: 'txn-123',
    userId: 'user-123',
    amount: 1,
    type: 'generation' as CreditTransactionType,
    description: 'Test transaction',
    stripeSessionId: null,
    generationId: null,
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Mock du Credit Repository pour les tests
 */
export function createMockCreditRepository(overrides: Partial<ICreditRepository> = {}): ICreditRepository {
  return {
    getBalance: vi.fn().mockResolvedValue(success(10)),
    addCredits: vi.fn().mockResolvedValue(success(15)),
    deductCredits: vi.fn().mockResolvedValue(success(9)),
    createTransaction: vi.fn().mockResolvedValue(success(createMockTransaction())),
    getTransactionHistory: vi.fn().mockResolvedValue(success([])),
    hasEnoughCredits: vi.fn().mockResolvedValue(success(true)),
    ...overrides,
  };
}

export { createMockTransaction };
