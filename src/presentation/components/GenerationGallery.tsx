'use client';

import { useCallback, useRef, useEffect } from 'react';
import { Loader2, ImageIcon } from 'lucide-react';
import { GenerationDTO } from '@/src/application/dtos/GenerationDTO';
import { GenerationGalleryProps } from '@/src/presentation/types';
import { GenerationCardV2 } from './GenerationCardV2';
import { cn } from '@/lib/utils';

/**
 * Galerie de générations avec infinite scroll optionnel
 * 
 * @example
 * ```tsx
 * const { generations, state, fetchMore } = useGenerations();
 * 
 * <GenerationGallery 
 *   generations={generations}
 *   isLoading={state.isLoading}
 *   hasMore={state.hasMore}
 *   onLoadMore={fetchMore}
 * />
 * ```
 */
export function GenerationGallery({
  generations,
  isLoading = false,
  onLoadMore,
  hasMore = false,
  emptyMessage = 'Aucune génération pour le moment',
  className,
  onDownload,
  onUnlockHD,
}: GenerationGalleryProps & {
  onDownload?: (generation: GenerationDTO) => void;
  onUnlockHD?: (generation: GenerationDTO) => void;
}) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Intersection Observer pour infinite scroll
  useEffect(() => {
    if (!onLoadMore || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [onLoadMore, hasMore, isLoading]);

  // État de chargement initial
  if (isLoading && generations.length === 0) {
    return (
      <div className={cn("py-12", className)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // État vide
  if (generations.length === 0) {
    return (
      <div className={cn(
        "py-16 flex flex-col items-center justify-center text-center",
        className
      )}>
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <ImageIcon className="h-10 w-10 text-gray-400" />
        </div>
        <p className="text-gray-500 text-lg font-medium">{emptyMessage}</p>
        <p className="text-gray-400 text-sm mt-1">
          Commencez par générer votre premier design !
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Grille */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {generations.map((generation) => (
          <GenerationCardV2
            key={generation.id}
            generation={generation}
            onDownload={onDownload}
            onUnlockHD={onUnlockHD}
          />
        ))}
      </div>

      {/* Loader pour infinite scroll */}
      {hasMore && (
        <div
          ref={loadMoreRef}
          className="flex justify-center py-8"
        >
          {isLoading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Chargement...</span>
            </div>
          ) : (
            <button
              onClick={onLoadMore}
              className="px-6 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
            >
              Charger plus
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Skeleton pour le chargement
 */
function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-lg border bg-white animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-6 w-20 bg-gray-200 rounded-full" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>
        <div className="h-4 w-32 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
