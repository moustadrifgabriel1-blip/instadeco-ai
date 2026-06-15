import { vi } from 'vitest';
import { success } from '@/src/shared/types/Result';
import { ILeadRepository } from '@/src/domain/ports/repositories/ILeadRepository';

export function createMockLeadRepository(overrides: Partial<ILeadRepository> = {}): ILeadRepository {
  return {
    existsByEmail: vi.fn().mockResolvedValue(success(false)),
    create: vi.fn().mockResolvedValue(success(undefined)),
    markUnsubscribed: vi.fn().mockResolvedValue(success(undefined)),
    ...overrides,
  };
}
