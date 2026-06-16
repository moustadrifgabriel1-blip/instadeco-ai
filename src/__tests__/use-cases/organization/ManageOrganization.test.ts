import { describe, it, expect, vi } from 'vitest';
import {
  GetOrganizationUseCase,
  InviteMemberUseCase,
  RemoveMemberUseCase,
} from '@/src/application/use-cases/organization/ManageOrganizationUseCases';
import { success } from '@/src/shared/types/Result';
import {
  createMockOrganizationRepository,
  makeOrg,
  makeMember,
} from '@/src/__tests__/mocks/organizationRepository.mock';
import { createMockUserRepository } from '@/src/__tests__/mocks/userRepository.mock';

describe('GetOrganizationUseCase', () => {
  it('renvoie org + membres + sièges pour un owner', async () => {
    const orgRepo = createMockOrganizationRepository({
      listMembers: vi.fn().mockResolvedValue(success([
        makeMember({ role: 'owner', status: 'active' }),
        makeMember({ id: 'm2', email: 'a@b.c', status: 'active' }),
        makeMember({ id: 'm3', email: 'p@b.c', status: 'pending' }),
      ])),
    });
    const res = await new GetOrganizationUseCase(orgRepo).execute('owner-1');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.organization?.id).toBe('org-1');
      expect(res.data.seatsUsed).toBe(3);
      expect(res.data.seatsTotal).toBe(3);
    }
  });

  it('organization=null si l\'utilisateur n\'est pas owner', async () => {
    const orgRepo = createMockOrganizationRepository({
      findByOwnerId: vi.fn().mockResolvedValue(success(null)),
    });
    const res = await new GetOrganizationUseCase(orgRepo).execute('not-owner');
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.organization).toBeNull();
  });
});

describe('InviteMemberUseCase', () => {
  it('rejette un email invalide', async () => {
    const res = await new InviteMemberUseCase(
      createMockOrganizationRepository(),
      createMockUserRepository(),
    ).execute({ ownerId: 'owner-1', email: 'pas-un-email' });
    expect(res.success).toBe(false);
  });

  it('échoue si aucune organisation (pas d\'offre Agence)', async () => {
    const orgRepo = createMockOrganizationRepository({
      findByOwnerId: vi.fn().mockResolvedValue(success(null)),
    });
    const res = await new InviteMemberUseCase(orgRepo, createMockUserRepository())
      .execute({ ownerId: 'owner-1', email: 'new@test.com' });
    expect(res.success).toBe(false);
  });

  it('échoue si tous les sièges sont occupés', async () => {
    const orgRepo = createMockOrganizationRepository({
      countOccupiedSeats: vi.fn().mockResolvedValue(success(3)), // seats=3
    });
    const res = await new InviteMemberUseCase(orgRepo, createMockUserRepository())
      .execute({ ownerId: 'owner-1', email: 'new@test.com' });
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error.message).toMatch(/sièges/i);
  });

  it('échoue si l\'email est déjà membre', async () => {
    const orgRepo = createMockOrganizationRepository({
      countOccupiedSeats: vi.fn().mockResolvedValue(success(1)),
      listMembers: vi.fn().mockResolvedValue(success([makeMember({ email: 'dup@test.com' })])),
    });
    const res = await new InviteMemberUseCase(orgRepo, createMockUserRepository())
      .execute({ ownerId: 'owner-1', email: 'dup@test.com' });
    expect(res.success).toBe(false);
  });

  it('ajoute un membre ACTIF si le compte existe déjà', async () => {
    const orgRepo = createMockOrganizationRepository({
      countOccupiedSeats: vi.fn().mockResolvedValue(success(1)),
      listMembers: vi.fn().mockResolvedValue(success([makeMember({ role: 'owner' })])),
    });
    const userRepo = createMockUserRepository(); // findByEmail renvoie un user
    const res = await new InviteMemberUseCase(orgRepo, userRepo)
      .execute({ ownerId: 'owner-1', email: 'existing@test.com' });
    expect(res.success).toBe(true);
    expect(orgRepo.addMember).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'existing@test.com', status: 'active', role: 'member' }),
    );
  });

  it('ajoute une invitation EN ATTENTE si le compte n\'existe pas', async () => {
    const orgRepo = createMockOrganizationRepository({
      countOccupiedSeats: vi.fn().mockResolvedValue(success(1)),
      listMembers: vi.fn().mockResolvedValue(success([makeMember({ role: 'owner' })])),
    });
    const userRepo = createMockUserRepository({
      findByEmail: vi.fn().mockResolvedValue(success(null)),
    });
    const res = await new InviteMemberUseCase(orgRepo, userRepo)
      .execute({ ownerId: 'owner-1', email: 'newpro@test.com' });
    expect(res.success).toBe(true);
    expect(orgRepo.addMember).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'newpro@test.com', status: 'pending', userId: null }),
    );
  });
});

describe('RemoveMemberUseCase', () => {
  it('retire un membre', async () => {
    const orgRepo = createMockOrganizationRepository({
      listMembers: vi.fn().mockResolvedValue(success([
        makeMember({ id: 'owner-mem', role: 'owner' }),
        makeMember({ id: 'mem-2', role: 'member', email: 'm@test.com' }),
      ])),
    });
    const res = await new RemoveMemberUseCase(orgRepo).execute({ ownerId: 'owner-1', memberId: 'mem-2' });
    expect(res.success).toBe(true);
    expect(orgRepo.removeMember).toHaveBeenCalledWith('org-1', 'mem-2');
  });

  it('refuse de retirer le owner', async () => {
    const orgRepo = createMockOrganizationRepository({
      listMembers: vi.fn().mockResolvedValue(success([makeMember({ id: 'owner-mem', role: 'owner' })])),
    });
    const res = await new RemoveMemberUseCase(orgRepo).execute({ ownerId: 'owner-1', memberId: 'owner-mem' });
    expect(res.success).toBe(false);
    expect(orgRepo.removeMember).not.toHaveBeenCalled();
  });

  it('échoue si le membre est introuvable', async () => {
    const orgRepo = createMockOrganizationRepository({
      listMembers: vi.fn().mockResolvedValue(success([makeMember({ id: 'owner-mem', role: 'owner' })])),
    });
    const res = await new RemoveMemberUseCase(orgRepo).execute({ ownerId: 'owner-1', memberId: 'ghost' });
    expect(res.success).toBe(false);
  });
});
