/**
 * Tests du chemin critique : GenerateDesignUseCase.
 *
 * Couvre la déduction de crédit, le remboursement automatique en cas d'échec
 * (IA ratée = génération zombie, ou échec d'update DB), et le rollback de la
 * génération si la déduction échoue. Un utilisateur ne doit JAMAIS perdre un
 * crédit pour une génération qui n'a pas abouti.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerateDesignUseCase } from '@/src/application/use-cases/generation/GenerateDesignUseCase';
import { InsufficientCreditsError } from '@/src/domain/errors/InsufficientCreditsError';
import { ImageGenerationError } from '@/src/domain/errors/ImageGenerationError';
import { FairUseLimitError } from '@/src/domain/errors/FairUseLimitError';
import { success, failure } from '@/src/shared/types/Result';
import {
  createMockCreditRepository,
  createMockGenerationRepository,
  createMockLogger,
} from '@/src/__tests__/mocks';
import type { IImageGeneratorService } from '@/src/domain/ports/services/IImageGeneratorService';
import type { IStorageService } from '@/src/domain/ports/services/IStorageService';
import { createMockUserRepository } from '@/src/__tests__/mocks/userRepository.mock';
import type { User } from '@/src/domain/entities/User';

const GENERATION_ID = 'gen-123';
const USER_ID = 'user-123';

// uploadFromBase64 renvoie une URL non-Supabase → on saute la branche signed URL.
function createMockStorage(overrides: Partial<IStorageService> = {}): IStorageService {
  return {
    uploadFromBuffer: vi.fn(),
    uploadFromUrl: vi.fn().mockResolvedValue(
      success({ url: 'https://cdn.example.com/output.jpg', path: 'out' })
    ),
    uploadFromBase64: vi.fn().mockResolvedValue(
      success({ url: 'https://cdn.example.com/input.jpg', path: 'in' })
    ),
    getPublicUrl: vi.fn(),
    delete: vi.fn(),
    createSignedUrl: vi.fn(),
    ...overrides,
  };
}

function createMockImageGenerator(overrides: Partial<IImageGeneratorService> = {}): IImageGeneratorService {
  return {
    generate: vi.fn().mockResolvedValue(
      success({ imageUrl: 'https://cdn.fal.ai/out.jpg', providerId: 'fal-xyz' })
    ),
    ...overrides,
  };
}

const baseInput = {
  userId: USER_ID,
  styleSlug: 'moderne',
  roomType: 'salon',
  imageBase64: 'data:image/jpeg;base64,/9j/4AAQ',
  prompt: 'un salon moderne',
};

describe('GenerateDesignUseCase', () => {
  beforeEach(() => vi.clearAllMocks());

  it('déduit exactement 1 crédit et retourne le solde restant en cas de succès', async () => {
    const creditRepo = createMockCreditRepository({
      getBalance: vi.fn().mockResolvedValue(success(5)),
      deductCredits: vi.fn().mockResolvedValue(success(4)),
    });
    const generationRepo = createMockGenerationRepository();
    const useCase = new GenerateDesignUseCase(
      generationRepo, creditRepo, createMockImageGenerator(), createMockStorage(), createMockLogger(),
    );

    const result = await useCase.execute(baseInput);

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.creditsRemaining).toBe(4);
    expect(creditRepo.deductCredits).toHaveBeenCalledWith(
      USER_ID, 1, expect.any(String), GENERATION_ID,
    );
    // Pas de remboursement quand tout réussit
    expect(creditRepo.addCredits).not.toHaveBeenCalled();
  });

  it('échoue avec InsufficientCreditsError sans déduire si le solde est insuffisant', async () => {
    const creditRepo = createMockCreditRepository({
      getBalance: vi.fn().mockResolvedValue(success(0)),
    });
    const useCase = new GenerateDesignUseCase(
      createMockGenerationRepository(), creditRepo, createMockImageGenerator(), createMockStorage(), createMockLogger(),
    );

    const result = await useCase.execute(baseInput);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBeInstanceOf(InsufficientCreditsError);
    expect(creditRepo.deductCredits).not.toHaveBeenCalled();
  });

  it('rembourse le crédit et marque failed si la génération IA échoue (zombie)', async () => {
    const creditRepo = createMockCreditRepository();
    const generationRepo = createMockGenerationRepository();
    const imageGenerator = createMockImageGenerator({
      generate: vi.fn().mockResolvedValue(failure(new Error('AI down'))),
    });
    const useCase = new GenerateDesignUseCase(
      generationRepo, creditRepo, imageGenerator, createMockStorage(), createMockLogger(),
    );

    const result = await useCase.execute(baseInput);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBeInstanceOf(ImageGenerationError);
    // La cause d'échec est désormais persistée (diagnostic) en plus du statut.
    expect(generationRepo.update).toHaveBeenCalledWith(GENERATION_ID, { status: 'failed', errorMessage: 'AI down' });
    // Le crédit déduit est remboursé (montant exact 1)
    expect(creditRepo.addCredits).toHaveBeenCalledWith(
      USER_ID, 1, expect.stringContaining('Remboursement'), undefined, 'refund',
    );
  });

  it('rembourse le crédit si la mise à jour finale en base échoue', async () => {
    const creditRepo = createMockCreditRepository();
    const generationRepo = createMockGenerationRepository({
      // 1er update (processing) ok, 2e update (completed) échoue
      update: vi.fn()
        .mockResolvedValueOnce(success({ id: GENERATION_ID, status: 'processing' }))
        .mockResolvedValueOnce(failure(new Error('DB write failed'))),
    });
    const useCase = new GenerateDesignUseCase(
      generationRepo, creditRepo, createMockImageGenerator(), createMockStorage(), createMockLogger(),
    );

    const result = await useCase.execute(baseInput);

    expect(result.success).toBe(false);
    expect(creditRepo.addCredits).toHaveBeenCalledWith(
      USER_ID, 1, expect.stringContaining('Remboursement'), undefined, 'refund',
    );
  });

  it('supprime la génération (rollback) si la déduction de crédit échoue', async () => {
    const creditRepo = createMockCreditRepository({
      deductCredits: vi.fn().mockResolvedValue(failure(new Error('deduct failed'))),
    });
    const generationRepo = createMockGenerationRepository();
    const imageGenerator = createMockImageGenerator();
    const useCase = new GenerateDesignUseCase(
      generationRepo, creditRepo, imageGenerator, createMockStorage(), createMockLogger(),
    );

    const result = await useCase.execute(baseInput);

    expect(result.success).toBe(false);
    expect(generationRepo.delete).toHaveBeenCalledWith(GENERATION_ID);
    // L'IA ne doit jamais être appelée si la déduction a échoué
    expect(imageGenerator.generate).not.toHaveBeenCalled();
  });
});

describe('GenerateDesignUseCase — abonné illimité (Pro/Agence)', () => {
  beforeEach(() => vi.clearAllMocks());

  function makeUser(overrides: Partial<User> = {}): User {
    return {
      id: USER_ID, email: 'a@b.c', fullName: null, avatarUrl: null, credits: 0,
      stripeCustomerId: null, stripeSubscriptionId: null,
      proPlan: null, proStatus: null, proRenewsAt: null,
      createdAt: new Date(), updatedAt: new Date(), ...overrides,
    };
  }

  it('Pro illimité actif : génère SANS déduire de crédits (même solde 0)', async () => {
    const userRepo = createMockUserRepository({
      findById: vi.fn().mockResolvedValue(success(makeUser({ proStatus: 'active', proPlan: 'pro' }))),
    });
    const creditRepo = createMockCreditRepository({
      getBalance: vi.fn().mockResolvedValue(success(0)),
      deductCredits: vi.fn(),
    });
    const useCase = new GenerateDesignUseCase(
      createMockGenerationRepository(), creditRepo, createMockImageGenerator(), createMockStorage(), createMockLogger(), userRepo,
    );

    const result = await useCase.execute(baseInput);

    expect(result.success).toBe(true);
    expect(creditRepo.deductCredits).not.toHaveBeenCalled();
  });

  it('Pro illimité : creditsRemaining = solde courant (informatif)', async () => {
    const userRepo = createMockUserRepository({
      findById: vi.fn().mockResolvedValue(success(makeUser({ proStatus: 'active', proPlan: 'agence' }))),
    });
    const creditRepo = createMockCreditRepository({
      getBalance: vi.fn().mockResolvedValue(success(7)),
      deductCredits: vi.fn(),
    });
    const useCase = new GenerateDesignUseCase(
      createMockGenerationRepository(), creditRepo, createMockImageGenerator(), createMockStorage(), createMockLogger(), userRepo,
    );

    const result = await useCase.execute(baseInput);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.creditsRemaining).toBe(7);
  });

  it('Pro illimité + échec IA : AUCUN remboursement (rien n\'a été débité)', async () => {
    const userRepo = createMockUserRepository({
      findById: vi.fn().mockResolvedValue(success(makeUser({ proStatus: 'active', proPlan: 'pro' }))),
    });
    const creditRepo = createMockCreditRepository();
    const imageGenerator = createMockImageGenerator({
      generate: vi.fn().mockResolvedValue(failure(new Error('AI down'))),
    });
    const useCase = new GenerateDesignUseCase(
      createMockGenerationRepository(), creditRepo, imageGenerator, createMockStorage(), createMockLogger(), userRepo,
    );

    const result = await useCase.execute(baseInput);
    expect(result.success).toBe(false);
    expect(creditRepo.deductCredits).not.toHaveBeenCalled();
    expect(creditRepo.addCredits).not.toHaveBeenCalled();
  });

  it('Solo actif (quota) : déduit normalement les crédits', async () => {
    const userRepo = createMockUserRepository({
      findById: vi.fn().mockResolvedValue(success(makeUser({ proStatus: 'active', proPlan: 'solo' }))),
    });
    const creditRepo = createMockCreditRepository({
      getBalance: vi.fn().mockResolvedValue(success(5)),
      deductCredits: vi.fn().mockResolvedValue(success(4)),
    });
    const useCase = new GenerateDesignUseCase(
      createMockGenerationRepository(), creditRepo, createMockImageGenerator(), createMockStorage(), createMockLogger(), userRepo,
    );

    const result = await useCase.execute(baseInput);
    expect(result.success).toBe(true);
    expect(creditRepo.deductCredits).toHaveBeenCalled();
  });

  it('abonnement annulé (canceled) : déduit normalement (plus d\'illimité)', async () => {
    const userRepo = createMockUserRepository({
      findById: vi.fn().mockResolvedValue(success(makeUser({ proStatus: 'canceled', proPlan: 'pro' }))),
    });
    const creditRepo = createMockCreditRepository({
      getBalance: vi.fn().mockResolvedValue(success(5)),
      deductCredits: vi.fn().mockResolvedValue(success(4)),
    });
    const useCase = new GenerateDesignUseCase(
      createMockGenerationRepository(), creditRepo, createMockImageGenerator(), createMockStorage(), createMockLogger(), userRepo,
    );

    const result = await useCase.execute(baseInput);
    expect(result.success).toBe(true);
    expect(creditRepo.deductCredits).toHaveBeenCalled();
  });

  it('sans userRepo (rétro-compat) : déduit normalement', async () => {
    const creditRepo = createMockCreditRepository({
      getBalance: vi.fn().mockResolvedValue(success(5)),
      deductCredits: vi.fn().mockResolvedValue(success(4)),
    });
    const useCase = new GenerateDesignUseCase(
      createMockGenerationRepository(), creditRepo, createMockImageGenerator(), createMockStorage(), createMockLogger(),
    );

    const result = await useCase.execute(baseInput);
    expect(result.success).toBe(true);
    expect(creditRepo.deductCredits).toHaveBeenCalled();
  });

  it('Pro illimité au-delà du plafond fair-use : bloque avec FairUseLimitError (sans appeler l\'IA)', async () => {
    const userRepo = createMockUserRepository({
      findById: vi.fn().mockResolvedValue(success(makeUser({ proStatus: 'active', proPlan: 'pro' }))),
    });
    const generationRepo = createMockGenerationRepository({
      countByUserSince: vi.fn().mockResolvedValue(success(1000)),
    });
    const imageGenerator = createMockImageGenerator();
    const useCase = new GenerateDesignUseCase(
      generationRepo, createMockCreditRepository(), imageGenerator, createMockStorage(), createMockLogger(), userRepo,
    );

    const result = await useCase.execute(baseInput);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBeInstanceOf(FairUseLimitError);
    expect(imageGenerator.generate).not.toHaveBeenCalled();
  });

  it('Pro illimité + comptage fair-use en échec : fail-open, génère quand même', async () => {
    const userRepo = createMockUserRepository({
      findById: vi.fn().mockResolvedValue(success(makeUser({ proStatus: 'active', proPlan: 'pro' }))),
    });
    const generationRepo = createMockGenerationRepository({
      countByUserSince: vi.fn().mockResolvedValue(failure(new Error('db down'))),
    });
    const useCase = new GenerateDesignUseCase(
      generationRepo, createMockCreditRepository(), createMockImageGenerator(), createMockStorage(), createMockLogger(), userRepo,
    );

    const result = await useCase.execute(baseInput);
    expect(result.success).toBe(true);
  });
});
