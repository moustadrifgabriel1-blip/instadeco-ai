import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProcessStripeWebhookUseCase } from '@/src/application/use-cases/webhooks/ProcessStripeWebhookUseCase';
import {
  createMockAuthService,
  createMockCreditRepository,
  createMockPaymentService,
  createMockLogger,
  createMockProcessedEventRepository,
} from '@/src/__tests__/mocks';
import { success, failure } from '@/src/shared/types/Result';
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

  it('rejette une signature invalide avec le code WEBHOOK_SIGNATURE_INVALID (→ HTTP 400)', async () => {
    mockPaymentService.verifyWebhook = vi.fn().mockResolvedValue(failure(new Error('bad signature')));

    const result = await useCase.execute({ payload: '{}', signature: 'forged' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('WEBHOOK_SIGNATURE_INVALID');
      expect(result.error.statusCode).toBe(400);
    }
    expect(mockCreditRepo.addCredits).not.toHaveBeenCalled();
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

describe('ProcessStripeWebhookUseCase — guest checkout', () => {
  let useCase: ProcessStripeWebhookUseCase;
  let mockCreditRepo: ReturnType<typeof createMockCreditRepository>;
  let mockPaymentService: ReturnType<typeof createMockPaymentService>;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockGenerationRepo: ReturnType<typeof createMockGenerationRepository>;
  let mockProcessedEventRepo: ReturnType<typeof createMockProcessedEventRepository>;
  let mockAuthService: ReturnType<typeof createMockAuthService>;

  const GUEST_EVENT = {
    eventId: 'evt_guest_1',
    type: 'checkout.session.completed',
    sessionId: 'cs_guest_1',
    customerId: 'cus_guest_1',
    customerEmail: 'guest@example.com',
    amountTotal: 999,
    metadata: { type: 'guest_credits_purchase', credits: '20', email: 'guest@example.com' },
  };

  beforeEach(() => {
    mockCreditRepo = createMockCreditRepository();
    mockPaymentService = createMockPaymentService();
    mockLogger = createMockLogger();
    mockGenerationRepo = createMockGenerationRepository();
    mockProcessedEventRepo = createMockProcessedEventRepository();
    mockAuthService = createMockAuthService();

    mockPaymentService.verifyWebhook = vi.fn().mockResolvedValue(success(GUEST_EVENT));
  });

  /** Construit le use-case en injectant (ou non) le service d'auth. */
  function makeUseCase(withAuth: boolean): ProcessStripeWebhookUseCase {
    return new ProcessStripeWebhookUseCase(
      mockCreditRepo,
      mockGenerationRepo,
      mockPaymentService,
      mockLogger,
      mockProcessedEventRepo,
      withAuth ? mockAuthService : undefined,
    );
  }

  it('provisionne le compte et crédite (compte créé), de façon idempotente sur rejeu', async () => {
    mockAuthService.provisionGuestForPurchase = vi
      .fn()
      .mockResolvedValue(success({ userId: 'guest-user-42', created: true }));

    useCase = makeUseCase(true);

    // 1er traitement → provisionne + crédite.
    const first = await useCase.execute({ payload: '{}', signature: 'sig' });

    expect(first.success).toBe(true);
    if (first.success) {
      expect(first.data.processed).toBe(true);
      expect(first.data.action).toBe('guest_account_created_credits_added');
    }
    // Email normalisé + crédits parsés transmis au provisionnement.
    expect(mockAuthService.provisionGuestForPurchase).toHaveBeenCalledWith('guest@example.com', 20);
    // Crédite l'userId renvoyé par le provisionnement, avec le sessionId pour idempotence.
    expect(mockCreditRepo.addCredits).toHaveBeenCalledWith(
      'guest-user-42',
      20,
      expect.any(String),
      'cs_guest_1',
    );
    expect(mockCreditRepo.addCredits).toHaveBeenCalledTimes(1);

    // Rejeu Stripe (même event.id) → court-circuité par l'idempotence event-level.
    const replay = await useCase.execute({ payload: '{}', signature: 'sig' });
    expect(replay.success).toBe(true);
    if (replay.success) {
      expect(replay.data.action).toBe('duplicate_ignored');
    }
    // Aucun double provisionnement ni double crédit malgré le rejeu.
    expect(mockAuthService.provisionGuestForPurchase).toHaveBeenCalledTimes(1);
    expect(mockCreditRepo.addCredits).toHaveBeenCalledTimes(1);
  });

  it('renvoie une action sans création quand le compte existait déjà', async () => {
    mockAuthService.provisionGuestForPurchase = vi
      .fn()
      .mockResolvedValue(success({ userId: 'existing-user', created: false }));

    useCase = makeUseCase(true);

    const result = await useCase.execute({ payload: '{}', signature: 'sig' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.action).toBe('guest_credits_added');
    }
    expect(mockCreditRepo.addCredits).toHaveBeenCalledWith(
      'existing-user',
      20,
      expect.any(String),
      'cs_guest_1',
    );
  });

  it('échoue proprement quand authService n\'est pas configuré', async () => {
    useCase = makeUseCase(false); // pas d'authService injecté

    const result = await useCase.execute({ payload: '{}', signature: 'sig' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('authentification');
    }
    // Sans auth, on ne crédite jamais.
    expect(mockCreditRepo.addCredits).not.toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalled();
    // Le verrou d'idempotence est libéré pour permettre un rejeu une fois corrigé.
    expect(mockProcessedEventRepo.unmarkProcessed).toHaveBeenCalledWith('evt_guest_1');
  });

  it('échoue proprement quand le provisionnement échoue (verrou libéré)', async () => {
    mockAuthService.provisionGuestForPurchase = vi
      .fn()
      .mockResolvedValue(failure(new Error('provision boom')));

    useCase = makeUseCase(true);

    const result = await useCase.execute({ payload: '{}', signature: 'sig' });

    expect(result.success).toBe(false);
    expect(mockCreditRepo.addCredits).not.toHaveBeenCalled();
    expect(mockProcessedEventRepo.unmarkProcessed).toHaveBeenCalledWith('evt_guest_1');
  });
});
