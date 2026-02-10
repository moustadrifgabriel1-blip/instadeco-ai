'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getCredits, getCreditHistory } from '@/src/presentation/api/client';
import { CreditTransactionDTO } from '@/src/application/dtos/CreditDTO';
import { UseCreditsState, UseCreditsReturn, UseCreditHistoryReturn } from '@/src/presentation/types';
import { createClient } from '@/lib/supabase/client';

/**
 * Hook pour récupérer le solde de crédits avec mise à jour temps réel
 * 
 * @example
 * ```tsx
 * const { credits, state, refetch } = useCredits();
 * 
 * return <CreditsDisplay credits={credits} isLoading={state.isLoading} />;
 * ```
 */
export function useCredits(): UseCreditsReturn {
  const { user } = useAuth();
  const supabase = createClient();
  const abortControllerRef = useRef<AbortController | null>(null);

  const [credits, setCredits] = useState<number>(0);
  const [state, setState] = useState<UseCreditsState>({
    data: null,
    error: null,
    isLoading: true,
    isFetching: false,
    isSuccess: false,
    isError: false,
    formattedCredits: '0 crédit',
  });

  /**
   * Formate le nombre de crédits
   */
  const formatCredits = useCallback((count: number): string => {
    return `${count} ${count > 1 ? 'crédits' : 'crédit'}`;
  }, []);

  /**
   * Récupère les crédits
   */
  const fetchCredits = useCallback(async () => {
    if (!user) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Utilisateur non connecté',
      }));
      return;
    }

    // Annuler la requête précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setState((prev) => ({ ...prev, isFetching: true }));

    try {
      const response = await getCredits(
        {},
        { signal: abortControllerRef.current.signal }
      );

      setCredits(response.credits);
      setState({
        data: response.credits,
        error: null,
        isLoading: false,
        isFetching: false,
        isSuccess: true,
        isError: false,
        formattedCredits: formatCredits(response.credits),
      });

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
        isFetching: false,
        isError: true,
      }));
    }
  }, [user, formatCredits]);

  /**
   * Refetch manuel
   */
  const refetch = useCallback(async () => {
    await fetchCredits();
  }, [fetchCredits]);

  // Charger au montage et écouter les changements en temps réel
  useEffect(() => {
    fetchCredits();

    // Écouter les changements via Supabase Realtime
    if (!user) return;

    const channel = supabase
      .channel(`credits-hook-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const newCredits = (payload.new as { credits: number }).credits ?? 0;
          setCredits(newCredits);
          setState((prev) => ({
            ...prev,
            data: newCredits,
            formattedCredits: formatCredits(newCredits),
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [user, fetchCredits, supabase, formatCredits]);

  return {
    credits,
    state,
    refetch,
  };
}

/**
 * Hook pour récupérer l'historique des transactions de crédits
 * 
 * @example
 * ```tsx
 * const { transactions, isLoading, refetch } = useCreditHistory();
 * ```
 */
export function useCreditHistory(limit?: number): UseCreditHistoryReturn {
  const { user } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);

  const [transactions, setTransactions] = useState<CreditTransactionDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Récupère l'historique
   */
  const fetchHistory = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      setError('Utilisateur non connecté');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);

    try {
      const response = await getCreditHistory(
        { limit },
        { signal: abortControllerRef.current.signal }
      );

      setTransactions(response.transactions);
      setError(null);

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, [user, limit]);

  /**
   * Refetch manuel
   */
  const refetch = useCallback(async () => {
    await fetchHistory();
  }, [fetchHistory]);

  // Charger au montage
  useEffect(() => {
    fetchHistory();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchHistory]);

  return {
    transactions,
    isLoading,
    error,
    refetch,
  };
}
