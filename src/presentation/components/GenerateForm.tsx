'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { 
  Upload, 
  X, 
  Loader2, 
  Sparkles, 
  ImageIcon,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGenerate } from '@/src/presentation/hooks/useGenerate';
import { useCredits } from '@/src/presentation/hooks/useCredits';
import { GenerateFormProps } from '@/src/presentation/types';
import { ROOM_TYPES, STYLE_CATEGORIES } from '@/src/shared/constants/styles';
import { cn } from '@/lib/utils';

/**
 * Formulaire de génération de design
 * 
 * @example
 * ```tsx
 * <GenerateForm 
 *   onGenerateSuccess={(gen) => router.push(`/generations/${gen.id}`)}
 *   onGenerateError={(err) => toast.error(err)}
 * />
 * ```
 */
export function GenerateForm({
  onGenerateStart,
  onGenerateSuccess,
  onGenerateError,
  disabled = false,
  className,
}: GenerateFormProps) {
  const { generate, state, reset } = useGenerate();
  const { credits, state: creditsState } = useCredits();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [roomType, setRoomType] = useState<string>('salon');
  const [style, setStyle] = useState<string>('moderne');

  /**
   * Gère le drop d'image
   */
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setImageFile(file);
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    disabled: disabled || state.isLoading,
  });

  /**
   * Supprime l'image sélectionnée
   */
  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  /**
   * Lance la génération
   */
  const handleGenerate = async () => {
    if (!imageFile) return;

    onGenerateStart?.();

    const result = await generate({
      imageFile,
      roomType,
      style,
    });

    if (result) {
      onGenerateSuccess?.(result);
      // Reset le formulaire après succès
      removeImage();
      reset();
    } else if (state.error) {
      onGenerateError?.(state.error);
    }
  };

  const hasEnoughCredits = credits >= 1;
  const canGenerate = imageFile && hasEnoughCredits && !state.isLoading && !disabled;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Zone de dépôt d'image */}
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer",
          isDragActive 
            ? "border-purple-500 bg-purple-50" 
            : "border-gray-300 hover:border-purple-400 hover:bg-gray-50",
          (disabled || state.isLoading) && "opacity-50 cursor-not-allowed",
          imagePreview && "border-solid border-purple-200"
        )}
      >
        <input {...getInputProps()} />

        {imagePreview ? (
          <div className="relative">
            {/* Preview */}
            <div className="relative aspect-video w-full max-w-md mx-auto rounded-lg overflow-hidden">
              <Image
                src={imagePreview}
                alt="Aperçu de votre pièce"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 448px"
                unoptimized
              />
            </div>

            {/* Bouton supprimer */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeImage();
              }}
              className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>

            {/* Nom du fichier */}
            <p className="text-center text-sm text-gray-600 mt-4">
              {imageFile?.name}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
              {isDragActive ? (
                <ImageIcon className="h-8 w-8 text-purple-600" />
              ) : (
                <Upload className="h-8 w-8 text-purple-600" />
              )}
            </div>
            <p className="text-lg font-medium text-gray-700">
              {isDragActive ? 'Déposez votre image ici' : 'Glissez-déposez une image'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              ou cliquez pour sélectionner
            </p>
            <p className="text-xs text-gray-400 mt-3">
              JPG, PNG ou WebP • Max 10MB
            </p>
          </div>
        )}
      </div>

      {/* Sélecteurs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Type de pièce */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Type de pièce
          </label>
          <Select value={roomType} onValueChange={setRoomType}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir une pièce" />
            </SelectTrigger>
            <SelectContent>
              {ROOM_TYPES.map((room) => (
                <SelectItem key={room.slug} value={room.slug}>
                  <span className="flex items-center gap-2">
                    <span>{room.icon}</span>
                    <span>{room.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Style */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Style de décoration
          </label>
          <Select value={style} onValueChange={setStyle}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir un style" />
            </SelectTrigger>
            <SelectContent>
              {STYLE_CATEGORIES.map((s) => (
                <SelectItem key={s.slug} value={s.slug}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Avertissement crédits */}
      {!hasEnoughCredits && !creditsState.isLoading && (
        <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-orange-800">
              Crédits insuffisants
            </p>
            <p className="text-xs text-orange-600">
              Vous avez besoin d&apos;au moins 1 crédit pour générer un design.
            </p>
          </div>
        </div>
      )}

      {/* Progression */}
      {state.isLoading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{state.statusMessage}</span>
            <span className="text-purple-600 font-medium">{state.progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300"
              style={{ width: `${state.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Erreur */}
      {state.isError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">{state.error}</p>
        </div>
      )}

      {/* Bouton de génération */}
      <Button
        size="lg"
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        onClick={handleGenerate}
        disabled={!canGenerate}
      >
        {state.isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Génération en cours...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5 mr-2" />
            Générer le design
            <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
              1 crédit
            </span>
          </>
        )}
      </Button>

      {/* Info crédits */}
      <p className="text-center text-xs text-gray-500">
        Crédits disponibles: {creditsState.isLoading ? '...' : credits}
      </p>
    </div>
  );
}
