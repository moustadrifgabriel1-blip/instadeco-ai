'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { 
  createHDUnlockSession, 
  confirmHDUnlock as confirmHDUnlockApi 
} from '@/src/presentation/api/client';
import { UseHDUnlockReturn, UnlockHDInput } from '@/src/presentation/types';

/**
 * Hook pour débloquer les images HD
 * 
 * @example
 * ```tsx
 * const { unlock, confirm, isLoading, error } = useHDUnlock();
 * 
 * // Démarrer le processus
 * const checkoutUrl = await unlock({ generationId: 'gen_123' });
 * if (checkoutUrl) {
 *   window.location.href = checkoutUrl;
 * }
 * 
 * // Après le paiement (dans la page de succès)
 * const success = await confirm(sessionId, generationId);
 * ```
 */
export function useHDUnlock(): UseHDUnlockReturn {
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Crée une session pour débloquer HD
   */
  const unlock = useCallback(
    async (input: UnlockHDInput): Promise<string | null> => {
      if (!user || !user.email) {
        setError('Vous devez être connecté');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await createHDUnlockSession({
          generationId: input.generationId,
          successUrl: input.successUrl,
          cancelUrl: input.cancelUrl,
        });

        // Déjà débloqué
        if (response.alreadyUnlocked) {
          setError('Cette image HD est déjà débloquée');
          return null;
        }

        return response.checkoutUrl || null;

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

  /**
   * Confirme le déblocage après paiement
   */
  const confirm = useCallback(
    async (sessionId: string, generationId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await confirmHDUnlockApi({
          sessionId,
          generationId,
        });

        return response.success;

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        return false;

      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    unlock,
    confirm,
    isLoading,
    error,
  };
}
