import { vi } from 'vitest';
import { success } from '@/src/shared/types/Result';
import { IOrganizationRepository } from '@/src/domain/ports/repositories/IOrganizationRepository';
import { Organization, OrganizationMember } from '@/src/domain/entities/Organization';

export function makeOrg(overrides: Partial<Organization> = {}): Organization {
  return {
    id: 'org-1',
    ownerId: 'owner-1',
    name: 'Mon agence',
    plan: 'agence',
    status: 'active',
    seats: 3,
    stripeCustomerId: 'cus_1',
    stripeSubscriptionId: 'sub_1',
    renewsAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function makeMember(overrides: Partial<OrganizationMember> = {}): OrganizationMember {
  return {
    id: 'mem-1',
    organizationId: 'org-1',
    userId: 'owner-1',
    email: 'owner@test.com',
    role: 'member',
    status: 'active',
    invitedAt: new Date(),
    joinedAt: new Date(),
    ...overrides,
  };
}

export function createMockOrganizationRepository(
  overrides: Partial<IOrganizationRepository> = {},
): IOrganizationRepository {
  return {
    create: vi.fn().mockResolvedValue(success(makeOrg())),
    findById: vi.fn().mockResolvedValue(success(makeOrg())),
    findBySubscriptionId: vi.fn().mockResolvedValue(success(makeOrg())),
    findByOwnerId: vi.fn().mockResolvedValue(success(makeOrg())),
    update: vi.fn().mockResolvedValue(success(makeOrg())),
    listMembers: vi.fn().mockResolvedValue(success([makeMember({ role: 'owner' })])),
    countOccupiedSeats: vi.fn().mockResolvedValue(success(1)),
    addMember: vi.fn().mockResolvedValue(success(makeMember({ id: 'mem-new' }))),
    removeMember: vi.fn().mockResolvedValue(success(undefined)),
    findActiveOrgByMember: vi.fn().mockResolvedValue(success(null)),
    ...overrides,
  };
}
