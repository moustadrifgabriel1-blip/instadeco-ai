import { vi } from 'vitest';
import { success } from '@/src/shared/types/Result';
import {
  IUserDataExportRepository,
  UserDataExportRaw,
} from '@/src/domain/ports/repositories/IUserDataExportRepository';

export const emptyUserDataExportRaw: UserDataExportRaw = {
  profile: null,
  generations: [],
  creditTransactions: [],
  projects: [],
  referralsGiven: [],
  referralsReceived: [],
};

export function createMockUserDataExportRepository(
  overrides: Partial<IUserDataExportRepository> = {},
): IUserDataExportRepository {
  return {
    fetchAll: vi.fn().mockResolvedValue(success(emptyUserDataExportRaw)),
    ...overrides,
  };
}
