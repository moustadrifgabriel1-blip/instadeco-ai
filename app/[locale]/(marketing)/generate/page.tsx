'use client';

import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';
import {
  Plus,
  X,
  ArrowRight,
  Download,
  Check,
  ChevronDown,
  Sparkles,
  Star,
  Shield,
  Zap,
  UserPlus,
  Eye,
  Users,
  Info,
  LayoutGrid,
  Armchair,
  Frame,
  Palette,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useGenerate } from '@/src/presentation/hooks/useGenerate';
import { useGenerationStatus } from '@/src/presentation/hooks/useGenerationStatus';
import { RatingStars } from '@/components/features/RatingStars';
import { STYLE_CATEGORIES_WITH_STYLES, ROOM_TYPES } from '@/src/shared/constants';
import { fbTrackUploadPhoto, fbTrackStartGeneration } from '@/lib/analytics/fb-pixel';
import { trackCTAClick } from '@/lib/analytics/gtag';

const LOADING_MESSAGES = [
  { threshold: 0, text: 'Analyse de l’espace et de la lumière…' },
  { threshold: 18, text: 'Préservation de la structure architecturale…' },
  { threshold: 35, text: 'Application de votre direction artistique…' },
  { threshold: 52, text: 'Affinage des matières et des textures…' },
  { threshold: 72, text: 'Équilibrage des couleurs et des contrastes…' },
  { threshold: 88, text: 'Dernières retouches, rendu magazine…' },
  { threshold: 96, text: 'Finalisation de votre planche…' },
];

const TRANSFORM_MODES: Array<{
  id: string;
  name: string;
  desc: string;
  Icon: LucideIcon;
  highlight?: boolean;
}> = [
  {
    id: 'home_staging',
    name: 'Home staging, structure verrouillée',
    desc: 'Fenêtres, portes, plinthes, prises, sol, radiateurs : rien ne bouge. Seuls meubles, déco, couleurs et textiles changent.',
    Icon: Lock,
    highlight: true,
  },
  {
    id: 'full_redesign',
    name: 'Transformation complète',
    desc: 'Nouvelle ambiance, mêmes volumes, tout le reste repensé',
    Icon: Armchair,
  },
  {
    id: 'keep_layout',
    name: 'Garder la disposition',
    desc: 'Même plan, nouveaux meubles, comme un architecte d’intérieur',
    Icon: LayoutGrid,
  },
  {
    id: 'decor_only',
    name: 'Déco uniquement',
    desc: 'Meubles inchangés. Couleurs, textiles et accessoires raffinés',
    Icon: Frame,
  },
];

export default function GeneratePageV2() {
  return <GenerateContent />;
}

function GenerateContent() {
  const { user, credits, loading } = useAuth();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('moderne');
  const [selectedRoomType, setSelectedRoomType] = useState('salon');
  const [selectedMode, setSelectedMode] = useState('home_staging');
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showPromptDetails, setShowPromptDetails] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // Hooks de la couche Presentation
  const { generate, state: generateState, reset: resetGenerate } = useGenerate();
  
  // Polling du statut de génération
  // Skip le polling si le résultat synchrone a déjà l'image
  const skipPolling = !!(generateState.data?.status === 'completed' && generateState.data?.outputImageUrl);
  const { 
    generation: statusGeneration, 
    isComplete, 
    isFailed 
  } = useGenerationStatus(generationId, { enabled: !skipPolling });

  // États dérivés
  // L'image est disponible dès la réponse synchrone OU via le polling
  const generatedImage = generateState.data?.outputImageUrl || statusGeneration?.outputImageUrl || null;
  const generatedPrompt = generateState.data?.prompt || statusGeneration?.prompt || null;
  const isGenerating = generateState.isLoading || (generationId && !isComplete && !isFailed && !generatedImage && !skipPolling);
  const [progress, setProgress] = useState(0);
  
  // Effet pour animer la progression
  useEffect(() => {
    if (generateState.isLoading) {
      // Phase initiale (upload, préparation, génération synchrone)
      setProgress(generateState.progress);
    } else if (generatedImage) {
      // Image disponible → 100%
      setProgress(100);
    } else if (generationId && !isComplete && !isFailed) {
      // Fallback: polling si résultat pas encore disponible
      setProgress(prev => Math.max(prev, generateState.progress));
      
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) return prev;
          const remaining = 95 - prev;
          const increment = Math.max(0.1, remaining / 100);
          return prev + increment;
        });
      }, 200);
      
      return () => clearInterval(interval);
    } else if (isFailed) {
      setProgress(0);
    }
  }, [generateState.isLoading, generateState.progress, generationId, isComplete, isFailed, generatedImage]);

  const error = generateState.error || (isFailed ? 'La génération a échoué' : null);

  const loadingPrimaryText = useMemo(() => {
    if (
      isGenerating &&
      generateState.statusMessage &&
      progress < 50
    ) {
      return generateState.statusMessage;
    }
    return (
      LOADING_MESSAGES.filter((m) => m.threshold <= Math.round(progress)).pop()
        ?.text ?? 'Préparation…'
    );
  }, [
    isGenerating,
    generateState.statusMessage,
    progress,
  ]);

  // Auto-scroll vers le résultat quand l'image est générée
  useEffect(() => {
    if (generatedImage && resultRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [generatedImage]);

  // Quand la génération démarre, stocker l'ID pour le polling (confirmation)
  // Skip le polling si le résultat synchrone est déjà complet avec outputImageUrl
  useEffect(() => {
    if (generateState.data?.id) {
      setGenerationId(generateState.data.id);
    }
  }, [generateState.data?.id]);

  // Upload d'image avec drag & drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Révoquer l'ancien blob URL si existant
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      resetGenerate();
      setGenerationId(null);
      setShowAuthPrompt(false);
      // Track l'upload (engagement fort pour le Pixel FB)
      fbTrackUploadPhoto();
      trackCTAClick('upload_photo', '/generate');
    }
  }, [resetGenerate, imagePreview]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxFiles: 1,
    maxSize: 4 * 1024 * 1024, // 4 Mo max (la limite Vercel body est ~4.5 Mo en base64)
  });

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    resetGenerate();
    setGenerationId(null);
  };

  const handleGenerate = async () => {
    if (!imageFile) return;
    
    // Si l'utilisateur n'est pas connecté, afficher le prompt d'inscription
    if (!user) {
      setShowAuthPrompt(true);
      // Sauvegarder les choix dans sessionStorage pour après le login
      sessionStorage.setItem('instadeco_pending_generate', JSON.stringify({
        style: selectedStyle,
        roomType: selectedRoomType,
        mode: selectedMode,
      }));
      return;
    }
    
    setShowAuthPrompt(false);
    
    // Track la génération pour FB Pixel
    fbTrackStartGeneration(selectedStyle, selectedRoomType);
    
    // Utiliser le hook generate
    await generate({
      imageFile,
      roomType: selectedRoomType,
      style: selectedStyle,
      transformMode: selectedMode,
    });
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    
    // Téléchargement via API serveur
    if (generationId) {
      try {
        const downloadUrl = `/api/v2/download?id=${generationId}`;
        const response = await fetch(downloadUrl);
        
        if (!response.ok) {
          throw new Error('Erreur de téléchargement');
        }
        
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `instadeco-${generationId}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        return;
      } catch (err) {
        console.error('Erreur téléchargement via API:', err);
      }
    }
    
    // Fallback: téléchargement direct
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'instadeco-resultat.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Erreur lors du téléchargement:', err);
      alert('Erreur lors du téléchargement. Veuillez réessayer.');
    }
  };

  // Trouver le style sélectionné
  const selectedStyleInfo = STYLE_CATEGORIES_WITH_STYLES
    .flatMap(cat => cat.styles)
    .find(s => s.id === selectedStyle);

  return (
    <div className="min-h-screen bg-background">
      {/* Bandeau : ton studio */}
      <div className="bg-[var(--stone-900)] text-foreground py-2.5 px-4 text-center border-b border-[var(--gold-line)]">
        <p className="prestige-eyebrow text-[11px] sm:text-[12px] mb-1 text-[var(--gold)]">
          Studio virtuel InstaDeco
        </p>
        <p className="text-[12px] sm:text-[13px] font-normal flex items-center justify-center gap-2 flex-wrap text-foreground">
          <Users className="w-3.5 h-3.5 text-[var(--gold)]" />
          <span><strong>10 000+</strong> planches créées</span>
          <span className="hidden sm:inline text-muted-foreground">·</span>
          <span className="hidden sm:inline">Rendu soigné en une trentaine de secondes</span>
          <span className="text-muted-foreground">·</span>
          <span className="flex items-center gap-0.5" aria-hidden>
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-3 h-3 fill-[var(--gold)] text-[var(--gold)]" />
            ))}
          </span>
        </p>
      </div>

      {/* Hero */}
      <section className="pt-8 pb-8 px-4 sm:pt-12 sm:pb-12 sm:px-6">
        <div className="max-w-[720px] mx-auto text-center">
          {!user && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[rgba(200,162,77,0.12)] border border-[var(--gold-line)] text-[var(--gold)] rounded-full text-[12px] font-medium mb-5 tracking-wide">
              <Sparkles className="w-4 h-4" />
              Bienvenue. 3 crédits offerts à l&apos;inscription
            </div>
          )}
          <p className="prestige-eyebrow text-[11px] sm:text-[12px] mb-3 text-[var(--gold)]">
            Rendu d&apos;intérieur · niveau agence
          </p>
          <h1 className="prestige-display text-[30px] sm:text-[42px] md:text-[50px] lg:text-[54px] font-semibold tracking-[-0.03em] text-foreground leading-[1.06]">
            Une planche déco digne d&apos;un cabinet <span className="text-[var(--gold)]">premium</span>.
          </h1>
          <p className="prestige-reveal prestige-body mt-4 text-[16px] sm:text-[18px] md:text-[19px] text-muted-foreground font-normal leading-[1.45] tracking-[0.01em] max-w-xl mx-auto" style={{ ['--reveal-d' as string]: '120ms' }}>
            Importez une photo, choisissez une direction artistique : notre moteur compose un rendu photoréaliste, prêt à être partagé ou présenté.
          </p>
          {/* Mini galerie avant/après */}
          <div className="prestige-reveal mt-6 flex items-center justify-center gap-3 flex-wrap text-[12px] text-muted-foreground" style={{ ['--reveal-d' as string]: '240ms' }}>
            <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-[var(--gold)]" /> 20+ styles de déco</span>
            <span className="text-[var(--gold-line)]">•</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-[var(--gold)]" /> Résultat en 30s</span>
            <span className="text-[var(--gold-line)]">•</span>
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-[var(--gold)]" /> 100% privé</span>
          </div>
        </div>
      </section>

      {/* Main App */}
      <section className="pb-12 px-4 sm:pb-20 sm:px-6">
        <div className="max-w-[980px] mx-auto">
          
          {/* Upload Zone */}
          {!imagePreview && (
            <div
              {...getRootProps()}
              className={`
                prestige-reveal relative rounded-[28px] border-2 border-dashed transition-all duration-300 cursor-pointer
                ${isDragActive
                  ? 'border-[var(--gold)] bg-[rgba(200,162,77,0.08)]'
                  : 'border-[var(--gold-line)] hover:border-[var(--gold)] bg-card'
                }
              `}
            >
              <input {...getInputProps()} />
              <div className="py-14 px-4 sm:py-20 sm:px-8 text-center">
                <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-[rgba(200,162,77,0.12)] border border-[var(--gold-line)] flex items-center justify-center">
                  <Plus className="w-6 h-6 text-[var(--gold)]" strokeWidth={1.5} />
                </div>
                <p className="prestige-display text-[15px] sm:text-[17px] text-foreground font-medium tracking-[-0.01em]">
                  {isDragActive ? 'Déposez votre image' : 'Ajouter une photo de votre pièce'}
                </p>
                <p className="mt-2 text-[12px] text-muted-foreground tracking-[.007em]">
                  Glissez-déposez ou cliquez · PNG, JPG, WEBP · max 4&nbsp;Mo
                </p>
                <div className="mt-6 flex items-center justify-center gap-3 sm:gap-6 flex-wrap text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-[var(--gold)]" /> Rendu en ~30&nbsp;s</span>
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-[var(--gold)]" /> 100% privé</span>
                  <span className="flex items-center gap-1"><Star className="w-3 h-3 text-[var(--gold)]" /> 12 styles</span>
                </div>
              </div>
            </div>
          )}

          {/* Image Preview + Options */}
          {imagePreview && !generatedImage && (
            <div className="space-y-10">
              {/* Image Preview */}
              <div className="relative rounded-[28px] overflow-hidden bg-[var(--stone-900)] border border-[var(--gold-line)] shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                <Image
                  src={imagePreview}
                  alt="Votre pièce, aperçu avant transformation"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                  sizes="(max-width: 768px) 100vw, 672px"
                  unoptimized
                />
                <button
                  onClick={removeImage}
                  className="absolute top-4 right-4 w-9 h-9 bg-[var(--ink)]/80 backdrop-blur-md border border-[var(--gold-line)] rounded-full flex items-center justify-center hover:bg-[var(--ink)] transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                >
                  <X className="w-4 h-4 text-[var(--gold)]" strokeWidth={2} />
                </button>
              </div>

              {/* Options */}
              <div className="space-y-8">
                {/* Transform Mode */}
                <div className="text-center prestige-reveal">
                  <label className="block prestige-eyebrow text-[12px] text-[var(--gold)] mb-4">
                    Ambition du projet
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {TRANSFORM_MODES.map((mode, modeIndex) => {
                      const ModeIcon = mode.Icon;
                      const isSelected = selectedMode === mode.id;
                      return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setSelectedMode(mode.id)}
                        style={{ ['--reveal-d' as string]: `${modeIndex * 90}ms` }}
                        className={`
                          prestige-reveal relative px-4 py-3.5 rounded-2xl text-left transition-all duration-300 w-full
                          ${isSelected
                            ? 'bg-[var(--gold)] text-[#0c0a09] ring-2 ring-[var(--gold)] ring-offset-2 ring-offset-[var(--ink)] shadow-lg shadow-[rgba(200,162,77,0.2)]'
                            : mode.highlight
                              ? 'bg-card text-foreground hover:bg-[rgba(200,162,77,0.06)] border border-[var(--gold-line)] shadow-sm'
                              : 'bg-card text-foreground hover:bg-[rgba(200,162,77,0.06)] border border-border'
                          }
                        `}
                      >
                        {mode.highlight && !isSelected && (
                          <span className="absolute -top-2 left-3 bg-[var(--gold)] text-[#0c0a09] text-[9px] uppercase tracking-[0.14em] font-semibold px-2 py-0.5 rounded-full">
                            Recommandé
                          </span>
                        )}
                        <div className="flex items-start gap-3">
                          <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isSelected ? 'bg-[#0c0a09]/10' : 'bg-[rgba(200,162,77,0.12)] border border-[var(--gold-line)]'}`}>
                            <ModeIcon className={`h-4 w-4 ${isSelected ? 'text-[#0c0a09]' : 'text-[var(--gold)]'}`} strokeWidth={1.75} />
                          </span>
                          <span>
                            <span className="block text-[14px] font-semibold leading-snug">{mode.name}</span>
                            <span className={`block text-[11px] mt-1 leading-relaxed ${isSelected ? 'text-[#0c0a09]/75' : 'text-muted-foreground'}`}>
                              {mode.desc}
                            </span>
                          </span>
                        </div>
                      </button>
                    );})}
                  </div>
                </div>

                {/* Room Type */}
                <div className="text-center prestige-reveal">
                  <label className="block prestige-eyebrow text-[12px] text-[var(--gold)] mb-4">
                    Type de pièce
                  </label>
                  <div className="flex flex-wrap justify-center gap-2">
                    {ROOM_TYPES.map((room) => (
                      <button
                        key={room.id}
                        onClick={() => setSelectedRoomType(room.id)}
                        className={`
                          px-5 py-2.5 rounded-full text-[14px] font-medium transition-all duration-300
                          ${selectedRoomType === room.id
                            ? 'bg-[var(--gold)] text-[#0c0a09]'
                            : 'bg-card text-foreground border border-border hover:border-[var(--gold-line)] hover:bg-[rgba(200,162,77,0.06)]'
                          }
                        `}
                      >
                        {room.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Style - Organisé par catégories */}
                <div className="prestige-reveal">
                  <label className="block prestige-eyebrow text-[12px] text-[var(--gold)] mb-4 text-center">
                    Style de décoration
                  </label>

                  {/* Style sélectionné en preview */}
                  {selectedStyleInfo && (
                    <div className="mb-4 text-center">
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--gold)] text-[#0c0a09] rounded-full text-[14px] font-medium">
                        <Check className="w-4 h-4" />
                        {selectedStyleInfo.name}
                      </span>
                      <p className="mt-2 text-[13px] text-muted-foreground">{selectedStyleInfo.desc}</p>
                    </div>
                  )}

                  {/* Grille de catégories */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                    {STYLE_CATEGORIES_WITH_STYLES.map((category, categoryIndex) => (
                      <div
                        key={category.category}
                        style={{ ['--reveal-d' as string]: `${categoryIndex * 80}ms` }}
                        className="prestige-reveal bg-card rounded-2xl border border-[var(--gold-line)] overflow-hidden transition-all duration-300"
                      >
                        <div className="px-4 py-2 bg-[rgba(200,162,77,0.08)] border-b border-[var(--gold-line)]">
                          <h3 className="prestige-eyebrow text-[12px] text-[var(--gold)]">
                            {category.category}
                          </h3>
                        </div>
                        <div className="p-2">
                          {category.styles.map((style) => (
                            <button
                              key={style.id}
                              onClick={() => setSelectedStyle(style.id)}
                              className={`
                                w-full text-left px-3 py-2 rounded-xl transition-all duration-200
                                ${selectedStyle === style.id
                                  ? 'bg-[var(--gold)] text-[#0c0a09]'
                                  : 'hover:bg-[rgba(200,162,77,0.06)] text-foreground'
                                }
                              `}
                            >
                              <div className="font-medium text-[14px]">{style.name}</div>
                              <div className={`text-[11px] ${selectedStyle === style.id ? 'text-[#0c0a09]/70' : 'text-muted-foreground'}`}>
                                {style.desc}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              {!isGenerating && !showAuthPrompt && (
                <div className="prestige-reveal flex flex-col items-center pt-2 gap-3">
                  <button
                    onClick={handleGenerate}
                    disabled={user ? (credits ?? 0) < 1 : false}
                    className="group inline-flex items-center gap-2.5 bg-[var(--gold)] text-[#0c0a09] border border-[var(--gold)] px-9 py-4 rounded-full text-[16px] font-semibold tracking-wide hover:bg-transparent hover:text-[var(--gold)] transition-all duration-200 shadow-[0_8px_30px_rgba(200,162,77,0.2)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                  >
                    <Sparkles className="w-5 h-5" />
                    Lancer le rendu premium
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform opacity-90" strokeWidth={2} />
                  </button>
                  {user ? (
                    (credits ?? 0) < 1 ? (
                      <span className="text-[12px] text-destructive">
                        Plus de crédits. <Link href="/credits" className="underline hover:text-[var(--gold)]">Recharger</Link>
                      </span>
                    ) : (
                      <span className="text-[12px] text-muted-foreground">
                        1 crédit sera utilisé • {credits} crédit{(credits ?? 0) > 1 ? 's' : ''} disponible{(credits ?? 0) > 1 ? 's' : ''}
                      </span>
                    )
                  ) : (
                    <span className="text-[12px] text-muted-foreground">
                      Gratuit. 3 crédits offerts à l&apos;inscription
                    </span>
                  )}
                </div>
              )}

              {/* Auth Prompt : affiché quand un visiteur clique sur Transformer */}
              {showAuthPrompt && !isGenerating && (
                <div className="max-w-lg mx-auto">
                  <div className="bg-card rounded-[24px] border border-[var(--gold-line)] p-6 sm:p-8 text-center shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[rgba(200,162,77,0.12)] border border-[var(--gold-line)] flex items-center justify-center">
                      <Sparkles className="w-7 h-7 text-[var(--gold)]" />
                    </div>
                    <h3 className="prestige-display text-[22px] font-bold text-foreground tracking-[-0.02em]">
                      Votre transformation est prête !
                    </h3>
                    <p className="mt-2 text-[15px] text-muted-foreground max-w-sm mx-auto">
                      Créez un compte gratuit pour lancer la génération et recevoir <span className="font-bold text-[var(--gold)]">3 crédits offerts</span>.
                    </p>

                    <div className="mt-6 flex flex-col gap-3">
                      <Link
                        href="/signup?redirect=/generate"
                        className="group inline-flex items-center justify-center gap-2 bg-[var(--gold)] text-[#0c0a09] border border-[var(--gold)] px-7 py-3.5 rounded-full text-[16px] font-semibold hover:bg-transparent hover:text-[var(--gold)] transition-all shadow-lg shadow-[rgba(200,162,77,0.2)] active:scale-95"
                      >
                        <UserPlus className="w-5 h-5" />
                        Créer mon compte. C&apos;est gratuit
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                      <Link
                        href="/login?redirect=/generate"
                        className="text-[14px] text-muted-foreground hover:text-[var(--gold)] transition-colors"
                      >
                        Déjà inscrit ? Se connecter
                      </Link>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-[12px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-emerald-400" /> 3 crédits offerts</span>
                      <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-emerald-400" /> Sans engagement</span>
                      <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-emerald-400" /> Résultat en 30s</span>
                    </div>

                    <button
                      onClick={() => setShowAuthPrompt(false)}
                      className="mt-4 text-[12px] text-muted-foreground hover:text-[var(--gold)] transition-colors"
                    >
                      ← Modifier mes options
                    </button>
                  </div>
                </div>
              )}

              {/* Loading with dynamic messages */}
              {isGenerating && (
                <div className="flex flex-col items-center py-10 px-4 rounded-[32px] bg-card border border-[var(--gold-line)] shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-sm max-w-md mx-auto">
                  <div className="relative w-[72px] h-[72px] mb-6">
                    <div className="absolute inset-0 rounded-full border-[2px] border-[var(--gold-line)]" />
                    <div className="absolute inset-0 rounded-full border-[2px] border-[var(--gold)] border-t-transparent animate-spin" />
                    <div
                      className="absolute inset-3 rounded-full border border-[var(--gold)]/40 border-b-transparent animate-spin"
                      style={{ animationDirection: 'reverse', animationDuration: '1.8s' }}
                    />
                    <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-[var(--gold)]" aria-hidden />
                  </div>
                  <p className="prestige-eyebrow text-[11px] text-[var(--gold)] mb-2">
                    Rendu en cours
                  </p>
                  <p className="prestige-display text-[17px] text-foreground font-medium tracking-[-0.02em] text-center leading-snug max-w-[280px]">
                    {loadingPrimaryText}
                  </p>
                  <p className="mt-2 text-[13px] tabular-nums text-muted-foreground">{Math.round(progress)}%</p>
                  <div
                    className="w-full max-w-[220px] h-[3px] bg-[var(--gold-line)] rounded-full mt-5 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={Math.round(progress)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Progression de la génération"
                  >
                    <div
                      className="h-full bg-[var(--gold)] rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${Math.round(progress)}%` }}
                    />
                  </div>
                  <p className="mt-5 text-[11px] text-muted-foreground max-w-xs text-center leading-relaxed">
                    Vos visuels sont traités de façon confidentielle. Rien n&apos;est utilisé pour entraîner des modèles tiers.
                  </p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="text-center py-4" role="alert">
                  <p className="text-destructive text-[14px]">{error}</p>
                  <button
                    onClick={resetGenerate}
                    className="mt-2 text-[14px] text-[var(--gold)] hover:underline"
                  >
                    Réessayer
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Result */}
          {generatedImage && imagePreview && (
            <div ref={resultRef} className="space-y-10 scroll-mt-4">
              <div className="text-center max-w-2xl mx-auto prestige-reveal">
                <p className="prestige-eyebrow text-[11px] text-[var(--gold)] mb-2">
                  Planche livrée
                </p>
                <h2 className="prestige-display text-[26px] sm:text-[32px] font-semibold text-foreground tracking-[-0.02em] leading-tight">
                  Voici votre rendu. Prêt à être <span className="text-[var(--gold)] italic">partagé</span>
                </h2>
                <div className="prestige-rule mx-auto mt-4" aria-hidden />
                <p className="mt-4 text-[14px] text-muted-foreground">
                  Comparez l&apos;avant / après et téléchargez votre image en haute définition.
                </p>
              </div>
              {/* Before/After */}
              <div className="grid md:grid-cols-2 gap-5 md:gap-6">
                <div className="space-y-3 prestige-reveal" style={{ ['--reveal-d' as string]: '60ms' }}>
                  <span className="block prestige-eyebrow text-[12px] text-muted-foreground">
                    Référence. Avant
                  </span>
                  <div className="rounded-[20px] overflow-hidden bg-[var(--stone-900)] ring-1 ring-border shadow-sm">
                    <Image
                      src={imagePreview!}
                      alt="Votre pièce avant transformation"
                      width={600}
                      height={400}
                      className="w-full h-auto"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      unoptimized
                    />
                  </div>
                </div>

                <div className="space-y-3 prestige-reveal" style={{ ['--reveal-d' as string]: '180ms' }}>
                  <span className="block prestige-eyebrow text-[12px] text-[var(--gold)]">
                    Rendu. {selectedStyleInfo?.name}
                  </span>
                  <div className="relative rounded-[20px] overflow-hidden bg-[var(--stone-900)] ring-1 ring-[var(--gold-line)] shadow-[0_12px_40px_rgba(200,162,77,0.18)]">
                    <Image
                      src={generatedImage}
                      alt="Résultat après transformation IA"
                      width={600}
                      height={400}
                      className="w-full h-auto"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </div>
              </div>

              {/* Options sélectionnées */}
              <div className="max-w-2xl mx-auto prestige-reveal">
                <div className="flex flex-wrap justify-center gap-2.5">
                  {/* Style */}
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-[var(--gold-line)]">
                    <Palette className="h-4 w-4 text-[var(--gold)]" aria-hidden />
                    <span className="text-[13px] font-semibold text-foreground">
                      {selectedStyleInfo?.name ?? selectedStyle}
                    </span>
                  </div>
                  {/* Pièce */}
                  {(() => {
                    const room = ROOM_TYPES.find(r => r.id === selectedRoomType || r.slug === selectedRoomType);
                    return (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-[var(--gold-line)]">
                        <span className="text-[15px]">{room?.icon ?? '🏠'}</span>
                        <span className="text-[13px] font-semibold text-foreground">
                          {room?.name ?? selectedRoomType}
                        </span>
                      </div>
                    );
                  })()}
                  {/* Mode */}
                  {(() => {
                    const mode = TRANSFORM_MODES.find(m => m.id === selectedMode);
                    if (!mode) return null;
                    const ModeIcon = mode.Icon;
                    return (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-[var(--gold-line)]">
                        <ModeIcon className="h-4 w-4 text-[var(--gold)]" aria-hidden />
                        <span className="text-[13px] font-semibold text-foreground">{mode.name}</span>
                      </div>
                    );
                  })()}
                </div>

                {/* Prompt technique : masqué par défaut */}
                {generatedPrompt && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setShowPromptDetails(!showPromptDetails)}
                      className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-[var(--gold)] transition-colors mx-auto"
                    >
                      <Info className="w-3 h-3" />
                      {showPromptDetails ? 'Masquer le prompt IA' : 'Voir le prompt IA'}
                      <ChevronDown className={`w-3 h-3 transition-transform ${showPromptDetails ? 'rotate-180' : ''}`} />
                    </button>
                    {showPromptDetails && (
                      <div className="mt-2 p-3 rounded-xl bg-card border border-[var(--gold-line)] text-left">
                        <p className="text-[11px] text-foreground leading-relaxed font-mono break-words">{generatedPrompt}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="max-w-lg mx-auto prestige-reveal">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-[15px] font-semibold text-[#0c0a09] bg-[var(--gold)] border border-[var(--gold)] hover:bg-transparent hover:text-[var(--gold)] transition-all duration-300 shadow-lg active:scale-[0.98]"
                  >
                    <Download className="w-4 h-4" strokeWidth={2} />
                    Télécharger en haute définition
                  </button>
                  <button
                    onClick={removeImage}
                    className="text-[13px] text-[var(--gold)] hover:underline"
                  >
                    Essayer un autre style
                  </button>
                </div>

                {/* Feedback qualité : mesure la satisfaction par génération */}
                {generationId && (
                  <div className="mt-8 pt-6 border-t border-[var(--gold-line)] flex justify-center">
                    <RatingStars generationId={generationId} className="items-center text-center" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
