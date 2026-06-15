import { vi } from 'vitest';
import { success } from '@/src/shared/types/Result';
import { IUserRepository } from '@/src/domain/ports/repositories/IUserRepository';
import { User } from '@/src/domain/entities/User';

export function createMockUserRepository(overrides: Partial<IUserRepository> = {}): IUserRepository {
  const mockUser: User = {
    id: 'user-123',
    email: 'user@test.com',
    fullName: 'Test User',
    avatarUrl: null,
    credits: 3,
    stripeCustomerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    create: vi.fn().mockResolvedValue(success(mockUser)),
    findById: vi.fn().mockResolvedValue(success(mockUser)),
    findByEmail: vi.fn().mockResolvedValue(success(mockUser)),
    update: vi.fn().mockResolvedValue(success(mockUser)),
    delete: vi.fn().mockResolvedValue(success(undefined)),
    exists: vi.fn().mockResolvedValue(success(true)),
    setMarketingConsentByEmail: vi.fn().mockResolvedValue(success(undefined)),
    ...overrides,
  };
}
