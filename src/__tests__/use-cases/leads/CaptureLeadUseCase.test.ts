import { describe, it, expect, vi } from 'vitest';
import { CaptureLeadUseCase } from '@/src/application/use-cases/leads/CaptureLeadUseCase';
import { createMockLeadRepository, createMockLogger } from '@/src/__tests__/mocks';
import { success, failure } from '@/src/shared/types/Result';

describe('CaptureLeadUseCase', () => {
  it('crée un nouveau lead quand l\'email n\'existe pas', async () => {
    const leadRepo = createMockLeadRepository({
      existsByEmail: vi.fn().mockResolvedValue(success(false)),
    });
    const useCase = new CaptureLeadUseCase(leadRepo, createMockLogger());

    const result = await useCase.execute({ email: 'New@Test.com', source: 'popup' });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.captured).toBe(true);
    expect(leadRepo.create).toHaveBeenCalledWith({ email: 'New@Test.com', source: 'popup' });
  });

  it('dédup silencieuse : email déjà présent → captured false, pas d\'insert', async () => {
    const leadRepo = createMockLeadRepository({
      existsByEmail: vi.fn().mockResolvedValue(success(true)),
    });
    const useCase = new CaptureLeadUseCase(leadRepo, createMockLogger());

    const result = await useCase.execute({ email: 'dup@test.com', source: 'popup' });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.captured).toBe(false);
    expect(leadRepo.create).not.toHaveBeenCalled();
  });

  it('remonte une erreur si la vérification d\'existence échoue', async () => {
    const leadRepo = createMockLeadRepository({
      existsByEmail: vi.fn().mockResolvedValue(failure(new Error('DB down'))),
    });
    const useCase = new CaptureLeadUseCase(leadRepo, createMockLogger());

    const result = await useCase.execute({ email: 'x@test.com', source: 'popup' });
    expect(result.success).toBe(false);
    expect(leadRepo.create).not.toHaveBeenCalled();
  });
});
