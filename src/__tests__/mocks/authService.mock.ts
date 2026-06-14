import { vi } from 'vitest';
import { success } from '@/src/shared/types/Result';
import { IAuthService } from '@/src/domain/ports/services/IAuthService';

/**
 * Mock du Auth Service pour les tests (provisionnement de compte guest checkout).
 */
export function createMockAuthService(overrides: Partial<IAuthService> = {}): IAuthService {
  return {
    provisionGuestForPurchase: vi.fn().mockResolvedValue(
      success({ userId: 'guest-user-1', created: true })
    ),
    ...overrides,
  };
}
