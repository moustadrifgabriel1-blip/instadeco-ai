'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { 
  generateDesign, 
  GenerateDesignResponse 
} from '@/src/presentation/api/client';
import { GenerationDTO } from '@/src/application/dtos/GenerationDTO';
import { 
  UseGenerateState, 
  UseGenerateReturn, 
  GenerateDesignInput 
} from '@/src/presentation/types';

/**
 * Hook pour générer un design
 * 
 * @example
 * ```tsx
 * const { generate, state, reset } = useGenerate();
 * 
 * const handleGenerate = async () => {
 *   const result = await generate({
 *     imageFile: file,
 *     roomType: 'salon',
 *     style: 'moderne',
 *   });
 * };
 * ```
 */
export function useGenerate(): UseGenerateReturn {
  const { user } = useAuth();
  
  const [state, setState] = useState<UseGenerateState>({
    data: null,
    error: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
    progress: 0,
    statusMessage: '',
  });

  /**
   * Convertit un File en base64
   */
  const fileToBase64 = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  /**
   * Génère un design
   */
  const generate = useCallback(
    async (input: GenerateDesignInput): Promise<GenerationDTO | null> => {
      if (!user) {
        setState((prev) => ({
          ...prev,
          error: 'Vous devez être connecté',
          isError: true,
        }));
        return null;
      }

      setState({
        data: null,
        error: null,
        isLoading: true,
        isSuccess: false,
        isError: false,
        progress: 10,
        statusMessage: 'Préparation de l\'image...',
      });

      try {
        // Convertir le fichier en base64 si nécessaire
        let imageUrl: string;
        if (input.imageFile instanceof File) {
          setState((prev) => ({ ...prev, progress: 20, statusMessage: 'Upload de l\'image...' }));
          imageUrl = await fileToBase64(input.imageFile);
        } else {
          imageUrl = input.imageFile;
        }

        setState((prev) => ({ ...prev, progress: 40, statusMessage: 'Lancement de la génération...' }));

        // Appeler l'API
        const response = await generateDesign({
          userId: user.id,
          imageUrl,
          roomType: input.roomType,
          style: input.style,
          transformMode: input.transformMode,
        });

        setState({
          data: response.generation,
          error: null,
          isLoading: false,
          isSuccess: true,
          isError: false,
          progress: 5, // Démarrage du polling pour le statut async
          statusMessage: 'Génération en cours...',
        });

        return response.generation;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        
        setState({
          data: null,
          error: errorMessage,
          isLoading: false,
          isSuccess: false,
          isError: true,
          progress: 0,
          statusMessage: '',
        });

        return null;
      }
    },
    [user, fileToBase64]
  );

  /**
   * Réinitialise l'état
   */
  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false,
      isSuccess: false,
      isError: false,
      progress: 0,
      statusMessage: '',
    });
  }, []);

  return {
    generate,
    state,
    reset,
  };
}
