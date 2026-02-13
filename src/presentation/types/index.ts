/**
 * Types pour la couche Presentation
 */

import { GenerationDTO } from '@/src/application/dtos/GenerationDTO';
import { CreditTransactionDTO } from '@/src/application/dtos/CreditDTO';

/**
 * États de chargement génériques
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Résultat d'une mutation asynchrone
 */
export interface MutationState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

/**
 * Résultat d'une query asynchrone
 */
export interface QueryState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  isFetching: boolean;
  isSuccess: boolean;
  isError: boolean;
}

// ========================
// GENERATION TYPES
// ========================

/**
 * Input pour générer un design
 */
export interface GenerateDesignInput {
  imageFile: File | string; // File ou base64/URL
  roomType: string;
  style: string;
  transformMode?: string; // Mode de transformation (full_redesign, keep_layout, decor_only)
}

/**
 * État du hook useGenerate
 */
export interface UseGenerateState extends MutationState<GenerationDTO> {
  progress: number; // 0-100
  statusMessage: string;
}

/**
 * Hook useGenerate return type
 */
export interface UseGenerateReturn {
  generate: (input: GenerateDesignInput) => Promise<GenerationDTO | null>;
  state: UseGenerateState;
  reset: () => void;
}

// ========================
// GENERATIONS LIST TYPES
// ========================

/**
 * Options pour récupérer les générations
 */
export interface FetchGenerationsOptions {
  limit?: number;
  offset?: number;
}

/**
 * État du hook useGenerations
 */
export interface UseGenerationsState extends QueryState<GenerationDTO[]> {
  total: number;
  hasMore: boolean;
}

/**
 * Hook useGenerations return type
 */
export interface UseGenerationsReturn {
  generations: GenerationDTO[];
  state: UseGenerationsState;
  refetch: () => Promise<void>;
  fetchMore: () => Promise<void>;
}

// ========================
// GENERATION STATUS TYPES
// ========================

/**
 * Hook useGenerationStatus return type
 */
export interface UseGenerationStatusReturn {
  generation: GenerationDTO | null;
  isComplete: boolean;
  isFailed: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ========================
// CREDITS TYPES
// ========================

/**
 * État du hook useCredits
 */
export interface UseCreditsState extends QueryState<number> {
  formattedCredits: string;
}

/**
 * Hook useCredits return type
 */
export interface UseCreditsReturn {
  credits: number;
  state: UseCreditsState;
  refetch: () => Promise<void>;
}

/**
 * Hook useCreditHistory return type
 */
export interface UseCreditHistoryReturn {
  transactions: CreditTransactionDTO[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ========================
// PAYMENT TYPES
// ========================

/**
 * Packs de crédits disponibles
 */
export type CreditPackId = 'pack_10' | 'pack_25' | 'pack_50' | 'pack_100';

/**
 * Plans d'abonnement disponibles
 */
export type SubscriptionPlanId = 'sub_essentiel' | 'sub_pro' | 'sub_business';
export type BillingInterval = 'monthly' | 'annual';

/**
 * Détails d'un pack de crédits
 */
export interface CreditPack {
  id: CreditPackId;
  credits: number;
  price: number; // en centimes
  priceDisplay: string;
  popular?: boolean;
  bestValue?: boolean;
}

/**
 * Input pour acheter des crédits
 */
export interface PurchaseCreditsInput {
  packId: CreditPackId;
  successUrl?: string;
  cancelUrl?: string;
  couponId?: string;
}

/**
 * Input pour souscrire à un abonnement
 */
export interface CreateSubscriptionInput {
  planId: SubscriptionPlanId;
  interval: BillingInterval;
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Hook usePurchaseCredits return type
 */
export interface UsePurchaseCreditsReturn {
  purchase: (input: PurchaseCreditsInput) => Promise<string | null>; // Returns checkout URL
  isLoading: boolean;
  error: string | null;
}

// ========================
// COMPONENT PROPS
// ========================

/**
 * Props pour GenerationCard
 */
export interface GenerationCardProps {
  generation: GenerationDTO;
  onDownload?: (generation: GenerationDTO) => void;
  showActions?: boolean;
  className?: string;
}

/**
 * Props pour GenerationGallery
 */
export interface GenerationGalleryProps {
  generations: GenerationDTO[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  emptyMessage?: string;
  className?: string;
}

/**
 * Props pour CreditsDisplay
 */
export interface CreditsDisplayProps {
  credits: number;
  isLoading?: boolean;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Props pour CreditsPurchase
 */
export interface CreditsPurchaseProps {
  onPurchaseStart?: (packId: CreditPackId) => void;
  onPurchaseSuccess?: () => void;
  onPurchaseError?: (error: string) => void;
  className?: string;
}

/**
 * Props pour GenerateForm
 */
export interface GenerateFormProps {
  onGenerateStart?: () => void;
  onGenerateSuccess?: (generation: GenerationDTO) => void;
  onGenerateError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}
