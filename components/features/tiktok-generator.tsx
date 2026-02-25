'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, Download, Play, Loader2, RotateCcw, 
  Sparkles, ImagePlus, X, Check, Film
} from 'lucide-react';
import {
  generateVideo,
  loadImage,
  DEFAULT_CONFIG,
  TRANSITIONS,
  type TransitionType,
  type VideoConfig,
} from '@/lib/utils/video-engine';
import Link from 'next/link';

// ============================================
// IMAGE DROPZONE COMPONENT
// ============================================

interface ImageDropzoneProps {
  label: string;
  image: string | null;
  onSelect: (file: File) => void;
  onClear: () => void;
  accent?: boolean;
}

function ImageDropzone({ label, image, onSelect, onClear, accent }: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) onSelect(file);
  }, [onSelect]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onSelect(file);
  }, [onSelect]);

  if (image) {
    return (
      <div className="relative group aspect-[9/16] rounded-2xl overflow-hidden border-2 border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={label} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <button
            onClick={onClear}
            className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded-full p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <Badge 
          className={`absolute top-3 left-3 ${accent ? 'bg-green-500' : 'bg-orange-500'} text-white border-none`}
        >
          {label}
        </Badge>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={`
        aspect-[9/16] rounded-2xl border-2 border-dashed transition-all cursor-pointer
        flex flex-col items-center justify-center gap-4 p-6
        ${isDragging 
          ? 'border-primary bg-primary/10 scale-[1.02]' 
          : 'border-border hover:border-primary/50 hover:bg-muted/50'
        }
      `}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => { if (e.key === 'Enter') inputRef.current?.click(); }}
    >
      <div className={`
        w-16 h-16 rounded-full flex items-center justify-center
        ${accent ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}
      `}>
        <ImagePlus className="w-8 h-8" />
      </div>
      <div className="text-center">
        <p className="text-lg font-bold">{label}</p>
        <p className="text-sm text-muted-foreground mt-1">
          Glissez ou cliquez
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

// ============================================
// TRANSITION SELECTOR
// ============================================

interface TransitionSelectorProps {
  selected: TransitionType;
  onChange: (t: TransitionType) => void;
}

function TransitionSelector({ selected, onChange }: TransitionSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {(Object.entries(TRANSITIONS) as [TransitionType, typeof TRANSITIONS[TransitionType]][]).map(
        ([key, { name, emoji, description }]) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`
              relative p-4 rounded-xl border-2 transition-all text-left
              ${selected === key 
                ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' 
                : 'border-border hover:border-primary/30 hover:bg-muted/50'
              }
            `}
          >
            {selected === key && (
              <div className="absolute top-2 right-2">
                <Check className="w-4 h-4 text-primary" />
              </div>
            )}
            <div className="text-2xl mb-2">{emoji}</div>
            <div className="font-bold text-sm">{name}</div>
            <div className="text-xs text-muted-foreground mt-1">{description}</div>
          </button>
        )
      )}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function TikTokGenerator() {
  // State
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);
  const [transition, setTransition] = useState<TransitionType>('swipe');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  // Preview management
  const handleBeforeSelect = useCallback((file: File) => {
    setBeforeFile(file);
    setBeforePreview(URL.createObjectURL(file));
    setVideoUrl(null);
    setError(null);
  }, []);

  const handleAfterSelect = useCallback((file: File) => {
    setAfterFile(file);
    setAfterPreview(URL.createObjectURL(file));
    setVideoUrl(null);
    setError(null);
  }, []);

  const handleBeforeClear = useCallback(() => {
    if (beforePreview) URL.revokeObjectURL(beforePreview);
    setBeforeFile(null);
    setBeforePreview(null);
    setVideoUrl(null);
  }, [beforePreview]);

  const handleAfterClear = useCallback(() => {
    if (afterPreview) URL.revokeObjectURL(afterPreview);
    setAfterFile(null);
    setAfterPreview(null);
    setVideoUrl(null);
  }, [afterPreview]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (beforePreview) URL.revokeObjectURL(beforePreview);
      if (afterPreview) URL.revokeObjectURL(afterPreview);
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Generate video
  const handleGenerate = useCallback(async () => {
    if (!beforeFile || !afterFile || !canvasRef.current) return;

    setIsGenerating(true);
    setProgress(0);
    setError(null);
    setVideoUrl(null);

    try {
      const [beforeImg, afterImg] = await Promise.all([
        loadImage(beforeFile),
        loadImage(afterFile),
      ]);

      const config: VideoConfig = {
        ...DEFAULT_CONFIG,
        transition,
      };

      cancelRef.current = generateVideo(
        canvasRef.current,
        beforeImg,
        afterImg,
        config,
        {
          onProgress: (p) => setProgress(p),
          onComplete: (blob) => {
            const url = URL.createObjectURL(blob);
            setVideoUrl(url);
            setIsGenerating(false);
            setProgress(1);
          },
          onError: (err) => {
            setError(err.message);
            setIsGenerating(false);
          },
        }
      );
    } catch (err) {
      setError('Erreur lors du chargement des images');
      setIsGenerating(false);
    }
  }, [beforeFile, afterFile, transition]);

  // Download
  const handleDownload = useCallback(() => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `instadeco-avant-apres-${transition}.webm`;
    a.click();
  }, [videoUrl, transition]);

  // Reset
  const handleReset = useCallback(() => {
    if (cancelRef.current) cancelRef.current();
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    setIsGenerating(false);
    setProgress(0);
    setError(null);
  }, [videoUrl]);

  const isReady = !!beforeFile && !!afterFile;

  return (
    <div className="space-y-10">
      {/* ── STEP 1: Upload ── */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            1
          </div>
          <div>
            <h2 className="text-xl font-bold">Uploadez vos photos</h2>
            <p className="text-sm text-muted-foreground">
              Ajoutez la photo avant et la photo après
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
          <ImageDropzone
            label="AVANT"
            image={beforePreview}
            onSelect={handleBeforeSelect}
            onClear={handleBeforeClear}
          />
          <ImageDropzone
            label="APRÈS"
            image={afterPreview}
            onSelect={handleAfterSelect}
            onClear={handleAfterClear}
            accent
          />
        </div>
      </section>

      {/* ── STEP 2: Transition ── */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center font-bold
            ${isReady ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
          `}>
            2
          </div>
          <div>
            <h2 className={`text-xl font-bold ${!isReady ? 'text-muted-foreground' : ''}`}>
              Choisissez la transition
            </h2>
            <p className="text-sm text-muted-foreground">
              6 effets viraux dignes d&apos;une agence
            </p>
          </div>
        </div>

        <div className={!isReady ? 'opacity-50 pointer-events-none' : ''}>
          <TransitionSelector selected={transition} onChange={setTransition} />
        </div>
      </section>

      {/* ── STEP 3: Generate ── */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center font-bold
            ${isReady ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
          `}>
            3
          </div>
          <div>
            <h2 className={`text-xl font-bold ${!isReady ? 'text-muted-foreground' : ''}`}>
              Générez votre vidéo
            </h2>
            <p className="text-sm text-muted-foreground">
              Format TikTok / Reels / Shorts (9:16)
            </p>
          </div>
        </div>

        {/* Canvas (hidden during rendering, shown as preview after) */}
        <canvas 
          ref={canvasRef} 
          className="hidden"
          width={DEFAULT_CONFIG.width}
          height={DEFAULT_CONFIG.height}
        />

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          {!videoUrl ? (
            <Button
              size="lg"
              className="h-14 px-10 text-lg rounded-full shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
              disabled={!isReady || isGenerating}
              onClick={handleGenerate}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                  Génération... {Math.round(progress * 100)}%
                </>
              ) : (
                <>
                  <Play className="mr-2 w-5 h-5" />
                  Générer la vidéo
                </>
              )}
            </Button>
          ) : (
            <>
              <Button
                size="lg"
                className="h-14 px-10 text-lg rounded-full shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                onClick={handleDownload}
              >
                <Download className="mr-2 w-5 h-5" />
                Télécharger
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 rounded-full"
                onClick={handleReset}
              >
                <RotateCcw className="mr-2 w-5 h-5" />
                Refaire
              </Button>
            </>
          )}
        </div>

        {/* Progress bar */}
        {isGenerating && (
          <div className="max-w-md mx-auto">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Création de votre vidéo virale en cours...
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <Card className="border-red-200 bg-red-50 max-w-md mx-auto">
            <CardContent className="pt-4 text-center text-red-600 text-sm">
              {error}
            </CardContent>
          </Card>
        )}

        {/* Video preview */}
        {videoUrl && (
          <div className="max-w-xs mx-auto space-y-4 animate-in slide-in-from-bottom duration-500">
            <Card className="overflow-hidden border-2 border-primary/20 shadow-xl">
              <video
                src={videoUrl}
                controls
                autoPlay
                loop
                playsInline
                className="w-full aspect-[9/16] bg-black"
              />
            </Card>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Film className="w-4 h-4" />
              <span>Prête à poster sur TikTok, Reels ou Shorts</span>
            </div>
          </div>
        )}
      </section>

      {/* ── CTA INSTADECO ── */}
      <section className="text-center py-8 border-t space-y-4">
        <p className="text-muted-foreground">
          Vous n&apos;avez pas encore la photo &quot;après&quot; ?
        </p>
        <Button size="lg" className="rounded-full h-12 px-8" asChild>
          <Link href="/generate">
            <Sparkles className="mr-2 w-5 h-5" />
            Créer votre décoration par IA
          </Link>
        </Button>
      </section>
    </div>
  );
}
