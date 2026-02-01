'use client';

import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { Plus, X, ArrowRight, Download, Check, ChevronDown } from 'lucide-react';
import { ProtectedRoute } from '@/components/features/protected-route';
import { useAuth } from '@/hooks/use-auth';
import { useGenerate } from '@/src/presentation/hooks/useGenerate';
import { useHDUnlock } from '@/src/presentation/hooks/useHDUnlock';
import { useGenerationStatus } from '@/src/presentation/hooks/useGenerationStatus';
import { STYLE_CATEGORIES_WITH_STYLES, ROOM_TYPES } from '@/src/shared/constants';

// Modes de transformation
const TRANSFORM_MODES = [
  { 
    id: 'full_redesign', 
    name: 'Transformation complète', 
    desc: 'Remplacer tous les meubles et la déco',
    icon: '✨'
  },
  { 
    id: 'rearrange', 
    name: 'Nouvelle disposition', 
    desc: 'Même style, agencement différent',
    icon: '🔄'
  },
  { 
    id: 'keep_layout', 
    name: 'Garder la disposition', 
    desc: 'Nouveaux meubles, même emplacement',
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
    if (!generationId) {
      alert('Génération non trouvée. Veuillez réessayer.');
      return;
    }
    
    const checkoutUrl = await unlock({ generationId });
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    }
  };

  // Trouver le style sélectionné
  const selectedStyleInfo = STYLE_CATEGORIES_WITH_STYLES
    .flatMap(cat => cat.styles)
    .find(s => s.id === selectedStyle);

  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#fbfbfd]/80 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-[980px] mx-auto px-6 h-12 flex items-center justify-between">
          <a href="/" className="text-[21px] font-semibold tracking-[-0.01em] text-[#1d1d1f]">
            InstaDeco
          </a>
          <div className="flex items-center gap-6">
            <span className="text-sm text-[#424245]">{credits} crédits</span>
            <a href="/pricing" className="text-xs text-[#424245] hover:text-[#1d1d1f] transition-colors">
              Tarifs
            </a>
            <a href="/dashboard" className="text-xs font-medium text-[#fbfbfd] bg-[#1d1d1f] px-4 py-1.5 rounded-full hover:bg-black transition-colors">
              Mon Compte
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-12 px-6">
        <div className="max-w-[680px] mx-auto text-center">
          <h1 className="text-[56px] font-semibold tracking-[-0.025em] text-[#1d1d1f] leading-[1.05]">
            Réinventez votre intérieur.
          </h1>
          <p className="mt-4 text-[21px] text-[#86868b] font-normal leading-[1.4] tracking-[.011em]">
            Uploadez une photo. Choisissez un style. L&apos;IA fait le reste.
          </p>
        </div>
      </section>

      {/* Main App */}
      <section className="pb-20 px-6">
        <div className="max-w-[980px] mx-auto">
          
          {/* Upload Zone */}
          {!imagePreview && (
            <div
              {...getRootProps()}
              className={`
                relative rounded-[28px] border-2 border-dashed transition-all duration-300 cursor-pointer
                ${isDragActive 
                  ? 'border-[#0071e3] bg-[#0071e3]/5' 
                  : 'border-[#d2d2d7] hover:border-[#86868b] bg-white'
                }
              `}
            >
              <input {...getInputProps()} />
              <div className="py-20 px-8 text-center">
                <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                  <Plus className="w-6 h-6 text-[#86868b]" strokeWidth={1.5} />
                </div>
                <p className="text-[17px] text-[#1d1d1f] font-medium tracking-[-0.01em]">
                  {isDragActive ? 'Déposez votre image' : 'Ajouter une photo'}
                </p>
                <p className="mt-2 text-[12px] text-[#86868b] tracking-[.007em]">
                  Glissez-déposez ou cliquez • PNG, JPG, WEBP
                </p>
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
                  <label className="block text-[12px] font-medium text-[#86868b] uppercase tracking-[.1em] mb-4">
                    Que voulez-vous faire ?
                  </label>
                  <div className="flex flex-wrap justify-center gap-3">
                    {TRANSFORM_MODES.map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setSelectedMode(mode.id)}
                        className={`
                          px-5 py-3 rounded-2xl text-left transition-all duration-200 min-w-[180px]
                          ${selectedMode === mode.id
                            ? 'bg-[#1d1d1f] text-white ring-2 ring-[#1d1d1f] ring-offset-2'
                            : 'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]'
                          }
                        `}
                      >
                        <span className="text-lg mr-2">{mode.icon}</span>
                        <span className="text-[14px] font-medium">{mode.name}</span>
                        <p className={`text-[11px] mt-0.5 ${selectedMode === mode.id ? 'text-white/70' : 'text-[#86868b]'}`}>
                          {mode.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Room Type */}
                <div className="text-center">
                  <label className="block text-[12px] font-medium text-[#86868b] uppercase tracking-[.1em] mb-4">
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
                  <label className="block text-[12px] font-medium text-[#86868b] uppercase tracking-[.1em] mb-4 text-center">
                    Style de décoration
                  </label>
                  
                  {/* Style sélectionné en preview */}
                  {selectedStyleInfo && (
                    <div className="mb-4 text-center">
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#1d1d1f] text-white rounded-full text-[14px] font-medium">
                        <Check className="w-4 h-4" />
                        {selectedStyleInfo.name}
                      </span>
                      <p className="mt-2 text-[13px] text-[#86868b]">{selectedStyleInfo.desc}</p>
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
                          <h3 className="text-[12px] font-semibold text-[#86868b] uppercase tracking-wider">
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
                              <div className={`text-[11px] ${selectedStyle === style.id ? 'text-white/70' : 'text-[#86868b]'}`}>
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
                <div className="flex justify-center pt-2">
                  <button
                    onClick={handleGenerate}
                    className="group inline-flex items-center gap-2 bg-[#0071e3] text-white px-7 py-3.5 rounded-full text-[17px] font-medium hover:bg-[#0077ed] transition-all duration-200"
                  >
                    Générer le design
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
                  </button>
                </div>
              )}

              {/* Loading State */}
              {isGenerating && (
                <div className="flex flex-col items-center py-6">
                  <div className="relative w-12 h-12 mb-5">
                    <div className="absolute inset-0 rounded-full border-[2.5px] border-[#e8e8ed]" />
                    <div 
                      className="absolute inset-0 rounded-full border-[2.5px] border-[#1d1d1f] border-t-transparent animate-spin"
                    />
                  </div>
                  <p className="text-[17px] text-[#1d1d1f] font-medium tracking-[-0.01em]">
                    Création en cours...
                  </p>
                  <p className="mt-1 text-[14px] text-[#86868b]">
                    {Math.round(progress)}%
                  </p>
                  <div className="w-40 h-[3px] bg-[#e8e8ed] rounded-full mt-4 overflow-hidden">
                    <div 
                      className="h-full bg-[#1d1d1f] rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${Math.round(progress)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="text-center py-4">
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
                  <span className="block text-[12px] font-medium text-[#86868b] uppercase tracking-[.1em]">
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
                  <span className="block text-[12px] font-medium text-[#86868b] uppercase tracking-[.1em]">
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

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[14px] font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e8e8ed] transition-colors"
                >
                  <Download className="w-4 h-4" strokeWidth={2} />
                  Télécharger l&apos;aperçu
                </button>
                <button
                  onClick={handleUnlock}
                  disabled={isUnlocking}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-[14px] font-medium text-white bg-[#1d1d1f] hover:bg-black transition-colors disabled:opacity-50"
                >
                  <Check className="w-4 h-4" strokeWidth={2} />
                  {isUnlocking ? 'Chargement...' : 'Obtenir en HD — 4,99 €'}
                </button>
              </div>

              <p className="text-center text-[12px] text-[#86868b]">
                Version HD : sans filigrane, résolution 4K.
              </p>

              <div className="flex justify-center">
                <button
                  onClick={removeImage}
                  className="text-[14px] text-[#0071e3] hover:underline"
                >
                  Essayer avec une autre photo
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#d2d2d7] py-6 px-6 bg-[#f5f5f7]">
        <div className="max-w-[980px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-[#86868b]">
            © 2026 InstaDeco. Propulsé par Flux.1 ControlNet.
          </p>
          <div className="flex items-center gap-6 text-[12px] text-[#424245]">
            <a href="#" className="hover:text-[#1d1d1f] transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-[#1d1d1f] transition-colors">Conditions</a>
            <a href="#" className="hover:text-[#1d1d1f] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
