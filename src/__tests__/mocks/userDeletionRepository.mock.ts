import { vi } from 'vitest';
import { success } from '@/src/shared/types/Result';
import { IUserDeletionRepository } from '@/src/domain/ports/repositories/IUserDeletionRepository';

export function createMockUserDeletionRepository(
  overrides: Partial<IUserDeletionRepository> = {},
): IUserDeletionRepository {
  return {
    deleteUserStorage: vi.fn().mockResolvedValue(success(undefined)),
    deleteLeadsByEmail: vi.fn().mockResolvedValue(success(undefined)),
    deleteAuthUser: vi.fn().mockResolvedValue(success(undefined)),
    ...overrides,
  };
}
