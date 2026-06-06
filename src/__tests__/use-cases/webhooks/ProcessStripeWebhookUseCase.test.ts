import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProcessStripeWebhookUseCase } from '@/src/application/use-cases/webhooks/ProcessStripeWebhookUseCase';
import {
  createMockCreditRepository,
  createMockPaymentService,
  createMockLogger,
  createMockProcessedEventRepository,
} from '@/src/__tests__/mocks';
import { success } from '@/src/shared/types/Result';
import { createMockGenerationRepository } from '@/src/__tests__/mocks/generationRepository.mock';

describe('ProcessStripeWebhookUseCase — idempotence', () => {
  let useCase: ProcessStripeWebhookUseCase;
  let mockCreditRepo: ReturnType<typeof createMockCreditRepository>;
  let mockPaymentService: ReturnType<typeof createMockPaymentService>;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockGenerationRepo: ReturnType<typeof createMockGenerationRepository>;
  let mockProcessedEventRepo: ReturnType<typeof createMockProcessedEventRepository>;

  const CREDITS_EVENT = {
    eventId: 'evt_replay_1',
    type: 'checkout.session.completed',
    sessionId: 'cs_test_1',
    customerId: 'cus_1',
    customerEmail: 'buyer@example.com',
    amountTotal: 999,
    metadata: { type: 'credits_purchase', credits: '10', userId: 'user-1' },
  };

  beforeEach(() => {
    mockCreditRepo = createMockCreditRepository();
    mockPaymentService = createMockPaymentService();
    mockLogger = createMockLogger();
    mockGenerationRepo = createMockGenerationRepository();
    mockProcessedEventRepo = createMockProcessedEventRepository();

    // Le webhook renvoie toujours le même event (simule un rejeu Stripe).
    mockPaymentService.verifyWebhook = vi.fn().mockResolvedValue(success(CREDITS_EVENT));

    useCase = new ProcessStripeWebhookUseCase(
      mockCreditRepo,
      mockGenerationRepo,
      mockPaymentService,
      mockLogger,
      mockProcessedEventRepo,
    );
  });

  it('crédite l\'utilisateur au premier traitement', async () => {
    const result = await useCase.execute({ payload: '{}', signature: 'sig' });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.action).toBe('credits_added');
    expect(mockCreditRepo.addCredits).toHaveBeenCalledTimes(1);
  });

  it('ne recrédite PAS lors d\'un rejeu du même event.id', async () => {
    // 1er passage → crédite
    await useCase.execute({ payload: '{}', signature: 'sig' });
    // 2e passage (rejeu Stripe, même event.id) → court-circuité
    const replay = await useCase.execute({ payload: '{}', signature: 'sig' });

    expect(replay.success).toBe(true);
    if (replay.success) {
      expect(replay.data.processed).toBe(false);
      expect(replay.data.action).toBe('duplicate_ignored');
    }
    // addCredits n'a été appelé qu'UNE seule fois malgré deux webhooks.
    expect(mockCreditRepo.addCredits).toHaveBeenCalledTimes(1);
  });

  it('libère le verrou si le crédit échoue (rejeu possible ensuite)', async () => {
    mockCreditRepo.addCredits = vi
      .fn()
      .mockResolvedValueOnce({ success: false, error: new Error('boom') })
      .mockResolvedValueOnce(success(15));

    const first = await useCase.execute({ payload: '{}', signature: 'sig' });
    expect(first.success).toBe(false);
    expect(mockProcessedEventRepo.unmarkProcessed).toHaveBeenCalledWith('evt_replay_1');

    // Un rejeu après échec doit pouvoir retraiter et créditer.
    const retry = await useCase.execute({ payload: '{}', signature: 'sig' });
    expect(retry.success).toBe(true);
    expect(mockCreditRepo.addCredits).toHaveBeenCalledTimes(2);
  });
});
