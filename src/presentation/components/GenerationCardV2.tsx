'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Loader2, 
  AlertCircle, 
  Clock, 
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { GenerationDTO } from '@/src/application/dtos/GenerationDTO';
import { GenerationCardProps } from '@/src/presentation/types';
import { cn } from '@/lib/utils';

/**
 * Carte affichant une génération avec actions
 * 
 * @example
 * ```tsx
 * <GenerationCardV2 
 *   generation={generation} 
 *   onDownload={handleDownload}
 * />
 * ```
 */
export function GenerationCardV2({
  generation,
  onDownload,
  showActions = true,
  className,
}: GenerationCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const { 
    id, 
    status, 
    inputImageUrl, 
    outputImageUrl, 
    styleSlug, 
    roomType,
    createdAt,
  } = generation;

  // Récupérer errorMessage depuis les props si présent (extension du type)
  const errorMessage = (generation as GenerationDTO & { errorMessage?: string }).errorMessage;

  /**
   * Télécharge l'image
   */
  const handleDownload = async () => {
    if (!outputImageUrl || !onDownload) return;
    
    setIsDownloading(true);
    try {
      await onDownload(generation);
    } finally {
      setIsDownloading(false);
    }
  };

  /**
   * Téléchargement direct de l'image
   */
  const downloadImage = async () => {
    if (!outputImageUrl) return;
    
    setIsDownloading(true);
    try {
      const response = await fetch(outputImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `instadeco-${id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur téléchargement:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  /**
   * Badge de statut
   */
  const StatusBadge = () => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            ✓ Terminé
          </span>
        );
      case 'failed':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            ✗ Échoué
          </span>
        );
      case 'processing':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            En cours
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            En attente
          </span>
        );
    }
  };

  /**
   * Contenu de l'image
   */
  const ImageContent = () => {
    if (outputImageUrl && !imageError) {
      return (
        <Image
          src={outputImageUrl}
          alt={`Génération ${styleSlug}`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={() => setImageError(true)}
        />
      );
    }

    if (status === 'failed') {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-red-500 bg-red-50">
          <AlertCircle className="h-12 w-12 mb-2" />
          <p className="text-sm font-medium">Échec de génération</p>
          {errorMessage && (
            <p className="text-xs text-gray-500 mt-1 px-4 text-center max-w-[200px]">
              {errorMessage}
            </p>
          )}
        </div>
      );
    }

    if (status === 'processing' || status === 'pending') {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
            <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <p className="text-sm text-gray-600 mt-3 font-medium">
            {status === 'pending' ? 'En attente...' : 'Génération en cours...'}
          </p>
        </div>
      );
    }

    // Fallback: image d'entrée
    if (inputImageUrl) {
      return (
        <Image
          src={inputImageUrl}
          alt="Image originale"
          fill
          className="object-cover opacity-50"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      );
    }

    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-400 text-sm">Aucune image</p>
      </div>
    );
  };

  const formattedDate = new Date(createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card className={cn(
      "overflow-hidden hover:shadow-xl transition-all duration-300 group",
      className
    )}>
      {/* Image */}
      <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200">
        <ImageContent />
        
        {/* Overlay avec actions au hover */}
        {status === 'completed' && outputImageUrl && showActions && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={onDownload ? handleDownload : downloadImage}
              disabled={isDownloading}
              className="h-10"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="ml-2">Télécharger</span>
            </Button>
          </div>
        )}
      </div>

      {/* Infos */}
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <StatusBadge />
          <span className="text-xs text-gray-500">{formattedDate}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="capitalize">{styleSlug}</span>
          <span className="text-gray-300">•</span>
          <span className="capitalize">{roomType}</span>
        </div>

        {/* Actions en dessous */}
        {status === 'completed' && outputImageUrl && showActions && (
          <div className="flex gap-2 mt-3 pt-3 border-t">
            <Button
              size="sm"
              variant="outline"
              onClick={onDownload ? handleDownload : downloadImage}
              disabled={isDownloading}
              className="flex-1 h-8 text-xs"
            >
              {isDownloading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3 mr-1" />
              )}
              Télécharger
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
