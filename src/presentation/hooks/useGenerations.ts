'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getGenerations } from '@/src/presentation/api/client';
import { GenerationDTO } from '@/src/application/dtos/GenerationDTO';
import { UseGenerationsState, UseGenerationsReturn, FetchGenerationsOptions } from '@/src/presentation/types';

const DEFAULT_LIMIT = 20;

/**
 * Hook pour récupérer les générations de l'utilisateur
 * 
 * @example
 * ```tsx
 * const { generations, state, refetch, fetchMore } = useGenerations({ limit: 10 });
 * 
 * return (
 *   <div>
 *     {generations.map(gen => <GenerationCard key={gen.id} generation={gen} />)}
 *     {state.hasMore && <button onClick={fetchMore}>Charger plus</button>}
 *   </div>
 * );
 * ```
 */
export function useGenerations(options?: FetchGenerationsOptions): UseGenerationsReturn {
  const { user } = useAuth();
  const limit = options?.limit ?? DEFAULT_LIMIT;
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const [state, setState] = useState<UseGenerationsState>({
    data: null,
    error: null,
    isLoading: true,
    isFetching: false,
    isSuccess: false,
    isError: false,
    total: 0,
    hasMore: false,
  });

  const [generations, setGenerations] = useState<GenerationDTO[]>([]);
  const [offset, setOffset] = useState(0);

  /**
   * Récupère les générations
   */
  const fetchGenerations = useCallback(
    async (reset: boolean = true) => {
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

      setState((prev) => ({
        ...prev,
        isLoading: reset,
        isFetching: true,
        error: null,
      }));

      try {
        const response = await getGenerations(
          { userId: user.id, limit },
          { signal: abortControllerRef.current.signal }
        );

        const newGenerations = response.generations;

        if (reset) {
          setGenerations(newGenerations);
          setOffset(newGenerations.length);
        } else {
          setGenerations((prev) => [...prev, ...newGenerations]);
          setOffset((prev) => prev + newGenerations.length);
        }

        setState({
          data: newGenerations,
          error: null,
          isLoading: false,
          isFetching: false,
          isSuccess: true,
          isError: false,
          total: response.total,
          hasMore: newGenerations.length === limit,
        });

      } catch (error) {
        // Ignorer les erreurs d'annulation
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
    },
    [user, limit]
  );

  /**
   * Rafraîchit les générations
   */
  const refetch = useCallback(async () => {
    await fetchGenerations(true);
  }, [fetchGenerations]);

  /**
   * Charge plus de générations (pagination)
   */
  const fetchMore = useCallback(async () => {
    if (state.isFetching || !state.hasMore) return;
    await fetchGenerations(false);
  }, [fetchGenerations, state.isFetching, state.hasMore]);

  // Charger au montage
  useEffect(() => {
    fetchGenerations(true);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchGenerations]);

  return {
    generations,
    state,
    refetch,
    fetchMore,
  };
}
