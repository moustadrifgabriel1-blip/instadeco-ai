import { describe, it, expect, vi } from 'vitest';
import { ReconcileStuckGenerationsUseCase } from '@/src/application/use-cases/generation/ReconcileStuckGenerationsUseCase';
import {
  createMockGenerationRepository,
  createMockGeneration,
} from '@/src/__tests__/mocks/generationRepository.mock';
import { createMockCreditRepository, createMockLogger } from '@/src/__tests__/mocks';
import { success, failure } from '@/src/shared/types/Result';
import { CREDIT_COSTS } from '@/src/shared/constants/pricing';

describe('ReconcileStuckGenerationsUseCase', () => {
  const zombieA = createMockGeneration({ id: 'gen-aaaa1111', userId: 'user-A', status: 'processing' });
  const zombieB = createMockGeneration({ id: 'gen-bbbb2222', userId: 'user-B', status: 'processing' });

  it('rembourse UNIQUEMENT les générations réellement transitées (anti double-remboursement)', async () => {
    const creditRepo = createMockCreditRepository();
    const generationRepo = createMockGenerationRepository({
      findStuck: vi.fn().mockResolvedValue(success([zombieA, zombieB])),
      // A : CET appel transite → remboursable. B : déjà transité ailleurs → pas de remboursement.
      markFailedIfPending: vi.fn()
        .mockResolvedValueOnce(success({ transitioned: true, generation: { ...zombieA, status: 'failed' } }))
        .mockResolvedValueOnce(success({ transitioned: false, generation: { ...zombieB, status: 'failed' } })),
    });

    const useCase = new ReconcileStuckGenerationsUseCase(generationRepo, creditRepo, createMockLogger());
    const result = await useCase.execute({ olderThanMs: 5 * 60 * 1000 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ scanned: 2, reconciled: 1, refunded: 1, refundFailures: 0 });
    }
    // Un seul remboursement, typé 'refund', pour le bon utilisateur.
    expect(creditRepo.addCredits).toHaveBeenCalledTimes(1);
    expect(creditRepo.addCredits).toHaveBeenCalledWith(
      'user-A',
      CREDIT_COSTS.GENERATION,
      expect.stringContaining('Remboursement'),
      undefined,
      'refund',
    );
  });

  it('compte les échecs de remboursement sans planter (crédit potentiellement perdu → à alerter)', async () => {
    const creditRepo = createMockCreditRepository({
      addCredits: vi.fn().mockResolvedValue(failure(new Error('DB down'))),
    });
    const generationRepo = createMockGenerationRepository({
      findStuck: vi.fn().mockResolvedValue(success([zombieA])),
      markFailedIfPending: vi.fn().mockResolvedValue(
        success({ transitioned: true, generation: { ...zombieA, status: 'failed' } }),
      ),
    });

    const useCase = new ReconcileStuckGenerationsUseCase(generationRepo, creditRepo, createMockLogger());
    const result = await useCase.execute();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ scanned: 1, reconciled: 1, refunded: 0, refundFailures: 1 });
    }
  });

  it('remonte une erreur si la lecture des générations bloquées échoue', async () => {
    const generationRepo = createMockGenerationRepository({
      findStuck: vi.fn().mockResolvedValue(failure(new Error('query failed'))),
    });

    const useCase = new ReconcileStuckGenerationsUseCase(generationRepo, createMockCreditRepository(), createMockLogger());
    const result = await useCase.execute();

    expect(result.success).toBe(false);
  });

  it('ne rembourse rien quand il n\'y a aucune génération bloquée', async () => {
    const creditRepo = createMockCreditRepository();
    const generationRepo = createMockGenerationRepository({
      findStuck: vi.fn().mockResolvedValue(success([])),
    });

    const useCase = new ReconcileStuckGenerationsUseCase(generationRepo, creditRepo, createMockLogger());
    const result = await useCase.execute();

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ scanned: 0, reconciled: 0, refunded: 0, refundFailures: 0 });
    expect(creditRepo.addCredits).not.toHaveBeenCalled();
  });
});
