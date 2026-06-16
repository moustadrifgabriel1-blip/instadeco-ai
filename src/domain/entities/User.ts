/**
 * Entité User
 * Représente un utilisateur du système
 */

/** Paliers d'abonnement Pro/immobilier. */
export type ProPlan = 'solo' | 'pro' | 'agence';
/** État de l'abonnement. */
export type ProStatus = 'active' | 'canceled' | 'past_due';

export interface User {
  readonly id: string;
  readonly email: string;
  readonly fullName: string | null;
  readonly avatarUrl: string | null;
  readonly credits: number;
  readonly stripeCustomerId: string | null;
  readonly stripeSubscriptionId: string | null;
  readonly proPlan: ProPlan | null;
  readonly proStatus: ProStatus | null;
  readonly proRenewsAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Abonnement Pro/Agence actif = génération illimitée (pas de débit crédits).
 * Solo reste sur le ledger crédits (quota mensuel).
 */
export function isUnlimitedPro(user: Pick<User, 'proStatus' | 'proPlan'>): boolean {
  return user.proStatus === 'active' && (user.proPlan === 'pro' || user.proPlan === 'agence');
}

export interface CreateUserInput {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
}

export interface UpdateUserInput {
  fullName?: string;
  avatarUrl?: string;
  credits?: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string | null;
  proPlan?: ProPlan | null;
  proStatus?: ProStatus | null;
  proRenewsAt?: Date | string | null;
}
