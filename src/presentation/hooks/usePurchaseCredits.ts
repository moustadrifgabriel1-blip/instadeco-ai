'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { createCheckoutSession } from '@/src/presentation/api/client';
import { UsePurchaseCreditsReturn, CreditPackId } from '@/src/presentation/types';

/**
 * Hook pour acheter des crédits
 * 
 * @example
 * ```tsx
 * const { purchase, isLoading, error } = usePurchaseCredits();
 * 
 * const handlePurchase = async () => {
 *   const checkoutUrl = await purchase({ packId: 'pack_25' });
 *   if (checkoutUrl) {
 *     window.location.href = checkoutUrl;
 *   }
 * };
 * ```
 */
export function usePurchaseCredits(): UsePurchaseCreditsReturn {
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Crée une session de checkout pour acheter des crédits
   */
  const purchase = useCallback(
    async (input: {
      packId: CreditPackId;
      successUrl?: string;
      cancelUrl?: string;
    }): Promise<string | null> => {
      if (!user || !user.email) {
        setError('Vous devez être connecté');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await createCheckoutSession({
          userId: user.id,
          email: user.email,
          packId: input.packId,
          successUrl: input.successUrl,
          cancelUrl: input.cancelUrl,
        });

        return response.checkoutUrl;

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        return null;

      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  return {
    purchase,
    isLoading,
    error,
  };
}
