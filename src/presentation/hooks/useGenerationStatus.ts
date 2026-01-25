'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getGenerationStatus } from '@/src/presentation/api/client';
import { GenerationDTO } from '@/src/application/dtos/GenerationDTO';
import { UseGenerationStatusReturn } from '@/src/presentation/types';

const POLLING_INTERVAL = 3000; // 3 secondes

/**
 * Hook pour suivre le statut d'une génération en temps réel
 * 
 * @example
 * ```tsx
 * const { generation, isComplete, isFailed, isLoading } = useGenerationStatus(generationId);
 * 
 * if (isLoading) return <Spinner />;
 * if (isFailed) return <Error message={generation?.errorMessage} />;
 * if (isComplete) return <Image src={generation?.outputImageUrl} />;
 * ```
 */
export function useGenerationStatus(
  generationId: string | null,
  options?: { pollInterval?: number; enabled?: boolean }
): UseGenerationStatusReturn {
  const pollInterval = options?.pollInterval ?? POLLING_INTERVAL;
  const enabled = options?.enabled ?? true;
  
  const [generation, setGeneration] = useState<GenerationDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Récupère le statut
   */
  const fetchStatus = useCallback(async () => {
    if (!generationId || !enabled) {
      setIsLoading(false);
      return;
    }

    // Annuler la requête précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const response = await getGenerationStatus(
        { generationId },
        { signal: abortControllerRef.current.signal }
      );

      setGeneration(response.generation);
      setError(null);
      setIsLoading(false);

      // Arrêter le polling si terminé ou échoué
      if (response.isComplete || response.isFailed) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setIsLoading(false);
    }
  }, [generationId, enabled]);

  /**
   * Refetch manuel
   */
  const refetch = useCallback(async () => {
    setIsLoading(true);
    await fetchStatus();
  }, [fetchStatus]);

  // Effet pour le polling
  useEffect(() => {
    if (!generationId || !enabled) {
      setGeneration(null);
      setIsLoading(false);
      return;
    }

    // Premier fetch
    fetchStatus();

    // Démarrer le polling
    intervalRef.current = setInterval(fetchStatus, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [generationId, enabled, pollInterval, fetchStatus]);

  const isComplete = generation?.status === 'completed';
  const isFailed = generation?.status === 'failed';

  return {
    generation,
    isComplete,
    isFailed,
    isLoading,
    error,
    refetch,
  };
}
