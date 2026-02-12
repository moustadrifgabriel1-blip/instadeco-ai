'use client';

import { useCallback, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { Plus, X, ArrowRight, Download, Check, ChevronDown, Sparkles, Star, Shield, Zap } from 'lucide-react';
import { ProtectedRoute } from '@/components/features/protected-route';
import { useAuth } from '@/hooks/use-auth';
import { useGenerate } from '@/src/presentation/hooks/useGenerate';
import { useHDUnlock } from '@/src/presentation/hooks/useHDUnlock';
import { useGenerationStatus } from '@/src/presentation/hooks/useGenerationStatus';
import { STYLE_CATEGORIES_WITH_STYLES, ROOM_TYPES } from '@/src/shared/constants';

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
  return (
    <ProtectedRoute>
      <GenerateContent />
    </ProtectedRoute>
  );
}

function GenerateContent() {
  const { user, credits } = useAuth();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('moderne');
  const [selectedRoomType, setSelectedRoomType] = useState('salon');
  const [selectedMode, setSelectedMode] = useState('full_redesign');
  const [generationId, setGenerationId] = useState<string | null>(null);

  // Hooks de la couche Presentation
  const { generate, state: generateState, reset: resetGenerate } = useGenerate();
  const { unlock, isLoading: isUnlocking, error: hdError } = useHDUnlock();
  
  // Polling du statut de génération
  const { 
    generation: statusGeneration, 
    isComplete, 
    isFailed 
  } = useGenerationStatus(generationId);

  // États dérivés
  const isGenerating = generateState.isLoading || (generationId && !isComplete && !isFailed);
  const [progress, setProgress] = useState(0);
  
  // Effet pour animer la progression
  useEffect(() => {
    if (generateState.isLoading) {
      // Phase initiale (upload, préparation)
      setProgress(generateState.progress);
    } else if (generationId && !isComplete && !isFailed) {
      // Phase de polling (génération IA)
      // On démarre à ce que useGenerate a laissé (ex: 5%)
      setProgress(prev => Math.max(prev, generateState.progress));
      
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) return prev;
          // Avance doucement (progression logarithmique)
          const remaining = 95 - prev;
          const increment = Math.max(0.1, remaining / 100);
          return prev + increment;
        });
      }, 200);
      
      return () => clearInterval(interval);
    } else if (isComplete) {
      setProgress(100);
    } else if (isFailed) {
      setProgress(0);
    }
  }, [generateState.isLoading, generateState.progress, generationId, isComplete, isFailed]);

  const generatedImage = statusGeneration?.outputImageUrl || null;
  const error = generateState.error || hdError || (isFailed ? 'La génération a échoué' : null);

  // Quand la génération démarre, stocker l'ID pour le polling
  useEffect(() => {
    if (generateState.data?.id) {
      setGenerationId(generateState.data.id);
    }
  }, [generateState.data?.id]);

  // Upload d'image avec drag & drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      resetGenerate();
      setGenerationId(null);
    }
  }, [resetGenerate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    resetGenerate();
    setGenerationId(null);
  };

  const handleGenerate = async () => {
    if (!imageFile || !user) return;
    
    // Utiliser le hook generate
    await generate({
      imageFile,
      roomType: selectedRoomType,
      style: selectedStyle,
      transformMode: selectedMode,
    });
  };

  // Fonction pour ajouter le filigrane sur l'image - TRÈS VISIBLE pour encourager l'achat HD
  const addWatermarkToImage = async (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const centerX = img.width / 2;
        const centerY = img.height / 2;
        
        // Bande semi-transparente en diagonale
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(-25 * Math.PI / 180);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fillRect(-img.width, -60, img.width * 2, 120);
        ctx.restore();
        
        // Filigrane principal - GROS et VISIBLE
        const mainText = 'InstaDeco AI';
        const mainFontSize = Math.max(img.width / 5, 100);
        ctx.font = `900 ${mainFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(-25 * Math.PI / 180);
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillText(mainText, 0, 0);
        ctx.restore();
        
        // Filigranes répétés - haut gauche
        const subFontSize = Math.max(img.width / 12, 40);
        ctx.font = `bold ${subFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        
        ctx.save();
        ctx.translate(img.width * 0.2, img.height * 0.15);
        ctx.rotate(-25 * Math.PI / 180);
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 4;
        ctx.fillText('InstaDeco AI', 0, 0);
        ctx.restore();
        
        // Filigranes répétés - bas droite
        ctx.save();
        ctx.translate(img.width * 0.8, img.height * 0.85);
        ctx.rotate(-25 * Math.PI / 180);
        ctx.fillText('InstaDeco AI', 0, 0);
        ctx.restore();
        
        // Badge CTA en bas
        const ctaFontSize = Math.max(img.width / 20, 24);
        const badgeWidth = 340;
        const badgeHeight = 42;
        const badgeX = centerX - badgeWidth / 2;
        const badgeY = img.height - 52;
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 6;
        ctx.fillStyle = 'rgba(224, 123, 84, 0.9)';
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 21);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.font = `bold ${ctaFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔓 Débloquer en HD sans filigrane', centerX, badgeY + badgeHeight / 2);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/jpeg', 0.92);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = imageUrl;
    });
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    
    // SÉCURITÉ: Priorité à l'API serveur si on a un generationId
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
        link.download = 'instadeco-apercu.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        return;
      } catch (err) {
        console.error('Erreur téléchargement via API:', err);
        // Continuer avec le watermark Canvas en fallback
      }
    }
    
    // Fallback: Watermark côté client avec Canvas
    try {
      const watermarkedUrl = await addWatermarkToImage(generatedImage);
      const link = document.createElement('a');
      link.href = watermarkedUrl;
      link.download = 'instadeco-apercu.jpg';
      link.click();
      setTimeout(() => URL.revokeObjectURL(watermarkedUrl), 1000);
    } catch (err) {
      console.error('Erreur lors du téléchargement:', err);
      // SÉCURITÉ: Ne jamais télécharger sans filigrane
      alert('Erreur lors du téléchargement. Veuillez réessayer depuis votre tableau de bord.');
    }
  };

  const handleUnlock = async () => {
    console.log('[HD Unlock] Click — generationId:', generationId);
    if (!generationId) {
      alert('Génération non trouvée. Veuillez réessayer.');
      return;
    }
    
    try {
      const checkoutUrl = await unlock({ generationId });
      console.log('[HD Unlock] checkoutUrl:', checkoutUrl);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        // Si pas de checkoutUrl mais pas d'erreur, l'image est peut-être déjà débloquée
        console.warn('[HD Unlock] Pas de checkoutUrl retourné');
      }
    } catch (err) {
      console.error('[HD Unlock] Erreur:', err);
      alert('Erreur lors du déblocage HD. Veuillez réessayer.');
    }
  };

  // Trouver le style sélectionné
  const selectedStyleInfo = STYLE_CATEGORIES_WITH_STYLES
    .flatMap(cat => cat.styles)
    .find(s => s.id === selectedStyle);

  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      {/* Hero */}
      <section className="pt-8 pb-8 px-4 sm:pt-12 sm:pb-12 sm:px-6">
        <div className="max-w-[680px] mx-auto text-center">
          <h1 className="text-[28px] sm:text-[40px] md:text-[48px] lg:text-[56px] font-semibold tracking-[-0.025em] text-[#1d1d1f] leading-[1.08]">
            Réinventez votre intérieur.
          </h1>
          <p className="mt-3 text-[16px] sm:text-[18px] md:text-[21px] text-[#636366] font-normal leading-[1.4] tracking-[.011em]">
            Uploadez une photo. Choisissez un style. L&apos;IA fait le reste.
          </p>
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
                  alt="Votre pièce"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
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
              {!isGenerating && (
                <div className="flex flex-col items-center pt-2 gap-3">
                  <button
                    onClick={handleGenerate}
                    className="group inline-flex items-center gap-2 bg-[#0071e3] text-white px-7 py-3.5 rounded-full text-[17px] font-medium hover:bg-[#0077ed] transition-all duration-200 shadow-lg shadow-[#0071e3]/20"
                  >
                    <Sparkles className="w-5 h-5" />
                    Transformer ma pièce
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
                  </button>
                  <span className="text-[12px] text-[#636366]">
                    1 crédit sera utilisé • {credits} crédit{(credits ?? 0) > 1 ? 's' : ''} disponible{(credits ?? 0) > 1 ? 's' : ''}
                  </span>
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
                      alt="Avant"
                      width={600}
                      height={400}
                      className="w-full h-auto"
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
                      alt="Après"
                      width={600}
                      height={400}
                      className="w-full h-auto"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span 
                        className="text-white/40 text-[32px] md:text-[48px] font-bold tracking-[.08em] rotate-[-15deg]"
                        style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}
                      >
                        InstaDeco
                      </span>
                    </div>
                    <div className="absolute bottom-2 right-3 pointer-events-none">
                      <span className="text-white/50 text-[9px] md:text-[10px]" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.4)' }}>
                        Généré par IA
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions - HD Upsell optimized */}
              <div className="max-w-lg mx-auto">
                {/* Primary: HD Unlock CTA */}
                <div className="bg-gradient-to-br from-[#1d1d1f] to-[#2d2d2f] rounded-2xl p-6 text-center mb-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <span className="text-white font-semibold text-[17px]">Débloquer la version HD</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap mb-4 text-[12px] sm:text-[13px] text-white/70">
                    <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-[#4CAF50]" /> Sans filigrane</span>
                    <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-[#4CAF50]" /> Résolution 4K</span>
                    <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-[#4CAF50]" /> Usage commercial</span>
                  </div>
                  <button
                    onClick={handleUnlock}
                    disabled={isUnlocking}
                    className="w-full inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-[15px] font-semibold text-[#1d1d1f] bg-gradient-to-r from-amber-300 to-amber-400 hover:from-amber-400 hover:to-amber-500 transition-all disabled:opacity-50 shadow-lg shadow-amber-400/20 active:scale-95"
                  >
                    {isUnlocking ? 'Chargement...' : 'Obtenir en HD — 4,99 €'}
                  </button>
                  <p className="text-[11px] text-white/40 mt-2">Paiement unique • Téléchargement immédiat</p>
                </div>

                {/* Secondary: Free download */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium text-[#636366] bg-[#f5f5f7] hover:bg-[#e8e8ed] transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" strokeWidth={2} />
                    Télécharger l&apos;aperçu (avec filigrane)
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
