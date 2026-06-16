import { Result, success, failure } from '@/src/shared/types/Result';
import { IOrganizationRepository } from '@/src/domain/ports/repositories/IOrganizationRepository';
import { IUserRepository } from '@/src/domain/ports/repositories/IUserRepository';
import { Organization, OrganizationMember } from '@/src/domain/entities/Organization';

/**
 * Use cases de gestion d'une organisation Agence (vue/owner).
 * Toute la logique métier multi-tenant : lecture, invitation (cap sièges), retrait.
 */

export interface OrganizationView {
  organization: Organization | null;
  members: OrganizationMember[];
  seatsUsed: number;
  seatsTotal: number;
}

/** Récupère l'org dont l'utilisateur est OWNER + ses membres. organization=null si non-owner. */
export class GetOrganizationUseCase {
  constructor(private readonly orgRepo: IOrganizationRepository) {}

  async execute(userId: string): Promise<Result<OrganizationView>> {
    const orgRes = await this.orgRepo.findByOwnerId(userId);
    if (!orgRes.success) return failure(orgRes.error as Error);
    const organization = orgRes.data;
    if (!organization) {
      return success({ organization: null, members: [], seatsUsed: 0, seatsTotal: 0 });
    }

    const membersRes = await this.orgRepo.listMembers(organization.id);
    if (!membersRes.success) return failure(membersRes.error as Error);
    const members = membersRes.data;
    const seatsUsed = members.filter((m) => m.status === 'active' || m.status === 'pending').length;

    return success({ organization, members, seatsUsed, seatsTotal: organization.seats });
  }
}

export interface InviteMemberInput {
  ownerId: string;
  email: string;
}

/** L'owner invite un membre par email (cap = sièges). */
export class InviteMemberUseCase {
  constructor(
    private readonly orgRepo: IOrganizationRepository,
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(input: InviteMemberInput): Promise<Result<OrganizationMember>> {
    const email = input.email.trim().toLowerCase();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return failure(new Error('Email invalide'));
    }

    const orgRes = await this.orgRepo.findByOwnerId(input.ownerId);
    if (!orgRes.success) return failure(orgRes.error as Error);
    const org = orgRes.data;
    if (!org) return failure(new Error("Aucune organisation : l'offre Agence est requise pour inviter des membres."));
    if (org.status !== 'active') return failure(new Error('Abonnement Agence inactif.'));

    // Cap sièges (compte les membres actifs + invitations en attente).
    const occupied = await this.orgRepo.countOccupiedSeats(org.id);
    if (!occupied.success) return failure(occupied.error as Error);
    if (occupied.data >= org.seats) {
      return failure(new Error(`Tous les sièges sont occupés (${org.seats}). Retirez un membre ou contactez-nous pour en ajouter.`));
    }

    // Déjà membre ?
    const members = await this.orgRepo.listMembers(org.id);
    if (members.success && members.data.some((m) => m.email === email)) {
      return failure(new Error('Cet email fait déjà partie de l\'organisation.'));
    }

    // Lier un compte existant (membre actif immédiat) ou laisser en attente.
    const existing = await this.userRepo.findByEmail(email);
    const userId = existing.success && existing.data ? existing.data.id : null;

    return this.orgRepo.addMember({
      organizationId: org.id,
      email,
      userId,
      role: 'member',
      status: userId ? 'active' : 'pending',
    });
  }
}

export interface RemoveMemberInput {
  ownerId: string;
  memberId: string;
}

/** L'owner retire un membre (libère un siège). L'owner ne peut pas se retirer. */
export class RemoveMemberUseCase {
  constructor(private readonly orgRepo: IOrganizationRepository) {}

  async execute(input: RemoveMemberInput): Promise<Result<void>> {
    const orgRes = await this.orgRepo.findByOwnerId(input.ownerId);
    if (!orgRes.success) return failure(orgRes.error as Error);
    const org = orgRes.data;
    if (!org) return failure(new Error('Aucune organisation.'));

    const membersRes = await this.orgRepo.listMembers(org.id);
    if (!membersRes.success) return failure(membersRes.error as Error);
    const target = membersRes.data.find((m) => m.id === input.memberId);
    if (!target) return failure(new Error('Membre introuvable.'));
    if (target.role === 'owner') return failure(new Error('Le propriétaire ne peut pas être retiré.'));

    return this.orgRepo.removeMember(org.id, input.memberId);
  }
}
