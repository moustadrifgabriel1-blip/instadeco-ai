import { Result } from '@/src/shared/types/Result';
import {
  Organization,
  OrganizationMember,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  AddMemberInput,
} from '../../entities/Organization';

/**
 * Port Repository - Organization (offre Agence multi-tenant)
 */
export interface IOrganizationRepository {
  /** Crée l'organisation ET son membre owner (status active). */
  create(input: CreateOrganizationInput): Promise<Result<Organization>>;

  findById(id: string): Promise<Result<Organization | null>>;
  findBySubscriptionId(subscriptionId: string): Promise<Result<Organization | null>>;
  findByOwnerId(ownerId: string): Promise<Result<Organization | null>>;

  update(id: string, input: UpdateOrganizationInput): Promise<Result<Organization>>;

  /** Membres non retirés de l'org. */
  listMembers(organizationId: string): Promise<Result<OrganizationMember[]>>;
  /** Compte les sièges occupés (status active|pending). */
  countOccupiedSeats(organizationId: string): Promise<Result<number>>;

  addMember(input: AddMemberInput): Promise<Result<OrganizationMember>>;
  /** Marque un membre comme retiré (libère un siège). */
  removeMember(organizationId: string, memberId: string): Promise<Result<void>>;

  /**
   * Renvoie l'org ACTIVE dont l'utilisateur est membre actif (pour le gate de génération).
   * Null si l'utilisateur n'appartient à aucune org agence active.
   */
  findActiveOrgByMember(userId: string): Promise<Result<Organization | null>>;
}
