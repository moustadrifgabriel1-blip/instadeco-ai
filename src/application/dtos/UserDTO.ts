/**
 * DTO pour l'utilisateur (exposé à l'API/UI)
 */
export interface UserDTO {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  credits: number;
  createdAt: string;
}

/**
 * DTO pour les informations de session
 */
export interface SessionDTO {
  user: UserDTO;
  isAuthenticated: boolean;
}
