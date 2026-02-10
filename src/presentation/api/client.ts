/**
 * Client API V2 pour la couche Presentation
 * 
 * Encapsule tous les appels fetch vers l'API V2
 */

import { GenerationDTO } from '@/src/application/dtos/GenerationDTO';
import { CreditTransactionDTO } from '@/src/application/dtos/CreditDTO';

const API_BASE = '/api/v2';

/**
 * Options pour les requêtes
 */
interface RequestOptions {
  signal?: AbortSignal;
}

/**
 * Réponse générique de l'API
 */
interface ApiResponse<T> {
  success?: boolean;
  error?: string;
  details?: unknown;
  data?: T;
}

/**
 * Helper pour gérer les erreurs fetch
 */
async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");
  let data;

  try {
    const text = await response.text();
    try {
      data = JSON.parse(text);
    } catch {
      // Si ce n'est pas du JSON, c'est probablement une erreur serveur (504, 500 html)
      console.error('[API Client] Non-JSON response:', text.substring(0, 200));
      throw new Error(response.status === 504 ? 'Le serveur a mis trop de temps à répondre. Veuillez réessayer.' : `Erreur serveur inattendue (${response.status})`);
    }
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Erreur de communication avec le serveur');
  }

  if (!response.ok) {
    throw new Error(data.error || `Erreur HTTP ${response.status}`);
  }

  return data;
}

// ========================
// GENERATION API
// ========================

export interface GenerateDesignRequest {
  userId: string;
  imageUrl: string;
  roomType: string;
  style: string;
  transformMode?: string;
}

export interface GenerateDesignResponse {
  success: boolean;
  generation: GenerationDTO;
  creditsRemaining: number;
  message?: string;
}

export async function generateDesign(
  request: GenerateDesignRequest,
  options?: RequestOptions
): Promise<GenerateDesignResponse> {
  const response = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal: options?.signal,
  });

  return handleResponse<GenerateDesignResponse>(response);
}

// ========================
// GENERATIONS LIST API
// ========================

export interface GetGenerationsRequest {
  userId?: string; // Déprécié - l'auth est gérée côté serveur
  limit?: number;
}

export interface GetGenerationsResponse {
  generations: GenerationDTO[];
  total: number;
}

export async function getGenerations(
  request: GetGenerationsRequest,
  options?: RequestOptions
): Promise<GetGenerationsResponse> {
  const params = new URLSearchParams();
  if (request.limit) params.append('limit', request.limit.toString());

  const response = await fetch(`${API_BASE}/generations?${params}`, {
    method: 'GET',
    signal: options?.signal,
  });

  return handleResponse<GetGenerationsResponse>(response);
}

// ========================
// GENERATION STATUS API
// ========================

export interface GetGenerationStatusRequest {
  generationId: string;
  userId?: string;
}

export interface GetGenerationStatusResponse {
  generation: GenerationDTO;
  status: string;
  isComplete: boolean;
  isFailed: boolean;
}

export async function getGenerationStatus(
  request: GetGenerationStatusRequest,
  options?: RequestOptions
): Promise<GetGenerationStatusResponse> {
  // L'auth est gérée côté serveur via les cookies Supabase
  const response = await fetch(
    `${API_BASE}/generations/${request.generationId}/status`,
    {
      method: 'GET',
      signal: options?.signal,
    }
  );

  return handleResponse<GetGenerationStatusResponse>(response);
}

// ========================
// CREDITS API
// ========================

export interface GetCreditsRequest {
  // userId is now extracted from auth token server-side
}

export interface GetCreditsResponse {
  credits: number;
  userId: string;
}

export async function getCredits(
  request?: GetCreditsRequest,
  options?: RequestOptions
): Promise<GetCreditsResponse> {
  const response = await fetch(`${API_BASE}/credits`, {
    method: 'GET',
    signal: options?.signal,
  });

  return handleResponse<GetCreditsResponse>(response);
}

export interface GetCreditHistoryRequest {
  limit?: number;
}

export interface GetCreditHistoryResponse {
  transactions: CreditTransactionDTO[];
  total: number;
}

export async function getCreditHistory(
  request: GetCreditHistoryRequest,
  options?: RequestOptions
): Promise<GetCreditHistoryResponse> {
  const params = new URLSearchParams({
    ...(request.limit && { limit: request.limit.toString() }),
  });

  const response = await fetch(`${API_BASE}/credits/history?${params}`, {
    method: 'GET',
    signal: options?.signal,
  });

  return handleResponse<GetCreditHistoryResponse>(response);
}

// ========================
// PAYMENTS API
// ========================

export interface CreateCheckoutRequest {
  packId: 'pack_10' | 'pack_25' | 'pack_50' | 'pack_100';
  successUrl?: string;
  cancelUrl?: string;
}

export interface CreateCheckoutResponse {
  success: boolean;
  checkoutUrl: string;
  sessionId: string;
  order: {
    packId: string;
    credits: number;
  };
}

export async function createCheckoutSession(
  request: CreateCheckoutRequest,
  options?: RequestOptions
): Promise<CreateCheckoutResponse> {
  const response = await fetch(`${API_BASE}/payments/create-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal: options?.signal,
  });

  return handleResponse<CreateCheckoutResponse>(response);
}

// ========================
// SUBSCRIPTIONS API
// ========================

export interface CreateSubscriptionRequest {
  planId: 'sub_essentiel' | 'sub_pro' | 'sub_business';
  interval: 'monthly' | 'annual';
  successUrl?: string;
  cancelUrl?: string;
}

export interface CreateSubscriptionResponse {
  success: boolean;
  checkoutUrl: string;
  sessionId: string;
  subscription: {
    planId: string;
    interval: string;
    creditsPerMonth: number;
  };
}

export async function createSubscriptionSession(
  request: CreateSubscriptionRequest,
  options?: RequestOptions
): Promise<CreateSubscriptionResponse> {
  const response = await fetch(`${API_BASE}/payments/create-subscription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal: options?.signal,
  });

  return handleResponse<CreateSubscriptionResponse>(response);
}

// ========================
// HD UNLOCK API
// ========================

export interface CreateHDUnlockRequest {
  generationId: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CreateHDUnlockResponse {
  success: boolean;
  checkoutUrl?: string;
  sessionId?: string;
  alreadyUnlocked?: boolean;
  message?: string;
}

export async function createHDUnlockSession(
  request: CreateHDUnlockRequest,
  options?: RequestOptions
): Promise<CreateHDUnlockResponse> {
  const response = await fetch(`${API_BASE}/hd-unlock/create-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal: options?.signal,
  });

  return handleResponse<CreateHDUnlockResponse>(response);
}

export interface ConfirmHDUnlockRequest {
  sessionId: string;
  generationId: string;
}

export interface ConfirmHDUnlockResponse {
  success: boolean;
  generationId: string;
  imageUrl: string;
  downloadUrl: string;
  message?: string;
}

export async function confirmHDUnlock(
  request: ConfirmHDUnlockRequest,
  options?: RequestOptions
): Promise<ConfirmHDUnlockResponse> {
  const response = await fetch(`${API_BASE}/hd-unlock/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal: options?.signal,
  });

  return handleResponse<ConfirmHDUnlockResponse>(response);
}
