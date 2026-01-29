'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Loader2, AlertCircle, Clock } from 'lucide-react';
import Image from 'next/image';

interface GenerationCardProps {
  id: string;
  styleSlug: string;
  roomTypeSlug: string;
  inputImageUrl: string;
  outputImageUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  errorMessage?: string;
  children?: React.ReactNode;
}

export function GenerationCard({
  id,
  styleSlug,
  roomTypeSlug,
  inputImageUrl,
  outputImageUrl,
  status,
  createdAt,
  errorMessage,
  children
}: GenerationCardProps) {
  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `instadeco-${id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      alert('Erreur lors du téléchargement');
    }
  };

  const getStatusBadge = () => {
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

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
      <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200">
        {outputImageUrl ? (
          <Image
            src={outputImageUrl}
            alt={`Génération ${styleSlug}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
          />
        ) : status === 'failed' ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-red-500">
            <AlertCircle className="h-12 w-12 mb-2" />
            <p className="text-sm font-medium">Échec de génération</p>
            {errorMessage && (
              <p className="text-xs text-gray-500 mt-1 px-4 text-center">{errorMessage}</p>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-2" />
            <p className="text-sm font-medium text-gray-700">Génération en cours...</p>
          </div>
        )}
        
        <div className="absolute top-3 right-3">
          {getStatusBadge()}
        </div>

        {/* Overlay avec actions au hover */}
        {outputImageUrl && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-2">
              <Button
                onClick={() => handleDownload(outputImageUrl)}
                size="sm"
                className="bg-white text-gray-900 hover:bg-gray-100"
              >
                <Download className="h-4 w-4 mr-1" />
                Télécharger
              </Button>
              <Button
                onClick={() => window.open(outputImageUrl, '_blank')}
                size="sm"
                variant="outline"
                className="bg-white/90 hover:bg-white"
              >
                Voir en grand
              </Button>
            </div>
          </div>
        )}
      </div>

      <CardContent className="p-3 sm:p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-base sm:text-lg text-gray-900 capitalize">
              {styleSlug.replace(/-/g, ' ')}
            </h3>
            <p className="text-sm text-gray-600 capitalize">
              {roomTypeSlug.replace(/-/g, ' ')}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t">
          <span className="truncate">{new Date(createdAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          })}</span>
          <span className="text-gray-400 hidden sm:inline">ID: {id.slice(0, 8)}</span>
        </div>
        {children && <div className="mt-3 pt-3 border-t">{children}</div>}
      </CardContent>
    </Card>
  );
}
