'use client';

import { useCallback, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { Plus, X, ArrowRight, Download, Check, ChevronDown, Sparkles, Star, Shield, Zap, UserPlus, Eye, Users } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useGenerate } from '@/src/presentation/hooks/useGenerate';
import { useGenerationStatus } from '@/src/presentation/hooks/useGenerationStatus';
import { STYLE_CATEGORIES_WITH_STYLES, ROOM_TYPES } from '@/src/shared/constants';
import { fbTrackUploadPhoto, fbTrackStartGeneration } from '@/lib/analytics/fb-pixel';
import { trackCTAClick } from '@/lib/analytics/gtag';

const LOADING_MESSAGES = [
  { threshold: 0, text: 'Analyse de votre pièce...' },
  { threshold: 15, text: 'Identification de la structure...' },
  { threshold: 30, text: 'Application du style choisi...' },
  { threshold: 50, text: 'Génération des détails...' },
  { threshold: 70, text: 'Ajout des finitions...' },
  { threshold: 85, text: 'Peaufinage du rendu...' },
  { threshold: 95, text: 'Presque terminé...' },
];

// Modes de transformation
const TRANSFORM_MODES = [
  { 
    id: 'full_redesign', 
    name: 'Transformation complète', 
    desc: 'Remplacer meubles et déco, garder la structure',
    icon: '✨'
  },
  { 
    id: 'keep_layout', 
    name: 'Garder la disposition', 
    desc: 'Nouveaux meubles au même emplacement',
    icon: '📐'
  },
  { 
    id: 'decor_only', 
    name: 'Déco uniquement', 
    desc: 'Garder les meubles, changer la déco',
    icon: '🖼️'
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
  const [selectedMode, setSelectedMode] = useState('full_redesign');
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  // Hooks de la couche Presentation
  const { generate, state: generateState, reset: resetGenerate } = useGenerate();
  
  // Polling du statut de génération
  const { 
    generation: statusGeneration, 
    isComplete, 
    isFailed 
  } = useGenerationStatus(generationId);

  // États dérivés
  // L'image est disponible dès la réponse synchrone OU via le polling
  const generatedImage = generateState.data?.outputImageUrl || statusGeneration?.outputImageUrl || null;
  const isGenerating = generateState.isLoading || (generationId && !isComplete && !isFailed && !generatedImage);
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

  // Quand la génération démarre, stocker l'ID pour le polling (confirmation)
  // Mais ne pas lancer le polling si le résultat est déjà complet
  useEffect(() => {
    if (generateState.data?.id && generateState.data?.status !== 'completed') {
      setGenerationId(generateState.data.id);
    } else if (generateState.data?.id && generateState.data?.status === 'completed') {
      // Résultat déjà complet, pas besoin de polling
      setGenerationId(generateState.data.id);
    }
  }, [generateState.data?.id, generateState.data?.status]);

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
    maxSize: 10 * 1024 * 1024,
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
    <div className="min-h-screen bg-[#fbfbfd]">
      {/* Bandeau de preuve sociale */}
      <div className="bg-[#1d1d1f] text-white py-2 px-4 text-center">
        <p className="text-[12px] sm:text-[13px] font-medium flex items-center justify-center gap-2 flex-wrap">
          <Users className="w-3.5 h-3.5 text-[#E07B54]" />
          <span>Déjà <strong>10 000+</strong> photos transformées</span>
          <span className="hidden sm:inline text-white/40">•</span>
          <span className="hidden sm:inline">Résultat en <strong>30 secondes</strong></span>
          <span className="text-white/40">•</span>
          <span className="flex items-center gap-0.5">
            {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
          </span>
        </p>
      </div>

      {/* Hero */}
      <section className="pt-8 pb-8 px-4 sm:pt-12 sm:pb-12 sm:px-6">
        <div className="max-w-[680px] mx-auto text-center">
          {!user && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#FFF3ED] text-[#E07B54] rounded-full text-[13px] font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Essayez maintenant — 3 crédits offerts à l&apos;inscription
            </div>
          )}
          <h1 className="text-[28px] sm:text-[40px] md:text-[48px] lg:text-[56px] font-semibold tracking-[-0.025em] text-[#1d1d1f] leading-[1.08]">
            Relookez votre pièce en 30 secondes.
          </h1>
          <p className="mt-3 text-[16px] sm:text-[18px] md:text-[21px] text-[#636366] font-normal leading-[1.4] tracking-[.011em]">
            Uploadez une photo. Choisissez un style. L&apos;IA fait le reste.
          </p>
          {/* Mini galerie avant/après */}
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap text-[12px] text-[#636366]">
            <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> 20+ styles de déco</span>
            <span className="text-[#d2d2d7]">•</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Résultat en 30s</span>
            <span className="text-[#d2d2d7]">•</span>
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> 100% privé</span>
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
                relative rounded-[28px] border-2 border-dashed transition-all duration-300 cursor-pointer
                ${isDragActive 
                  ? 'border-[#0071e3] bg-[#0071e3]/5' 
                  : 'border-[#d2d2d7] hover:border-[#636366] bg-white'
                }
              `}
            >
              <input {...getInputProps()} />
              <div className="py-14 px-4 sm:py-20 sm:px-8 text-center">
                <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                  <Plus className="w-6 h-6 text-[#636366]" strokeWidth={1.5} />
                </div>
                <p className="text-[15px] sm:text-[17px] text-[#1d1d1f] font-medium tracking-[-0.01em]">
                  {isDragActive ? 'Déposez votre image' : 'Ajouter une photo de votre pièce'}
                </p>
                <p className="mt-2 text-[12px] text-[#636366] tracking-[.007em]">
                  Glissez-déposez ou cliquez • PNG, JPG, WEBP • Max 10 Mo
                </p>
                <div className="mt-6 flex items-center justify-center gap-3 sm:gap-6 flex-wrap text-[11px] text-[#636366]">
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Résultat en 10s</span>
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> 100% privé</span>
                  <span className="flex items-center gap-1"><Star className="w-3 h-3" /> 12 styles</span>
                </div>
              </div>
            </div>
          )}

          {/* Image Preview + Options */}
          {imagePreview && !generatedImage && (
            <div className="space-y-10">
              {/* Image Preview */}
              <div className="relative rounded-[28px] overflow-hidden bg-[#f5f5f7] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <Image
                  src={imagePreview}
                  alt="Votre pièce — aperçu avant transformation"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                  sizes="(max-width: 768px) 100vw, 672px"
                  unoptimized
                />
                <button
                  onClick={removeImage}
                  className="absolute top-4 right-4 w-9 h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                >
                  <X className="w-4 h-4 text-[#1d1d1f]" strokeWidth={2} />
                </button>
              </div>

              {/* Options */}
              <div className="space-y-8">
                {/* Transform Mode */}
                <div className="text-center">
                  <label className="block text-[12px] font-medium text-[#636366] uppercase tracking-[.1em] mb-4">
                    Que voulez-vous faire ?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {TRANSFORM_MODES.map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setSelectedMode(mode.id)}
                        className={`
                          px-4 py-3 rounded-2xl text-left transition-all duration-200 w-full
                          ${selectedMode === mode.id
                            ? 'bg-[#1d1d1f] text-white ring-2 ring-[#1d1d1f] ring-offset-2'
                            : 'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]'
                          }
                        `}
                      >
                        <span className="text-lg mr-2">{mode.icon}</span>
                        <span className="text-[14px] font-medium">{mode.name}</span>
                        <p className={`text-[11px] mt-0.5 ${selectedMode === mode.id ? 'text-white/70' : 'text-[#636366]'}`}>
                          {mode.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Room Type */}
                <div className="text-center">
                  <label className="block text-[12px] font-medium text-[#636366] uppercase tracking-[.1em] mb-4">
                    Type de pièce
                  </label>
                  <div className="flex flex-wrap justify-center gap-2">
                    {ROOM_TYPES.map((room) => (
                      <button
                        key={room.id}
                        onClick={() => setSelectedRoomType(room.id)}
                        className={`
                          px-5 py-2.5 rounded-full text-[14px] font-medium transition-all duration-200
                          ${selectedRoomType === room.id
                            ? 'bg-[#1d1d1f] text-white'
                            : 'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]'
                          }
                        `}
                      >
                        {room.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Style - Organisé par catégories */}
                <div>
                  <label className="block text-[12px] font-medium text-[#636366] uppercase tracking-[.1em] mb-4 text-center">
                    Style de décoration
                  </label>
                  
                  {/* Style sélectionné en preview */}
                  {selectedStyleInfo && (
                    <div className="mb-4 text-center">
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#1d1d1f] text-white rounded-full text-[14px] font-medium">
                        <Check className="w-4 h-4" />
                        {selectedStyleInfo.name}
                      </span>
                      <p className="mt-2 text-[13px] text-[#636366]">{selectedStyleInfo.desc}</p>
                    </div>
                  )}
                  
                  {/* Grille de catégories */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                    {STYLE_CATEGORIES_WITH_STYLES.map((category) => (
                      <div 
                        key={category.category} 
                        className="bg-white rounded-2xl border border-black/5 overflow-hidden"
                      >
                        <div className="px-4 py-2 bg-[#f5f5f7] border-b border-black/5">
                          <h3 className="text-[12px] font-semibold text-[#636366] uppercase tracking-wider">
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
                                  ? 'bg-[#1d1d1f] text-white'
                                  : 'hover:bg-[#f5f5f7] text-[#1d1d1f]'
                                }
                              `}
                            >
                              <div className="font-medium text-[14px]">{style.name}</div>
                              <div className={`text-[11px] ${selectedStyle === style.id ? 'text-white/70' : 'text-[#636366]'}`}>
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
                <div className="flex flex-col items-center pt-2 gap-3">
                  <button
                    onClick={handleGenerate}
                    className="group inline-flex items-center gap-2 bg-[#E07B54] text-white px-8 py-4 rounded-full text-[17px] font-semibold hover:bg-[#d06a45] transition-all duration-200 shadow-lg shadow-[#E07B54]/20 active:scale-95"
                  >
                    <Sparkles className="w-5 h-5" />
                    Transformer ma pièce
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
                  </button>
                  {user ? (
                    <span className="text-[12px] text-[#636366]">
                      1 crédit sera utilisé • {credits} crédit{(credits ?? 0) > 1 ? 's' : ''} disponible{(credits ?? 0) > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="text-[12px] text-[#636366]">
                      Gratuit — 3 crédits offerts à l&apos;inscription
                    </span>
                  )}
                </div>
              )}

              {/* Auth Prompt — affiché quand un visiteur clique sur Transformer */}
              {showAuthPrompt && !isGenerating && (
                <div className="max-w-lg mx-auto">
                  <div className="bg-gradient-to-br from-[#FFF8F5] to-[#FFF0E8] rounded-[24px] border border-[#F0E6E0] p-6 sm:p-8 text-center shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#E07B54]/10 flex items-center justify-center">
                      <Sparkles className="w-7 h-7 text-[#E07B54]" />
                    </div>
                    <h3 className="text-[22px] font-bold text-[#1d1d1f] tracking-[-0.02em]">
                      Votre transformation est prête !
                    </h3>
                    <p className="mt-2 text-[15px] text-[#636366] max-w-sm mx-auto">
                      Créez un compte gratuit pour lancer la génération et recevoir <span className="font-bold text-[#E07B54]">3 crédits offerts</span>.
                    </p>

                    <div className="mt-6 flex flex-col gap-3">
                      <Link
                        href="/signup?redirect=/generate"
                        className="group inline-flex items-center justify-center gap-2 bg-[#E07B54] text-white px-7 py-3.5 rounded-full text-[16px] font-semibold hover:bg-[#d06a45] transition-all shadow-lg shadow-[#E07B54]/20 active:scale-95"
                      >
                        <UserPlus className="w-5 h-5" />
                        Créer mon compte — c&apos;est gratuit
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                      <Link
                        href="/login?redirect=/generate"
                        className="text-[14px] text-[#636366] hover:text-[#1d1d1f] transition-colors"
                      >
                        Déjà inscrit ? Se connecter
                      </Link>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-[12px] text-[#636366]">
                      <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-green-500" /> 3 crédits offerts</span>
                      <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-green-500" /> Sans engagement</span>
                      <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-green-500" /> Résultat en 30s</span>
                    </div>

                    <button
                      onClick={() => setShowAuthPrompt(false)}
                      className="mt-4 text-[12px] text-[#aaa] hover:text-[#636366] transition-colors"
                    >
                      ← Modifier mes options
                    </button>
                  </div>
                </div>
              )}

              {/* Loading with dynamic messages */}
              {isGenerating && (
                <div className="flex flex-col items-center py-8">
                  <div className="relative w-16 h-16 mb-5">
                    <div className="absolute inset-0 rounded-full border-[2.5px] border-[#e8e8ed]" />
                    <div className="absolute inset-0 rounded-full border-[2.5px] border-[#0071e3] border-t-transparent animate-spin" />
                    <div className="absolute inset-2 rounded-full border-[2px] border-[#0071e3]/20 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                  </div>
                  <p className="text-[17px] text-[#1d1d1f] font-medium tracking-[-0.01em]">
                    {LOADING_MESSAGES.filter(m => m.threshold <= Math.round(progress)).pop()?.text || 'Préparation...'}
                  </p>
                  <p className="mt-1 text-[14px] text-[#636366]">{Math.round(progress)}%</p>
                  <div
                    className="w-48 h-[3px] bg-[#e8e8ed] rounded-full mt-4 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={Math.round(progress)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Progression de la génération"
                  >
                    <div
                      className="h-full bg-gradient-to-r from-[#0071e3] to-[#34aadc] rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${Math.round(progress)}%` }}
                    />
                  </div>
                  <p className="mt-4 text-[11px] text-[#636366] max-w-xs text-center">
                    Votre photo reste 100% privée
                  </p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="text-center py-4" role="alert">
                  <p className="text-[#ff3b30] text-[14px]">{error}</p>
                  <button 
                    onClick={resetGenerate}
                    className="mt-2 text-[14px] text-[#0071e3] hover:underline"
                  >
                    Réessayer
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Result */}
          {generatedImage && imagePreview && (
            <div className="space-y-10">
              {/* Before/After */}
              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <span className="block text-[12px] font-medium text-[#636366] uppercase tracking-[.1em]">
                    Avant
                  </span>
                  <div className="rounded-[20px] overflow-hidden bg-[#f5f5f7]">
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

                <div className="space-y-3">
                  <span className="block text-[12px] font-medium text-[#636366] uppercase tracking-[.1em]">
                    Après — {selectedStyleInfo?.name}
                  </span>
                  <div className="relative rounded-[20px] overflow-hidden bg-[#f5f5f7]">
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

              {/* Actions */}
              <div className="max-w-lg mx-auto">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-[15px] font-semibold text-white bg-[#E07B54] hover:bg-[#d06a45] transition-all shadow-lg shadow-[#E07B54]/20 active:scale-95"
                  >
                    <Download className="w-4 h-4" strokeWidth={2} />
                    Télécharger l&apos;image
                  </button>
                  <button
                    onClick={removeImage}
                    className="text-[13px] text-[#0071e3] hover:underline"
                  >
                    Essayer un autre style
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
