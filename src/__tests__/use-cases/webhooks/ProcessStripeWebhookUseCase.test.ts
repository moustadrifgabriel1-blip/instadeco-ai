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
import { createMockUserRepository } from '@/src/__tests__/mocks/userRepository.mock';
import type { User } from '@/src/domain/entities/User';

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

  it('rejette une quantité de crédits hors des packs connus (ex: 999999 forgé) sans créditer', async () => {
    mockPaymentService.verifyWebhook = vi.fn().mockResolvedValue(
      success({
        ...CREDITS_EVENT,
        eventId: 'evt_forged_credits',
        metadata: { type: 'credits_purchase', credits: '999999', userId: 'user-1' },
      }),
    );

    const result = await useCase.execute({ payload: '{}', signature: 'sig' });

    expect(result.success).toBe(false);
    expect(mockCreditRepo.addCredits).not.toHaveBeenCalled();
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
    metadata: { type: 'guest_credits_purchase', credits: '25', email: 'guest@example.com' },
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
    expect(mockAuthService.provisionGuestForPurchase).toHaveBeenCalledWith('guest@example.com', 25);
    // Crédite l'userId renvoyé par le provisionnement, avec le sessionId pour idempotence.
    expect(mockCreditRepo.addCredits).toHaveBeenCalledWith(
      'guest-user-42',
      25,
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
      25,
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

describe('ProcessStripeWebhookUseCase — abonnements', () => {
  let mockCreditRepo: ReturnType<typeof createMockCreditRepository>;
  let mockPaymentService: ReturnType<typeof createMockPaymentService>;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockGenerationRepo: ReturnType<typeof createMockGenerationRepository>;
  let mockProcessedEventRepo: ReturnType<typeof createMockProcessedEventRepository>;

  function makeUser(overrides: Partial<User> = {}): User {
    return {
      id: 'u', email: 'a@b.c', fullName: null, avatarUrl: null, credits: 0,
      stripeCustomerId: null, stripeSubscriptionId: null,
      proPlan: null, proStatus: null, proRenewsAt: null,
      createdAt: new Date(), updatedAt: new Date(), ...overrides,
    };
  }

  beforeEach(() => {
    mockCreditRepo = createMockCreditRepository();
    mockPaymentService = createMockPaymentService();
    mockLogger = createMockLogger();
    mockGenerationRepo = createMockGenerationRepository();
    mockProcessedEventRepo = createMockProcessedEventRepository();
  });

  function make(event: unknown, userRepo?: ReturnType<typeof createMockUserRepository>) {
    mockPaymentService.verifyWebhook = vi.fn().mockResolvedValue(success(event));
    return new ProcessStripeWebhookUseCase(
      mockCreditRepo, mockGenerationRepo, mockPaymentService, mockLogger,
      mockProcessedEventRepo, undefined, userRepo,
    );
  }

  const SUB_PRO = {
    eventId: 'evt_sub_pro', type: 'checkout.session.completed', sessionId: 'cs_p',
    customerId: 'cus_pro', customerEmail: 'agent@x.com', amountTotal: 4900,
    metadata: { type: 'subscription', planId: 'pro', userId: 'user-pro' }, subscriptionId: 'sub_pro_1',
  };
  const SUB_SOLO = {
    eventId: 'evt_sub_solo', type: 'checkout.session.completed', sessionId: 'cs_s',
    customerId: 'cus_solo', customerEmail: 'agent2@x.com', amountTotal: 1900,
    metadata: { type: 'subscription', planId: 'solo', userId: 'user-solo' }, subscriptionId: 'sub_solo_1',
  };
  const INVOICE_CYCLE = {
    eventId: 'evt_inv_cycle', type: 'invoice.paid', sessionId: '', customerId: 'cus_solo',
    customerEmail: '', amountTotal: 1900, metadata: {}, subscriptionId: 'sub_solo_1',
    billingReason: 'subscription_cycle', periodEnd: 1790000000,
  };
  const INVOICE_CREATE = { ...INVOICE_CYCLE, eventId: 'evt_inv_create', billingReason: 'subscription_create' };
  const INVOICE_CYCLE_PRO = { ...INVOICE_CYCLE, eventId: 'evt_inv_pro', subscriptionId: 'sub_pro_1' };
  const SUB_DELETED = {
    eventId: 'evt_del', type: 'customer.subscription.deleted', sessionId: '', customerId: 'cus_pro',
    customerEmail: '', amountTotal: 0, metadata: {}, subscriptionId: 'sub_pro_1',
  };
  const INVOICE_FAILED_PRO = {
    eventId: 'evt_inv_failed', type: 'invoice.payment_failed', sessionId: '', customerId: 'cus_pro',
    customerEmail: 'agent@x.com', amountTotal: 4900, metadata: {}, subscriptionId: 'sub_pro_1',
  };
  const SUB_UPDATED_PASTDUE = {
    eventId: 'evt_upd_pastdue', type: 'customer.subscription.updated', sessionId: '', customerId: 'cus_pro',
    customerEmail: '', amountTotal: 0, metadata: {}, subscriptionId: 'sub_pro_1',
    subscriptionStatus: 'past_due', periodEnd: 1790000000,
  };
  const SUB_UPDATED_ACTIVE = { ...SUB_UPDATED_PASTDUE, eventId: 'evt_upd_active', subscriptionStatus: 'active' };
  const SUB_UPDATED_INCOMPLETE = { ...SUB_UPDATED_PASTDUE, eventId: 'evt_upd_incomplete', subscriptionStatus: 'incomplete' };

  it('active un abonnement Pro illimité SANS créditer', async () => {
    const userRepo = createMockUserRepository();
    const r = await make(SUB_PRO, userRepo).execute({ payload: '{}', signature: 's' });
    expect(r.success).toBe(true);
    expect(userRepo.update).toHaveBeenCalledWith('user-pro', expect.objectContaining({ proPlan: 'pro', proStatus: 'active' }));
    expect(mockCreditRepo.addCredits).not.toHaveBeenCalled();
  });

  it('active un abonnement Solo et crédite 40', async () => {
    const userRepo = createMockUserRepository();
    const r = await make(SUB_SOLO, userRepo).execute({ payload: '{}', signature: 's' });
    expect(r.success).toBe(true);
    expect(userRepo.update).toHaveBeenCalledWith('user-solo', expect.objectContaining({ proPlan: 'solo', proStatus: 'active' }));
    expect(mockCreditRepo.addCredits).toHaveBeenCalledWith('user-solo', 40, expect.any(String), 'sub_solo_1', 'purchase');
  });

  it('renouvellement Solo (cycle) recharge 40 crédits', async () => {
    const userRepo = createMockUserRepository({
      findByStripeSubscriptionId: vi.fn().mockResolvedValue(success(makeUser({ id: 'user-solo', proPlan: 'solo', proStatus: 'active', stripeSubscriptionId: 'sub_solo_1' }))),
    });
    const r = await make(INVOICE_CYCLE, userRepo).execute({ payload: '{}', signature: 's' });
    expect(r.success).toBe(true);
    expect(mockCreditRepo.addCredits).toHaveBeenCalledWith('user-solo', 40, expect.any(String), 'sub_solo_1', 'purchase');
  });

  it('facture initiale (subscription_create) NE recharge PAS (déjà crédité à l\'activation)', async () => {
    const userRepo = createMockUserRepository({
      findByStripeSubscriptionId: vi.fn().mockResolvedValue(success(makeUser({ id: 'user-solo', proPlan: 'solo', proStatus: 'active', stripeSubscriptionId: 'sub_solo_1' }))),
    });
    const r = await make(INVOICE_CREATE, userRepo).execute({ payload: '{}', signature: 's' });
    expect(r.success).toBe(true);
    expect(mockCreditRepo.addCredits).not.toHaveBeenCalled();
    expect(userRepo.update).toHaveBeenCalled(); // statut + renews_at
  });

  it('renouvellement Pro illimité NE crédite jamais', async () => {
    const userRepo = createMockUserRepository({
      findByStripeSubscriptionId: vi.fn().mockResolvedValue(success(makeUser({ id: 'user-pro', proPlan: 'pro', proStatus: 'active', stripeSubscriptionId: 'sub_pro_1' }))),
    });
    const r = await make(INVOICE_CYCLE_PRO, userRepo).execute({ payload: '{}', signature: 's' });
    expect(r.success).toBe(true);
    expect(mockCreditRepo.addCredits).not.toHaveBeenCalled();
  });

  it('invoice.paid sans profil mappé est ignoré sans erreur', async () => {
    const userRepo = createMockUserRepository({ findByStripeSubscriptionId: vi.fn().mockResolvedValue(success(null)) });
    const r = await make(INVOICE_CYCLE, userRepo).execute({ payload: '{}', signature: 's' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.action).toBe('unmapped');
    expect(mockCreditRepo.addCredits).not.toHaveBeenCalled();
  });

  it('invoice.paid sans subscriptionId → no_subscription', async () => {
    const userRepo = createMockUserRepository();
    const r = await make({ ...INVOICE_CYCLE, subscriptionId: undefined }, userRepo).execute({ payload: '{}', signature: 's' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.action).toBe('no_subscription');
  });

  it('annule l\'abonnement (customer.subscription.deleted) → statut canceled', async () => {
    const userRepo = createMockUserRepository({
      findByStripeSubscriptionId: vi.fn().mockResolvedValue(success(makeUser({ id: 'user-pro', proPlan: 'pro', proStatus: 'active', stripeSubscriptionId: 'sub_pro_1' }))),
    });
    const r = await make(SUB_DELETED, userRepo).execute({ payload: '{}', signature: 's' });
    expect(r.success).toBe(true);
    expect(userRepo.update).toHaveBeenCalledWith('user-pro', { proStatus: 'canceled' });
  });

  it('activation avec plan invalide → échec propre (verrou libéré)', async () => {
    const userRepo = createMockUserRepository();
    const r = await make({ ...SUB_PRO, metadata: { type: 'subscription', planId: 'inexistant', userId: 'user-x' } }, userRepo)
      .execute({ payload: '{}', signature: 's' });
    expect(r.success).toBe(false);
    expect(mockCreditRepo.addCredits).not.toHaveBeenCalled();
    expect(mockProcessedEventRepo.unmarkProcessed).toHaveBeenCalledWith('evt_sub_pro');
  });

  it('activation sans userRepo → échec propre', async () => {
    const r = await make(SUB_PRO, undefined).execute({ payload: '{}', signature: 's' });
    expect(r.success).toBe(false);
    expect(mockProcessedEventRepo.unmarkProcessed).toHaveBeenCalledWith('evt_sub_pro');
  });

  it('invoice.payment_failed → past_due + email de relance', async () => {
    const userRepo = createMockUserRepository({
      findByStripeSubscriptionId: vi.fn().mockResolvedValue(success(makeUser({ id: 'user-pro', email: 'agent@x.com', proPlan: 'pro', proStatus: 'active', stripeSubscriptionId: 'sub_pro_1' }))),
    });
    const r = await make(INVOICE_FAILED_PRO, userRepo).execute({ payload: '{}', signature: 's' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.action).toBe('subscription_past_due');
      expect(r.data.confirmationEmail).toEqual(expect.objectContaining({ kind: 'payment_failed', to: 'agent@x.com' }));
    }
    expect(userRepo.update).toHaveBeenCalledWith('user-pro', { proStatus: 'past_due' });
    expect(mockCreditRepo.addCredits).not.toHaveBeenCalled();
  });

  it('invoice.payment_failed sans profil mappé → unmapped (aucune maj)', async () => {
    const userRepo = createMockUserRepository({ findByStripeSubscriptionId: vi.fn().mockResolvedValue(success(null)) });
    const r = await make(INVOICE_FAILED_PRO, userRepo).execute({ payload: '{}', signature: 's' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.action).toBe('unmapped');
    expect(userRepo.update).not.toHaveBeenCalled();
  });

  it('customer.subscription.updated (past_due) resynchronise pro_status', async () => {
    const userRepo = createMockUserRepository({
      findByStripeSubscriptionId: vi.fn().mockResolvedValue(success(makeUser({ id: 'user-pro', proPlan: 'pro', proStatus: 'active', stripeSubscriptionId: 'sub_pro_1' }))),
    });
    const r = await make(SUB_UPDATED_PASTDUE, userRepo).execute({ payload: '{}', signature: 's' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.action).toBe('subscription_status_past_due');
    expect(userRepo.update).toHaveBeenCalledWith('user-pro', expect.objectContaining({ proStatus: 'past_due' }));
  });

  it('customer.subscription.updated (active) repasse en actif (reprise après impayé)', async () => {
    const userRepo = createMockUserRepository({
      findByStripeSubscriptionId: vi.fn().mockResolvedValue(success(makeUser({ id: 'user-pro', proPlan: 'pro', proStatus: 'past_due', stripeSubscriptionId: 'sub_pro_1' }))),
    });
    const r = await make(SUB_UPDATED_ACTIVE, userRepo).execute({ payload: '{}', signature: 's' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.action).toBe('subscription_status_active');
    expect(userRepo.update).toHaveBeenCalledWith('user-pro', expect.objectContaining({ proStatus: 'active' }));
  });

  it('customer.subscription.updated (statut transitoire) est ignoré sans toucher au profil', async () => {
    const userRepo = createMockUserRepository();
    const r = await make(SUB_UPDATED_INCOMPLETE, userRepo).execute({ payload: '{}', signature: 's' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.action).toBe('status_ignored_incomplete');
    expect(userRepo.update).not.toHaveBeenCalled();
  });
});
