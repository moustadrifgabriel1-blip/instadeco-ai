import { describe, it, expect, vi } from 'vitest';
import { DeleteAccountUseCase } from '@/src/application/use-cases/user/DeleteAccountUseCase';
import { createMockUserDeletionRepository } from '@/src/__tests__/mocks/userDeletionRepository.mock';
import { createMockLogger } from '@/src/__tests__/mocks';
import { success, failure } from '@/src/shared/types/Result';

describe('DeleteAccountUseCase', () => {
  it('exécute la cascade dans l\'ordre exact : storage → leads → auth user', async () => {
    const repo = createMockUserDeletionRepository();
    const useCase = new DeleteAccountUseCase(repo, createMockLogger());

    const result = await useCase.execute({ userId: 'user-123', email: 'User@Test.com' });

    expect(result.success).toBe(true);
    expect(repo.deleteUserStorage).toHaveBeenCalledWith('user-123');
    expect(repo.deleteLeadsByEmail).toHaveBeenCalledWith('User@Test.com');
    expect(repo.deleteAuthUser).toHaveBeenCalledWith('user-123');

    // L'ordre : storage avant auth user (la cascade SQL ne doit partir qu'à la fin).
    const storageOrder = (repo.deleteUserStorage as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0];
    const leadsOrder = (repo.deleteLeadsByEmail as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0];
    const authOrder = (repo.deleteAuthUser as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0];
    expect(storageOrder).toBeLessThan(leadsOrder);
    expect(leadsOrder).toBeLessThan(authOrder);
  });

  it('ne supprime QUE le compte de l\'utilisateur fourni (scopé sur userId)', async () => {
    const repo = createMockUserDeletionRepository();
    const useCase = new DeleteAccountUseCase(repo, createMockLogger());

    await useCase.execute({ userId: 'owner-id', email: 'owner@test.com' });

    expect(repo.deleteAuthUser).toHaveBeenCalledTimes(1);
    expect(repo.deleteAuthUser).toHaveBeenCalledWith('owner-id');
  });

  it('ignore l\'échec du nettoyage storage (non bloquant) et supprime quand même le compte', async () => {
    const repo = createMockUserDeletionRepository({
      deleteUserStorage: vi.fn().mockResolvedValue(failure(new Error('storage down'))),
    });
    const useCase = new DeleteAccountUseCase(repo, createMockLogger());

    const result = await useCase.execute({ userId: 'user-123', email: 'user@test.com' });

    expect(result.success).toBe(true);
    expect(repo.deleteAuthUser).toHaveBeenCalledWith('user-123');
  });

  it('ignore l\'échec de suppression des leads (table optionnelle, non bloquant)', async () => {
    const repo = createMockUserDeletionRepository({
      deleteLeadsByEmail: vi.fn().mockResolvedValue(failure(new Error('no leads table'))),
    });
    const useCase = new DeleteAccountUseCase(repo, createMockLogger());

    const result = await useCase.execute({ userId: 'user-123', email: 'user@test.com' });

    expect(result.success).toBe(true);
    expect(repo.deleteAuthUser).toHaveBeenCalledWith('user-123');
  });

  it('ne tente pas de supprimer les leads si l\'email est absent', async () => {
    const repo = createMockUserDeletionRepository();
    const useCase = new DeleteAccountUseCase(repo, createMockLogger());

    const result = await useCase.execute({ userId: 'user-123', email: null });

    expect(result.success).toBe(true);
    expect(repo.deleteLeadsByEmail).not.toHaveBeenCalled();
    expect(repo.deleteAuthUser).toHaveBeenCalledWith('user-123');
  });

  it('échoue si la suppression du compte auth échoue (bloquant)', async () => {
    const repo = createMockUserDeletionRepository({
      deleteAuthUser: vi.fn().mockResolvedValue(failure(new Error('auth delete failed'))),
    });
    const useCase = new DeleteAccountUseCase(repo, createMockLogger());

    const result = await useCase.execute({ userId: 'user-123', email: 'user@test.com' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('auth delete failed');
    }
  });
});
