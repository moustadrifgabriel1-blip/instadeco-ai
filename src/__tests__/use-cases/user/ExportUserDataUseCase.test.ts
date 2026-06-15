import { describe, it, expect, vi } from 'vitest';
import { ExportUserDataUseCase, ExportUserDataInput } from '@/src/application/use-cases/user/ExportUserDataUseCase';
import { createMockUserDataExportRepository } from '@/src/__tests__/mocks/userDataExportRepository.mock';
import { createMockLogger } from '@/src/__tests__/mocks';
import { success, failure } from '@/src/shared/types/Result';
import type { UserDataExportRaw } from '@/src/domain/ports/repositories/IUserDataExportRepository';

const baseInput: ExportUserDataInput = {
  userId: 'user-123',
  email: 'user@test.com',
  fullName: 'Jean Test',
  displayName: 'Jeannot',
  provider: 'email',
  createdAt: '2026-01-01T00:00:00.000Z',
  lastSignIn: '2026-06-01T00:00:00.000Z',
};

describe('ExportUserDataUseCase', () => {
  it('agrège les données via le repository et fournit l\'identité issue de la session', async () => {
    const raw: UserDataExportRaw = {
      profile: {
        credits: 12,
        role: 'user',
        referral_code: 'ABC123',
        stripe_customer_id: null,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-02-01T00:00:00.000Z',
      },
      generations: [
        {
          id: 'gen-1',
          style: 'moderne',
          room_type: 'salon',
          status: 'completed',
          input_image_url: 'https://in/1.jpg',
          output_image_url: 'https://out/1.jpg',
          prompt: 'p',
          created_at: '2026-03-01T00:00:00.000Z',
          updated_at: '2026-03-01T00:10:00.000Z',
        },
      ],
      creditTransactions: [
        { id: 'tx-1', type: 'purchase', amount: 10, description: 'achat', created_at: '2026-03-02T00:00:00.000Z' },
      ],
      projects: [
        { id: 'proj-1', name: 'Salon', created_at: '2026-03-03T00:00:00.000Z' },
      ],
      referralsGiven: [
        { referred_id: 'r1', credits_awarded: 3, created_at: '2026-03-04T00:00:00.000Z' },
      ],
      referralsReceived: [],
    };
    const repo = createMockUserDataExportRepository({
      fetchAll: vi.fn().mockResolvedValue(success(raw)),
    });
    const useCase = new ExportUserDataUseCase(repo, createMockLogger());

    const result = await useCase.execute(baseInput);

    expect(result.success).toBe(true);
    expect(repo.fetchAll).toHaveBeenCalledWith('user-123');
    if (!result.success) return;

    const data = result.data.exportData as Record<string, any>;
    // Identité issue de la session
    expect(data.account).toEqual({
      id: 'user-123',
      email: 'user@test.com',
      fullName: 'Jean Test',
      displayName: 'Jeannot',
      provider: 'email',
      createdAt: '2026-01-01T00:00:00.000Z',
      lastSignIn: '2026-06-01T00:00:00.000Z',
    });
    // Projection profil
    expect(data.profile).toEqual({
      credits: 12,
      role: 'user',
      referralCode: 'ABC123',
      stripeCustomerId: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-02-01T00:00:00.000Z',
    });
    // Projection des collections
    expect(data.generations).toEqual([
      {
        id: 'gen-1',
        style: 'moderne',
        roomType: 'salon',
        status: 'completed',
        inputImageUrl: 'https://in/1.jpg',
        outputImageUrl: 'https://out/1.jpg',
        prompt: 'p',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:10:00.000Z',
      },
    ]);
    expect(data.creditTransactions).toEqual([
      { id: 'tx-1', type: 'purchase', amount: 10, description: 'achat', createdAt: '2026-03-02T00:00:00.000Z' },
    ]);
    expect(data.projects).toEqual([
      { id: 'proj-1', name: 'Salon', createdAt: '2026-03-03T00:00:00.000Z' },
    ]);
    expect(data.referrals).toEqual({
      given: [{ creditsAwarded: 3, createdAt: '2026-03-04T00:00:00.000Z' }],
      received: [],
    });
    // Métadonnées RGPD constantes
    expect(data._metadata.service).toBe('InstaDeco AI');
    expect(data._metadata.format).toBe('JSON');
    expect(data._dataCategories.accountData).toBe('Informations de connexion et profil');
  });

  it('masque le stripe_customer_id quand il est présent', async () => {
    const raw: UserDataExportRaw = {
      profile: {
        credits: 0,
        role: 'user',
        referral_code: null,
        stripe_customer_id: 'cus_real_id',
        created_at: 'c',
        updated_at: 'u',
      },
      generations: [],
      creditTransactions: [],
      projects: [],
      referralsGiven: [],
      referralsReceived: [],
    };
    const repo = createMockUserDataExportRepository({
      fetchAll: vi.fn().mockResolvedValue(success(raw)),
    });
    const useCase = new ExportUserDataUseCase(repo, createMockLogger());

    const result = await useCase.execute(baseInput);
    expect(result.success).toBe(true);
    if (!result.success) return;
    const data = result.data.exportData as Record<string, any>;
    expect(data.profile.stripeCustomerId).toBe('***masqué***');
  });

  it('profil null → champ profile null, collections vides', async () => {
    const repo = createMockUserDataExportRepository(); // défaut = tout vide
    const useCase = new ExportUserDataUseCase(repo, createMockLogger());

    const result = await useCase.execute(baseInput);
    expect(result.success).toBe(true);
    if (!result.success) return;
    const data = result.data.exportData as Record<string, any>;
    expect(data.profile).toBeNull();
    expect(data.generations).toEqual([]);
    expect(data.referrals).toEqual({ given: [], received: [] });
  });

  it('remonte une erreur si le repository échoue', async () => {
    const repo = createMockUserDataExportRepository({
      fetchAll: vi.fn().mockResolvedValue(failure(new Error('DB down'))),
    });
    const logger = createMockLogger();
    const useCase = new ExportUserDataUseCase(repo, logger);

    const result = await useCase.execute(baseInput);
    expect(result.success).toBe(false);
    expect(logger.error).toHaveBeenCalled();
  });
});
