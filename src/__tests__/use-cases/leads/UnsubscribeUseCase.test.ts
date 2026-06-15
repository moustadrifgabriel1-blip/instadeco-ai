import { describe, it, expect, vi } from 'vitest';
import { UnsubscribeUseCase } from '@/src/application/use-cases/leads/UnsubscribeUseCase';
import { createMockUserRepository, createMockLeadRepository, createMockLogger } from '@/src/__tests__/mocks';
import { success, failure } from '@/src/shared/types/Result';

describe('UnsubscribeUseCase', () => {
  it('coupe le consent profil (email normalisé) ET marque le lead désinscrit', async () => {
    const userRepo = createMockUserRepository();
    const leadRepo = createMockLeadRepository();
    const useCase = new UnsubscribeUseCase(userRepo, leadRepo, createMockLogger());

    const result = await useCase.execute('User@Test.com');

    expect(result.success).toBe(true);
    expect(userRepo.setMarketingConsentByEmail).toHaveBeenCalledWith('user@test.com', false);
    expect(leadRepo.markUnsubscribed).toHaveBeenCalledWith('user@test.com');
  });

  it('non bloquant si la maj lead échoue (table optionnelle)', async () => {
    const userRepo = createMockUserRepository();
    const leadRepo = createMockLeadRepository({
      markUnsubscribed: vi.fn().mockResolvedValue(failure(new Error('no leads table'))),
    });
    const useCase = new UnsubscribeUseCase(userRepo, leadRepo, createMockLogger());

    const result = await useCase.execute('user@test.com');
    expect(result.success).toBe(true);
  });

  it('échoue si la maj du consent profil échoue', async () => {
    const userRepo = createMockUserRepository({
      setMarketingConsentByEmail: vi.fn().mockResolvedValue(failure(new Error('DB down'))),
    });
    const useCase = new UnsubscribeUseCase(userRepo, createMockLeadRepository(), createMockLogger());

    const result = await useCase.execute('user@test.com');
    expect(result.success).toBe(false);
  });
});
