'use client';

import Image, { type ImageProps } from 'next/image';
import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

/**
 * OptimizedImage — Composant image réutilisable, responsive, SEO-friendly.
 *
 * Résout les problèmes courants :
 * - Gestion d'erreur avec fallback visuel (onError)
 * - Skeleton/shimmer pendant le chargement
 * - `sizes` automatique quand `fill` est utilisé
 * - Suppression automatique de `loading="lazy"` redondant (Next.js le gère)
 * - Alt text obligatoire (SEO)
 *
 * Usage :
 *   <OptimizedImage src={url} alt="description" fill sizes="100vw" />
 *   <OptimizedImage src={url} alt="description" width={600} height={400} responsive />
 */

// ── Fallback par défaut quand l'image ne charge pas ──
function ImageFallback({
  alt,
  className,
}: {
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400',
        className
      )}
      role="img"
      aria-label={alt}
    >
      <div className="flex flex-col items-center gap-2 p-4 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-300"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
        <span className="text-xs text-gray-400 max-w-[120px] line-clamp-2">
          {alt || 'Image indisponible'}
        </span>
      </div>
    </div>
  );
}

// ── Shimmer skeleton pendant le chargement ──
function ImageSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]',
        className
      )}
      style={{
        animation: 'shimmer 1.5s ease-in-out infinite',
      }}
    />
  );
}

// ── Tailles responsive par défaut selon le contexte ──
const DEFAULT_SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
const HERO_SIZES = '100vw';
const CARD_SIZES = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
const GALLERY_SIZES = '(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw';

export const IMAGE_SIZES = {
  default: DEFAULT_SIZES,
  hero: HERO_SIZES,
  card: CARD_SIZES,
  gallery: GALLERY_SIZES,
  /** Pleine largeur */
  full: '100vw',
  /** Demi-largeur */
  half: '(max-width: 768px) 100vw, 50vw',
  /** Thumbnail */
  thumb: '(max-width: 640px) 50vw, 200px',
} as const;

export type ImageSizePreset = keyof typeof IMAGE_SIZES;

interface OptimizedImageProps extends Omit<ImageProps, 'onError' | 'onLoad'> {
  /** 
   * Preset de taille responsive (`hero`, `card`, `gallery`, etc.)
   * Utilisé uniquement si `sizes` n'est pas défini explicitement.
   */
  sizePreset?: ImageSizePreset;
  /** Afficher le skeleton pendant le chargement */
  showSkeleton?: boolean;
  /** Classe CSS pour le fallback d'erreur */
  fallbackClassName?: string;
  /** Composant de fallback custom */
  fallbackComponent?: React.ReactNode;
  /** Rendre l'image responsive (w-full h-auto) quand width/height sont définis */
  responsive?: boolean;
  /** Callback optionnel en cas d'erreur */
  onImageError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  fill,
  sizes,
  sizePreset = 'default',
  className,
  showSkeleton = true,
  fallbackClassName,
  fallbackComponent,
  responsive = false,
  priority,
  onImageError,
  // On retire loading car Next.js le gère automatiquement
  // eslint-disable-next-line no-unused-vars
  loading: _loading,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onImageError?.();
  }, [onImageError]);

  // ── Validation : alt obligatoire pour le SEO ──
  const safeAlt = alt || 'Image';

  // ── Résolution automatique de sizes ──
  // Si fill est utilisé sans sizes, on applique le preset
  const resolvedSizes = sizes || (fill ? IMAGE_SIZES[sizePreset] : undefined);

  // ── Classes responsive pour les images avec width/height ──
  const responsiveClasses = responsive && !fill ? 'w-full h-auto' : '';

  // ── État d'erreur → Affichage du fallback ──
  if (hasError) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }

    return (
      <ImageFallback
        alt={safeAlt}
        className={cn(
          fill ? 'absolute inset-0 w-full h-full' : '',
          fallbackClassName || className
        )}
      />
    );
  }

  return (
    <>
      {/* Skeleton pendant le chargement */}
      {showSkeleton && isLoading && !priority && (
        <ImageSkeleton
          className={cn(
            fill ? 'absolute inset-0 w-full h-full' : '',
            className
          )}
        />
      )}

      <Image
        src={src}
        alt={safeAlt}
        fill={fill}
        sizes={resolvedSizes}
        priority={priority}
        className={cn(
          responsiveClasses,
          // Transition de fade-in élégante
          isLoading && !priority ? 'opacity-0' : 'opacity-100',
          'transition-opacity duration-300',
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </>
  );
}

/**
 * OptimizedRemoteImage — Variante pour les images distantes (Supabase, fal.ai)
 * Inclut systématiquement le skeleton + gestion d'erreur.
 */
export function OptimizedRemoteImage(
  props: OptimizedImageProps
) {
  return (
    <OptimizedImage
      showSkeleton
      {...props}
    />
  );
}

export default OptimizedImage;
