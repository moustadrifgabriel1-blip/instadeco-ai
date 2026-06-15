import { describe, it, expect, vi } from 'vitest';
import { GetReferralInfoUseCase } from '@/src/application/use-cases/referral/GetReferralInfoUseCase';
import {
  ApplyReferralCodeUseCase,
  REFERRER_BONUS,
  REFERRED_BONUS,
} from '@/src/application/use-cases/referral/ApplyReferralCodeUseCase';
import { createMockReferralRepository } from '@/src/__tests__/mocks/referralRepository.mock';
import { createMockLogger } from '@/src/__tests__/mocks';
import { success, failure } from '@/src/shared/types/Result';
import { ReferralRecord } from '@/src/domain/ports/repositories/IReferralRepository';

describe('GetReferralInfoUseCase', () => {
  it('retourne code + agrégats quand le profil existe', async () => {
    const referrals: ReferralRecord[] = [
      {
        id: 'r1',
        referred_id: 'u-a',
        referrer_credits_awarded: 5,
        status: 'completed',
        created_at: '2026-06-10T00:00:00Z',
      },
      {
        id: 'r2',
        referred_id: 'u-b',
        referrer_credits_awarded: 5,
        status: 'completed',
        created_at: '2026-06-09T00:00:00Z',
      },
    ];
    const repo = createMockReferralRepository({
      getReferralCode: vi
        .fn()
        .mockResolvedValue(success({ referralCode: 'CODE42', columnMissing: false })),
      listReferralsByReferrer: vi.fn().mockResolvedValue(success(referrals)),
    });
    const useCase = new GetReferralInfoUseCase(repo, createMockLogger());

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.referralCode).toBe('CODE42');
      expect(result.data.totalReferred).toBe(2);
      expect(result.data.totalCreditsEarned).toBe(10);
      expect(result.data.referrals).toHaveLength(2);
    }
  });

  it('fallback valeurs par défaut si la colonne/profil est indisponible', async () => {
    const repo = createMockReferralRepository({
      getReferralCode: vi
        .fn()
        .mockResolvedValue(success({ referralCode: null, columnMissing: true })),
    });
    const useCase = new GetReferralInfoUseCase(repo, createMockLogger());

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        referralCode: null,
        referrals: [],
        totalReferred: 0,
        totalCreditsEarned: 0,
      });
    }
    // Ne doit pas tenter de lister les parrainages dans ce cas.
    expect(repo.listReferralsByReferrer).not.toHaveBeenCalled();
  });

  it('gère referrer_credits_awarded null sans casser le total', async () => {
    const repo = createMockReferralRepository({
      getReferralCode: vi
        .fn()
        .mockResolvedValue(success({ referralCode: 'X', columnMissing: false })),
      listReferralsByReferrer: vi.fn().mockResolvedValue(
        success([
          {
            id: 'r1',
            referred_id: 'u-a',
            referrer_credits_awarded: null,
            status: 'pending',
            created_at: '2026-06-10T00:00:00Z',
          },
        ] as ReferralRecord[]),
      ),
    });
    const useCase = new GetReferralInfoUseCase(repo, createMockLogger());

    const result = await useCase.execute({ userId: 'user-1' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalCreditsEarned).toBe(0);
      expect(result.data.totalReferred).toBe(1);
    }
  });
});

describe('ApplyReferralCodeUseCase', () => {
  it('applique un code valide : crée le parrainage, set referred_by, renvoie les bonus', async () => {
    const repo = createMockReferralRepository({
      findReferrerByCode: vi.fn().mockResolvedValue(
        success({ id: 'referrer-1', email: 'p@test.com', full_name: 'Parrain' }),
      ),
      hasBeenReferred: vi.fn().mockResolvedValue(success(false)),
    });
    const useCase = new ApplyReferralCodeUseCase(repo, createMockLogger());

    const result = await useCase.execute({ newUserId: 'filleul-1', referralCode: 'abc123' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.referrerId).toBe('referrer-1');
      expect(result.data.referrerEmail).toBe('p@test.com');
      expect(result.data.referrerBonus).toBe(REFERRER_BONUS);
      expect(result.data.referredBonus).toBe(REFERRED_BONUS);
    }
    expect(repo.createReferral).toHaveBeenCalledWith({
      referrerId: 'referrer-1',
      referredId: 'filleul-1',
      referrerCreditsAwarded: REFERRER_BONUS,
      referredCreditsAwarded: REFERRED_BONUS,
      status: 'completed',
    });
    expect(repo.setReferredBy).toHaveBeenCalledWith('filleul-1', 'referrer-1');
  });

  it('code manquant → MISSING_CODE', async () => {
    const repo = createMockReferralRepository();
    const useCase = new ApplyReferralCodeUseCase(repo, createMockLogger());

    const result = await useCase.execute({ newUserId: 'filleul-1', referralCode: '' });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.reason).toBe('MISSING_CODE');
    expect(repo.createReferral).not.toHaveBeenCalled();
  });

  it('code introuvable → INVALID_CODE', async () => {
    const repo = createMockReferralRepository({
      findReferrerByCode: vi.fn().mockResolvedValue(success(null)),
    });
    const useCase = new ApplyReferralCodeUseCase(repo, createMockLogger());

    const result = await useCase.execute({ newUserId: 'filleul-1', referralCode: 'NOPE' });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.reason).toBe('INVALID_CODE');
    expect(repo.createReferral).not.toHaveBeenCalled();
  });

  it('filleul déjà parrainé → ALREADY_REFERRED', async () => {
    const repo = createMockReferralRepository({
      findReferrerByCode: vi.fn().mockResolvedValue(
        success({ id: 'referrer-1', email: 'p@test.com', full_name: null }),
      ),
      hasBeenReferred: vi.fn().mockResolvedValue(success(true)),
    });
    const useCase = new ApplyReferralCodeUseCase(repo, createMockLogger());

    const result = await useCase.execute({ newUserId: 'filleul-1', referralCode: 'ABC' });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.reason).toBe('ALREADY_REFERRED');
    expect(repo.createReferral).not.toHaveBeenCalled();
  });

  it('auto-parrainage → SELF_REFERRAL', async () => {
    const repo = createMockReferralRepository({
      findReferrerByCode: vi.fn().mockResolvedValue(
        success({ id: 'same-user', email: 'me@test.com', full_name: null }),
      ),
      hasBeenReferred: vi.fn().mockResolvedValue(success(false)),
    });
    const useCase = new ApplyReferralCodeUseCase(repo, createMockLogger());

    const result = await useCase.execute({ newUserId: 'same-user', referralCode: 'MINE' });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.reason).toBe('SELF_REFERRAL');
    expect(repo.createReferral).not.toHaveBeenCalled();
  });

  it('échec insert → INSERT_FAILED', async () => {
    const repo = createMockReferralRepository({
      findReferrerByCode: vi.fn().mockResolvedValue(
        success({ id: 'referrer-1', email: 'p@test.com', full_name: null }),
      ),
      hasBeenReferred: vi.fn().mockResolvedValue(success(false)),
      createReferral: vi.fn().mockResolvedValue(failure(new Error('db error'))),
    });
    const useCase = new ApplyReferralCodeUseCase(repo, createMockLogger());

    const result = await useCase.execute({ newUserId: 'filleul-1', referralCode: 'ABC' });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.reason).toBe('INSERT_FAILED');
    expect(repo.setReferredBy).not.toHaveBeenCalled();
  });

  it('setReferredBy en échec ne bloque pas le succès (best-effort)', async () => {
    const repo = createMockReferralRepository({
      findReferrerByCode: vi.fn().mockResolvedValue(
        success({ id: 'referrer-1', email: 'p@test.com', full_name: null }),
      ),
      hasBeenReferred: vi.fn().mockResolvedValue(success(false)),
      setReferredBy: vi.fn().mockResolvedValue(failure(new Error('update failed'))),
    });
    const useCase = new ApplyReferralCodeUseCase(repo, createMockLogger());

    const result = await useCase.execute({ newUserId: 'filleul-1', referralCode: 'ABC' });

    expect(result.success).toBe(true);
  });
});
