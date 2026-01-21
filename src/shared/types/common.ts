/**
 * Types communs partagés dans l'application
 */

/**
 * ID unique (UUID ou string)
 */
export type UniqueId = string;

/**
 * Timestamp ISO 8601
 */
export type ISOTimestamp = string;

/**
 * Pagination
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Tri
 */
export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Type utilitaire pour rendre certaines propriétés optionnelles
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Type utilitaire pour rendre certaines propriétés requises
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Type pour les réponses d'API
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
