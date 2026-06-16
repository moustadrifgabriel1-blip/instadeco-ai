/**
 * Entités multi-tenant (offre Agence)
 * Une organisation regroupe ≤ seats membres qui partagent l'abonnement Agence.
 */

export type OrgStatus = 'active' | 'canceled' | 'past_due';
export type OrgMemberRole = 'owner' | 'member';
export type OrgMemberStatus = 'active' | 'pending' | 'removed';

export interface Organization {
  readonly id: string;
  readonly ownerId: string;
  readonly name: string;
  readonly plan: string;
  readonly status: OrgStatus;
  readonly seats: number;
  readonly stripeCustomerId: string | null;
  readonly stripeSubscriptionId: string | null;
  readonly renewsAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface OrganizationMember {
  readonly id: string;
  readonly organizationId: string;
  /** NULL tant que l'invité n'a pas de compte (invitation en attente). */
  readonly userId: string | null;
  readonly email: string;
  readonly role: OrgMemberRole;
  readonly status: OrgMemberStatus;
  readonly invitedAt: Date;
  readonly joinedAt: Date | null;
}

export interface CreateOrganizationInput {
  ownerId: string;
  ownerEmail: string;
  name: string;
  seats?: number;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  renewsAt?: Date | null;
}

export interface UpdateOrganizationInput {
  status?: OrgStatus;
  seats?: number;
  renewsAt?: Date | null;
  name?: string;
}

export interface AddMemberInput {
  organizationId: string;
  email: string;
  userId?: string | null;
  role?: OrgMemberRole;
  status?: OrgMemberStatus;
}
