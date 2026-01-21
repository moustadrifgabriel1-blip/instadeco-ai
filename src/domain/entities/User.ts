/**
 * Entité User
 * Représente un utilisateur du système
 */
export interface User {
  readonly id: string;
  readonly email: string;
  readonly fullName: string | null;
  readonly avatarUrl: string | null;
  readonly credits: number;
  readonly stripeCustomerId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
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
}
