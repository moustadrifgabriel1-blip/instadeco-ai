'use client';

import { useEffect, useState } from 'react';
import { GenerationDTO } from '@/src/application/dtos/GenerationDTO';
import { useGenerationStatus } from '@/src/presentation/hooks/useGenerationStatus';
import { GenerationCard } from './generation-card';

interface SmartGenerationCardProps {
  generation: GenerationDTO;
  onStatusChange?: (updatedGeneration: GenerationDTO) => void;
  children?: React.ReactNode;
}

export function SmartGenerationCard({ generation, onStatusChange, children }: SmartGenerationCardProps) {
  // On ne poll que si le statut est en attente
  const shouldPoll = generation.status === 'pending' || generation.status === 'processing';
  
  const { 
    generation: updatedGeneration, 
    isComplete, 
    isFailed 
  } = useGenerationStatus(generation.id, { 
    enabled: shouldPoll,
    pollInterval: 5000 // Vérifier toutes les 5s pour ne pas spammer si y'en a beaucoup
  });

  // Utiliser la génération mise à jour ou celle initiale
  const currentGeneration = updatedGeneration || generation;

  // Notifier le parent si le statut change (optionnel, pour mettre à jour la liste globale)
  useEffect(() => {
    if (updatedGeneration && updatedGeneration.status !== generation.status) {
      if (onStatusChange) {
        onStatusChange(updatedGeneration);
      }
    }
  }, [updatedGeneration, generation.status, onStatusChange]);

  return (
    <GenerationCard
      id={currentGeneration.id}
      styleSlug={currentGeneration.styleSlug}
      roomTypeSlug={currentGeneration.roomType}
      inputImageUrl={currentGeneration.inputImageUrl}
      outputImageUrl={currentGeneration.outputImageUrl || undefined}
      status={currentGeneration.status as 'pending' | 'processing' | 'completed' | 'failed'}
      createdAt={currentGeneration.createdAt}
    >
      {children}
    </GenerationCard>
  );
}
