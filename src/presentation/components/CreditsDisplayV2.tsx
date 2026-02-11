'use client';

import { Coins, Loader2 } from 'lucide-react';
import { CreditsDisplayProps } from '@/src/presentation/types';
import { cn } from '@/lib/utils';

/**
 * Composant d'affichage des crédits
 * 
 * @example
 * ```tsx
 * const { credits, state } = useCredits();
 * <CreditsDisplayV2 credits={credits} isLoading={state.isLoading} />
 * ```
 */
export function CreditsDisplayV2({
  credits,
  isLoading = false,
  showIcon = true,
  size = 'md',
  className,
}: CreditsDisplayProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  // État de chargement
  if (isLoading) {
    return (
      <div className={cn(
        "flex items-center bg-[#fbfbfd] border border-[#d2d2d7] rounded-full",
        sizeClasses[size],
        className
      )}>
        <Loader2 className={cn("animate-spin text-gray-400", iconSizes[size])} />
        <span className="text-[#636366]">Chargement...</span>
      </div>
    );
  }

  const isLow = credits <= 2;
  const isEmpty = credits === 0;

  return (
    <div className={cn(
      "flex items-center bg-[#fbfbfd] border rounded-full transition-all hover:border-[#1d1d1f]",
      isEmpty ? "border-red-300 bg-red-50" : isLow ? "border-orange-300" : "border-[#d2d2d7]",
      sizeClasses[size],
      className
    )}>
      {/* Indicateur de statut */}
      <div className={cn(
        "rounded-full",
        dotSizes[size],
        isEmpty ? "bg-red-500" : isLow ? "bg-orange-500" : "bg-green-500"
      )} />

      {/* Icône optionnelle */}
      {showIcon && (
        <Coins className={cn(
          isEmpty ? "text-red-500" : isLow ? "text-orange-500" : "text-purple-600",
          iconSizes[size]
        )} />
      )}

      {/* Texte */}
      <span className={cn(
        "font-medium",
        isEmpty ? "text-red-600" : "text-[#1d1d1f]"
      )}>
        {credits} {credits > 1 ? 'crédits' : 'crédit'}
      </span>
    </div>
  );
}

/**
 * Version compacte pour le header
 */
export function CreditsDisplayCompact({
  credits,
  isLoading = false,
  className,
}: {
  credits: number;
  isLoading?: boolean;
  className?: string;
}) {
  if (isLoading) {
    return (
      <div className={cn(
        "flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full",
        className
      )}>
        <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
      </div>
    );
  }

  const isEmpty = credits === 0;
  const isLow = credits <= 2;

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium text-sm",
      isEmpty 
        ? "bg-red-100 text-red-600" 
        : isLow 
          ? "bg-orange-100 text-orange-600"
          : "bg-purple-100 text-purple-600",
      className
    )}>
      <Coins className="h-3.5 w-3.5" />
      <span>{credits}</span>
    </div>
  );
}
