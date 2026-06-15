import { vi } from 'vitest';
import { success } from '@/src/shared/types/Result';
import { IReferralRepository } from '@/src/domain/ports/repositories/IReferralRepository';

export function createMockReferralRepository(
  overrides: Partial<IReferralRepository> = {},
): IReferralRepository {
  return {
    getReferralCode: vi
      .fn()
      .mockResolvedValue(success({ referralCode: 'ABC123', columnMissing: false })),
    listReferralsByReferrer: vi.fn().mockResolvedValue(success([])),
    findReferrerByCode: vi.fn().mockResolvedValue(
      success({ id: 'referrer-1', email: 'parrain@test.com', full_name: 'Parrain' }),
    ),
    hasBeenReferred: vi.fn().mockResolvedValue(success(false)),
    createReferral: vi.fn().mockResolvedValue(success(undefined)),
    setReferredBy: vi.fn().mockResolvedValue(success(undefined)),
    ...overrides,
  };
}
