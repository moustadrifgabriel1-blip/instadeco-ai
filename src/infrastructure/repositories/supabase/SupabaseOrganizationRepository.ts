import { Result, success, failure } from '@/src/shared/types/Result';
import {
  Organization,
  OrganizationMember,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  AddMemberInput,
} from '@/src/domain/entities/Organization';
import { IOrganizationRepository } from '@/src/domain/ports/repositories/IOrganizationRepository';
import { getSupabaseAdmin, OrganizationRow, OrganizationMemberRow } from './supabaseClient';

/**
 * Adapter: Supabase Organization Repository (offre Agence multi-tenant).
 * Tables service-role-only (RLS sans policy) → toujours via le client admin.
 */
export class SupabaseOrganizationRepository implements IOrganizationRepository {
  private get supabase() {
    return getSupabaseAdmin();
  }

  private toOrg(row: OrganizationRow): Organization {
    return {
      id: row.id,
      ownerId: row.owner_id,
      name: row.name,
      plan: row.plan,
      status: row.status as Organization['status'],
      seats: row.seats,
      stripeCustomerId: row.stripe_customer_id,
      stripeSubscriptionId: row.stripe_subscription_id,
      renewsAt: row.renews_at ? new Date(row.renews_at) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private toMember(row: OrganizationMemberRow): OrganizationMember {
    return {
      id: row.id,
      organizationId: row.organization_id,
      userId: row.user_id,
      email: row.email,
      role: row.role as OrganizationMember['role'],
      status: row.status as OrganizationMember['status'],
      invitedAt: new Date(row.invited_at),
      joinedAt: row.joined_at ? new Date(row.joined_at) : null,
    };
  }

  async create(input: CreateOrganizationInput): Promise<Result<Organization>> {
    const { data, error } = await this.supabase
      .from('organizations')
      .insert({
        owner_id: input.ownerId,
        name: input.name,
        seats: input.seats ?? 3,
        stripe_customer_id: input.stripeCustomerId ?? null,
        stripe_subscription_id: input.stripeSubscriptionId ?? null,
        renews_at: input.renewsAt ? input.renewsAt.toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      return failure(new Error(`Failed to create organization: ${error.message}`));
    }

    const org = this.toOrg(data as OrganizationRow);

    // Le owner est membre actif de son org.
    const { error: memberError } = await this.supabase.from('organization_members').insert({
      organization_id: org.id,
      user_id: input.ownerId,
      email: input.ownerEmail.toLowerCase(),
      role: 'owner',
      status: 'active',
      joined_at: new Date().toISOString(),
    });

    if (memberError) {
      // Rollback : pas d'org orpheline sans owner.
      await this.supabase.from('organizations').delete().eq('id', org.id);
      return failure(new Error(`Failed to create owner member: ${memberError.message}`));
    }

    return success(org);
  }

  async findById(id: string): Promise<Result<Organization | null>> {
    const { data, error } = await this.supabase.from('organizations').select('*').eq('id', id).maybeSingle();
    if (error) return failure(new Error(`Failed to find organization: ${error.message}`));
    return success(data ? this.toOrg(data as OrganizationRow) : null);
  }

  async findBySubscriptionId(subscriptionId: string): Promise<Result<Organization | null>> {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('*')
      .eq('stripe_subscription_id', subscriptionId)
      .maybeSingle();
    if (error) return failure(new Error(`Failed to find organization by subscription: ${error.message}`));
    return success(data ? this.toOrg(data as OrganizationRow) : null);
  }

  async findByOwnerId(ownerId: string): Promise<Result<Organization | null>> {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return failure(new Error(`Failed to find organization by owner: ${error.message}`));
    return success(data ? this.toOrg(data as OrganizationRow) : null);
  }

  async update(id: string, input: UpdateOrganizationInput): Promise<Result<Organization>> {
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.status !== undefined) updateData.status = input.status;
    if (input.seats !== undefined) updateData.seats = input.seats;
    if (input.name !== undefined) updateData.name = input.name;
    if (input.renewsAt !== undefined) {
      updateData.renews_at = input.renewsAt ? input.renewsAt.toISOString() : null;
    }

    const { data, error } = await this.supabase
      .from('organizations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) return failure(new Error(`Failed to update organization: ${error.message}`));
    return success(this.toOrg(data as OrganizationRow));
  }

  async listMembers(organizationId: string): Promise<Result<OrganizationMember[]>> {
    const { data, error } = await this.supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', organizationId)
      .neq('status', 'removed')
      .order('invited_at', { ascending: true });
    if (error) return failure(new Error(`Failed to list members: ${error.message}`));
    return success((data as OrganizationMemberRow[]).map((r) => this.toMember(r)));
  }

  async countOccupiedSeats(organizationId: string): Promise<Result<number>> {
    const { count, error } = await this.supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .in('status', ['active', 'pending']);
    if (error) return failure(new Error(`Failed to count seats: ${error.message}`));
    return success(count ?? 0);
  }

  async addMember(input: AddMemberInput): Promise<Result<OrganizationMember>> {
    const { data, error } = await this.supabase
      .from('organization_members')
      .insert({
        organization_id: input.organizationId,
        user_id: input.userId ?? null,
        email: input.email.toLowerCase(),
        role: input.role ?? 'member',
        status: input.status ?? (input.userId ? 'active' : 'pending'),
        joined_at: input.userId ? new Date().toISOString() : null,
      })
      .select()
      .single();
    if (error) return failure(new Error(`Failed to add member: ${error.message}`));
    return success(this.toMember(data as OrganizationMemberRow));
  }

  async removeMember(organizationId: string, memberId: string): Promise<Result<void>> {
    const { error } = await this.supabase
      .from('organization_members')
      .update({ status: 'removed' })
      .eq('id', memberId)
      .eq('organization_id', organizationId);
    if (error) return failure(new Error(`Failed to remove member: ${error.message}`));
    return success(undefined);
  }

  async findActiveOrgByMember(userId: string): Promise<Result<Organization | null>> {
    const { data, error } = await this.supabase
      .from('organization_members')
      .select('organizations!inner(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .eq('organizations.status', 'active')
      .limit(1)
      .maybeSingle();
    if (error) return failure(new Error(`Failed to find active org by member: ${error.message}`));
    if (!data) return success(null);
    const org = (data as unknown as { organizations: OrganizationRow }).organizations;
    return success(org ? this.toOrg(org) : null);
  }
}
