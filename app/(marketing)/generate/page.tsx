'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { Plus, X, ArrowRight, Download, Check } from 'lucide-react';
import { ProtectedRoute } from '@/components/features/protected-route';
import { CreditBadge } from '@/components/features/credit-badge';
import { useAuth } from '@/hooks/use-auth';

// Styles de décoration disponibles - MEGA PROMPTS pour transformation complète
const STYLES = [
  { id: 'moderne', name: 'Moderne', desc: 'Élégance contemporaine sophistiquée' },
  { id: 'minimaliste', name: 'Minimaliste', desc: 'Simplicité scandinave épurée' },
  { id: 'boheme', name: 'Bohème', desc: 'Chaleur éclectique globe-trotter' },
  { id: 'industriel', name: 'Industriel', desc: 'Loft urbain brut et raffiné' },
  { id: 'classique', name: 'Classique', desc: 'Élégance traditionnelle intemporelle' },
  { id: 'japandi', name: 'Japandi', desc: 'Zen japonais & cocooning nordique' },
  { id: 'midcentury', name: 'Mid-Century', desc: 'Rétro iconique années 50-60' },
  { id: 'coastal', name: 'Coastal', desc: 'Bord de mer relaxant et lumineux' },
  { id: 'farmhouse', name: 'Farmhouse', desc: 'Charme rustique contemporain' },
  { id: 'artdeco', name: 'Art Déco', desc: 'Glamour opulent années 1920' },
];

// Types de pièces
const ROOM_TYPES = [
  { id: 'salon', name: 'Salon' },
  { id: 'chambre', name: 'Chambre' },
  { id: 'cuisine', name: 'Cuisine' },
  { id: 'salle-de-bain', name: 'Salle de bain' },
  { id: 'bureau', name: 'Bureau' },
  { id: 'salle-a-manger', name: 'Salle à manger' },
];

export default function GeneratePage() {
  return (
    <ProtectedRoute>
      <GenerateContent />
    </ProtectedRoute>
  );
}

function GenerateContent() {
  const { user } = useAuth();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('moderne');
  const [selectedRoomType, setSelectedRoomType] = useState('salon');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Upload d'image avec drag & drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setGeneratedImage(null);
      setError(null);
    }
  }, []);

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
    setGeneratedImage(null);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!imageFile || !user) return;

    setIsGenerating(true);
    setProgress(0);
    setError(null);

    try {
      const base64 = await fileToBase64(imageFile);

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: base64,
          roomType: selectedRoomType,
          style: selectedStyle,
          controlMode: 'canny',
          userId: user.uid, // Ajout de l'ID utilisateur
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Gérer spécifiquement l'erreur de crédits insuffisants
        if (errorData.code === 'INSUFFICIENT_CREDITS') {
          throw new Error('Crédits insuffisants. Rechargez votre compte pour continuer.');
        }
        
        throw new Error(errorData.error || 'Erreur lors de la génération');
      }

      const data = await response.json();
      // Utiliser generationId (Firestore) pour le polling, pas requestId (Replicate)
      const pollingId = data.generationId || data.requestId;
      setRequestId(pollingId);
      pollStatus(pollingId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      setIsGenerating(false);
    }
  };

  const pollStatus = async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/generate/${id}/status`);
        const data = await response.json();

        if (data.status === 'completed') {
          clearInterval(interval);
          setGeneratedImage(data.outputImageUrl);
          setIsGenerating(false);
          setProgress(100);
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setError('La génération a échoué.');
          setIsGenerating(false);
        } else {
          setProgress((prev) => Math.min(prev + 8, 95));
        }
      } catch (err) {
        clearInterval(interval);
        setError('Erreur de connexion.');
        setIsGenerating(false);
      }
    }, 2000);
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = 'instadeco-design.jpg';
    link.click();
  };

  const handleUnlock = async () => {
    try {
      const response = await fetch('/api/unlock-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generationId: requestId }),
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert('Erreur lors de la redirection');
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#fbfbfd]/80 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-[980px] mx-auto px-6 h-12 flex items-center justify-between">
          <a href="/" className="text-[21px] font-semibold tracking-[-0.01em] text-[#1d1d1f]">
            InstaDeco
          </a>
          <div className="flex items-center gap-6">
            <CreditBadge />
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
                  className="w-full h-auto"                  unoptimized                />
                <button
                  onClick={removeImage}
                  className="absolute top-4 right-4 w-9 h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                >
                  <X className="w-4 h-4 text-[#1d1d1f]" strokeWidth={2} />
                </button>
              </div>

              {/* Options */}
              <div className="space-y-8">
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

                {/* Style */}
                <div className="text-center">
                  <label className="block text-[12px] font-medium text-[#86868b] uppercase tracking-[.1em] mb-4">
                    Style de décoration
                  </label>
                  <div className="flex flex-wrap justify-center gap-2">
                    {STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={`
                          px-5 py-2.5 rounded-full text-[14px] font-medium transition-all duration-200
                          ${selectedStyle === style.id
                            ? 'bg-[#1d1d1f] text-white'
                            : 'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]'
                          }
                        `}
                      >
                        {style.name}
                      </button>
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
                    {progress}%
                  </p>
                  <div className="w-40 h-[3px] bg-[#e8e8ed] rounded-full mt-4 overflow-hidden">
                    <div 
                      className="h-full bg-[#1d1d1f] rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="text-center py-4">
                  <p className="text-[#ff3b30] text-[14px]">{error}</p>
                  <button 
                    onClick={() => setError(null)}
                    className="mt-2 text-[14px] text-[#0071e3] hover:underline"
                  >
                    Réessayer
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Result */}
          {generatedImage && (
            <div className="space-y-10">
              {/* Before/After */}
              <div className="grid md:grid-cols-2 gap-5">
                {/* Before */}
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

                {/* After */}
                <div className="space-y-3">
                  <span className="block text-[12px] font-medium text-[#86868b] uppercase tracking-[.1em]">
                    Après — {STYLES.find(s => s.id === selectedStyle)?.name}
                  </span>
                  <div className="relative rounded-[20px] overflow-hidden bg-[#f5f5f7]">
                    <Image
                      src={generatedImage}
                      alt="Après"
                      width={600}
                      height={400}
                      className="w-full h-auto"
                    />
                    {/* Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-white/25 text-[28px] font-semibold tracking-[.15em] rotate-[-12deg]">
                        APERÇU
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
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-[14px] font-medium text-white bg-[#1d1d1f] hover:bg-black transition-colors"
                >
                  <Check className="w-4 h-4" strokeWidth={2} />
                  Obtenir en HD — 4,99 €
                </button>
              </div>

              {/* Info */}
              <p className="text-center text-[12px] text-[#86868b]">
                Version HD : sans filigrane, résolution 4K.
              </p>

              {/* New Generation */}
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
            © 2026 InstantDecor. Propulsé par Flux.1 ControlNet.
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
