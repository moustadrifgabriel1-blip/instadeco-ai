'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, ArrowRight, Sparkles, Shield, Zap, Star, Check, UserPlus, Gift, Share2, Mail } from 'lucide-react';
import { FlashOffer } from '@/components/features/flash-offer';
import { ShareButtons } from '@/components/features/share-buttons';
import { SocialProofToast } from '@/components/features/social-proof-toast';
import { LeadCaptureLazy } from '@/components/features/lead-capture-lazy';
import { trackTrialStart, trackTrialComplete, trackLeadCaptured } from '@/lib/analytics/gtag';

// Styles populaires pour l'essai (6 max)
const TRIAL_STYLES = [
  { id: 'moderne', name: 'Moderne', desc: 'Lignes épurées, élégance contemporaine', icon: '✨' },
  { id: 'scandinave', name: 'Scandinave', desc: 'Cocooning nordique lumineux', icon: '🪵' },
  { id: 'boheme', name: 'Bohème', desc: 'Chaleur éclectique colorée', icon: '🌿' },
  { id: 'japandi', name: 'Japandi', desc: 'Zen japonais & hygge nordique', icon: '🎋' },
  { id: 'industriel', name: 'Industriel', desc: 'Loft urbain brut et moderne', icon: '🏭' },
  { id: 'classique', name: 'Classique', desc: 'Élégance traditionnelle française', icon: '🏛️' },
];

const TRIAL_ROOMS = [
  { id: 'salon', name: 'Salon', icon: '🛋️' },
  { id: 'chambre', name: 'Chambre', icon: '🛏️' },
  { id: 'cuisine', name: 'Cuisine', icon: '🍳' },
  { id: 'salle-de-bain', name: 'Salle de bain', icon: '🚿' },
  { id: 'bureau', name: 'Bureau', icon: '💼' },
  { id: 'salle-a-manger', name: 'Salle à manger', icon: '🍽️' },
];

const LOADING_MESSAGES = [
  { threshold: 0, text: 'Analyse de votre pièce...' },
  { threshold: 15, text: 'Identification de la structure...' },
  { threshold: 30, text: 'Application du style choisi...' },
  { threshold: 50, text: 'Génération des détails...' },
  { threshold: 70, text: 'Ajout des finitions...' },
  { threshold: 85, text: 'Peaufinage du rendu...' },
  { threshold: 95, text: 'Presque terminé...' },
];

export default function EssaiPage() {
  const [step, setStep] = useState<'upload' | 'options' | 'generating' | 'email-gate' | 'result' | 'trial-used'>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('moderne');
  const [selectedRoom, setSelectedRoom] = useState('salon');
  const [progress, setProgress] = useState(0);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trialEmail, setTrialEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [emailError, setEmailError] = useState('');
  const resultRef = useRef<HTMLDivElement>(null);

  // Vérifier si l'essai a déjà été utilisé (bypass si cookie dev)
  useEffect(() => {
    const isDevMode = document.cookie.includes('instadeco_dev=');
    if (isDevMode) {
      console.log('🔓 Dev mode actif — trial illimité');
      return; // Ne pas bloquer
    }
    const trialUsed = localStorage.getItem('instadeco_trial_used');
    if (trialUsed) {
      setStep('trial-used');
    }
  }, []);

  // Upload handler
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Révoquer l'ancien blob URL si existant
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setStep('options');
      setError(null);
    }
  }, [imagePreview]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  // Convertir fichier en base64
  const fileToBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Générer un fingerprint navigateur simple (non-invasif, basé sur des données publiques)
  const getFingerprint = useCallback((): string => {
    try {
      const components = [
        navigator.language,
        screen.width + 'x' + screen.height,
        screen.colorDepth,
        new Date().getTimezoneOffset(),
        navigator.hardwareConcurrency || 0,
        navigator.maxTouchPoints || 0,
        // Canvas fingerprint léger
        (() => {
          try {
            const c = document.createElement('canvas');
            const ctx = c.getContext('2d');
            if (!ctx) return '0';
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillText('fp', 2, 2);
            return c.toDataURL().slice(-32);
          } catch { return '0'; }
        })(),
      ].join('|');
      // Simple hash
      let hash = 0;
      for (let i = 0; i < components.length; i++) {
        const char = components.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
      }
      return Math.abs(hash).toString(36);
    } catch {
      return '';
    }
  }, []);

  // Lancer la génération
  const handleGenerate = async () => {
    if (!imageFile) return;

    setStep('generating');
    setProgress(0);
    setError(null);
    trackTrialStart(selectedStyle, selectedRoom);

    try {
      // Convertir en base64
      const imageBase64 = await fileToBase64(imageFile);
      const fingerprint = getFingerprint();

      console.log(`[Trial] 🚀 Starting generation: style=${selectedStyle}, room=${selectedRoom}, fingerprint=${fingerprint.substring(0, 8)}...`);

      // Animer la barre de progression pendant l'appel
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          const remaining = 90 - prev;
          const increment = Math.max(0.3, remaining / 40);
          return prev + increment;
        });
      }, 300);

      try {
        // Appeler l'API trial (appel synchrone, retourne l'image directement)
        const response = await fetch('/api/trial/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64,
            roomType: selectedRoom,
            style: selectedStyle,
            fingerprint,
          }),
        });

        const data = await response.json();
        console.log(`[Trial] 📡 Generate API response:`, data);

        if (!response.ok) {
          console.error(`[Trial] ❌ Generate API error: ${response.status}`, data);
          if (data.code === 'TRIAL_USED') {
            localStorage.setItem('instadeco_trial_used', 'true');
            clearInterval(progressInterval);
            setStep('trial-used');
            return;
          }
          throw new Error(data.error || 'Erreur lors de la génération');
        }

        // L'API retourne directement l'image (appel synchrone fal.ai)
        const { imageUrl } = data;

        if (!imageUrl) {
          console.error(`[Trial] ❌ No imageUrl in response:`, data);
          throw new Error('Pas d\'image retournée par le serveur');
        }

        console.log(`[Trial] ✅ Generation completed! Image: ${imageUrl.substring(0, 50)}...`);
        clearInterval(progressInterval);
        setProgress(100);
        setGeneratedImage(imageUrl);
        localStorage.setItem('instadeco_trial_used', 'true');
        trackTrialComplete(selectedStyle, selectedRoom);
        setTimeout(() => {
          setStep('email-gate');
          // Auto-scroll vers le résultat après changement d'étape
          setTimeout(() => {
            resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }, 500);
      } catch (innerErr) {
        clearInterval(progressInterval);
        throw innerErr;
      }
    } catch (err: any) {
      console.error(`[Trial] ❌ Generation error:`, err);
      setError(err.message || 'Erreur inattendue');
      setStep('options');
    }
  };

  const selectedStyleInfo = TRIAL_STYLES.find((s) => s.id === selectedStyle);

  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      {/* Navigation simplifiée */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#fbfbfd]/80 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-[980px] mx-auto px-6 h-12 flex items-center justify-between">
          <Link href="/" className="text-[21px] font-semibold tracking-[-0.01em] text-[#1d1d1f]">
            InstaDeco
          </Link>
          <Link
            href="/signup"
            className="text-xs font-medium text-[#fbfbfd] bg-[#E07B54] px-4 py-1.5 rounded-full hover:bg-[#d06a45] transition-colors"
          >
            Créer un compte gratuit
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-6 px-4 sm:pt-24 sm:pb-8 sm:px-6">
        <div className="max-w-[680px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#FFF3ED] text-[#E07B54] rounded-full text-sm font-medium mb-4">
            <Gift className="w-4 h-4" />
            Essai gratuit — Sans inscription
          </div>
          <h1 className="text-[26px] sm:text-[36px] md:text-[48px] font-semibold tracking-[-0.025em] text-[#1d1d1f] leading-[1.08]">
            Testez InstaDeco en 30 secondes
          </h1>
          <p className="mt-3 text-[15px] sm:text-[17px] md:text-[19px] text-[#636366] font-normal leading-[1.4]">
            Uploadez une photo de votre pièce, choisissez un style, et découvrez la magie de l&apos;IA.
          </p>
        </div>
      </section>

      {/* Contenu principal */}
      <section className="pb-12 px-4 sm:pb-20 sm:px-6">
        <div className="max-w-[800px] mx-auto">

          {/* ── ÉTAPE 1 : UPLOAD ── */}
          {step === 'upload' && (
            <div
              {...getRootProps()}
              className={`
                relative rounded-[28px] border-2 border-dashed transition-all duration-300 cursor-pointer
                ${isDragActive
                  ? 'border-[#E07B54] bg-[#FFF3ED]'
                  : 'border-[#d2d2d7] hover:border-[#E07B54] bg-white'
                }
              `}
            >
              <input {...getInputProps()} />
              <div className="py-14 px-4 sm:py-20 sm:px-8 text-center">
                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-[#FFF3ED] flex items-center justify-center">
                  <Plus className="w-7 h-7 text-[#E07B54]" strokeWidth={1.5} />
                </div>
                <p className="text-[17px] sm:text-[19px] text-[#1d1d1f] font-semibold tracking-[-0.01em]">
                  {isDragActive ? 'Déposez votre image ici' : 'Ajoutez une photo de votre pièce'}
                </p>
                <p className="mt-2 text-[14px] text-[#636366]">
                  Glissez-déposez ou cliquez — PNG, JPG, WEBP — Max 10 Mo
                </p>
                <div className="mt-6 flex items-center justify-center gap-3 sm:gap-6 flex-wrap text-[12px] text-[#636366]">
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Résultat en 30s</span>
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> 100% privé</span>
                  <span className="flex items-center gap-1"><Star className="w-3 h-3" /> Gratuit</span>
                </div>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 2 : OPTIONS ── */}
          {step === 'options' && imagePreview && (
            <div className="space-y-8">
              {/* Aperçu de l'image */}
              <div className="relative rounded-[20px] overflow-hidden bg-[#f5f5f7] shadow-sm">
                <Image
                  src={imagePreview}
                  alt="Votre pièce — aperçu avant transformation"
                  width={800}
                  height={533}
                  className="w-full h-auto max-h-[400px] object-cover"
                  sizes="(max-width: 768px) 100vw, 672px"
                  unoptimized
                />
                <button
                  onClick={() => { setImageFile(null); setImagePreview(null); setStep('upload'); }}
                  className="absolute top-3 right-3 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[12px] font-medium text-[#1d1d1f] hover:bg-white transition-colors shadow-sm"
                >
                  Changer de photo
                </button>
              </div>

              {/* Type de pièce */}
              <div className="text-center">
                <label className="block text-[12px] font-semibold text-[#636366] uppercase tracking-[.1em] mb-3">
                  Type de pièce
                </label>
                <div className="flex flex-wrap justify-center gap-2">
                  {TRIAL_ROOMS.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoom(room.id)}
                      className={`
                        px-4 py-2 rounded-full text-[14px] font-medium transition-all duration-200
                        ${selectedRoom === room.id
                          ? 'bg-[#1d1d1f] text-white'
                          : 'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]'
                        }
                      `}
                    >
                      <span className="mr-1">{room.icon}</span> {room.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Style */}
              <div className="text-center">
                <label className="block text-[12px] font-semibold text-[#636366] uppercase tracking-[.1em] mb-3">
                  Style de décoration
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl mx-auto">
                  {TRIAL_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`
                        p-4 rounded-2xl text-left transition-all duration-200 border-2
                        ${selectedStyle === style.id
                          ? 'border-[#E07B54] bg-[#FFF3ED]'
                          : 'border-transparent bg-[#f5f5f7] hover:bg-[#e8e8ed]'
                        }
                      `}
                    >
                      <span className="text-2xl">{style.icon}</span>
                      <p className={`font-semibold text-[14px] mt-1 ${selectedStyle === style.id ? 'text-[#E07B54]' : 'text-[#1d1d1f]'}`}>
                        {style.name}
                      </p>
                      <p className="text-[11px] text-[#636366] mt-0.5">{style.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Erreur */}
              {error && (
                <div className="text-center py-2" role="alert">
                  <p className="text-red-500 text-[14px]">{error}</p>
                </div>
              )}

              {/* Bouton Générer */}
              <div className="flex flex-col items-center pt-2 gap-3">
                <button
                  onClick={handleGenerate}
                  className="group inline-flex items-center gap-2 bg-[#E07B54] text-white px-8 py-4 rounded-full text-[17px] font-semibold hover:bg-[#d06a45] transition-all duration-200 shadow-lg shadow-[#E07B54]/20 active:scale-95"
                >
                  <Sparkles className="w-5 h-5" />
                  Transformer ma pièce
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <span className="text-[12px] text-[#636366]">
                  100% gratuit — 1 essai disponible
                </span>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 3 : GÉNÉRATION EN COURS ── */}
          {step === 'generating' && (
            <div className="flex flex-col items-center py-16">
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 rounded-full border-[3px] border-[#f5f5f7]" />
                <div className="absolute inset-0 rounded-full border-[3px] border-[#E07B54] border-t-transparent animate-spin" />
                <div className="absolute inset-2 rounded-full border-[2px] border-[#E07B54]/20 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-[#E07B54]" />
                </div>
              </div>
              <p className="text-[19px] text-[#1d1d1f] font-semibold tracking-[-0.01em]">
                {LOADING_MESSAGES.filter((m) => m.threshold <= Math.round(progress)).pop()?.text || 'Préparation...'}
              </p>
              <p className="mt-1 text-[15px] text-[#636366]">{Math.round(progress)}%</p>
              <div
                className="w-56 h-[4px] bg-[#f5f5f7] rounded-full mt-5 overflow-hidden"
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progression de la génération"
              >
                <div
                  className="h-full bg-gradient-to-r from-[#E07B54] to-[#e8956e] rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.round(progress)}%` }}
                />
              </div>
              <p className="mt-6 text-[12px] text-[#636366]">
                Votre photo reste 100% privée
              </p>
            </div>
          )}

          {/* ── ÉTAPE 3.5 : EMAIL GATE (avant le résultat) ── */}
          {step === 'email-gate' && generatedImage && (
            <div ref={resultRef} className="flex flex-col items-center py-12 scroll-mt-4">
              <div className="max-w-md w-full bg-white rounded-[28px] border border-black/5 shadow-xl overflow-hidden">
                {/* Preview floutée */}
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={generatedImage}
                    alt="Aperçu du résultat (flouté)"
                    width={600}
                    height={300}
                    className="w-full h-full object-cover blur-lg scale-110"
                    sizes="(max-width: 768px) 100vw, 448px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/80" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-md rounded-2xl px-6 py-3 shadow-lg">
                      <p className="text-[15px] font-bold text-[#1d1d1f] flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#E07B54]" />
                        Votre résultat est prêt !
                      </p>
                    </div>
                  </div>
                </div>

                {/* Formulaire email */}
                <div className="p-6 sm:p-8">
                  <h2 className="text-[22px] font-bold text-[#1d1d1f] text-center mb-2">
                    Entrez votre email pour voir le résultat
                  </h2>
                  <p className="text-[14px] text-[#636366] text-center mb-6">
                    Recevez aussi <span className="font-semibold text-[#E07B54]">3 crédits offerts</span> pour transformer d&apos;autres pièces.
                  </p>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!trialEmail || emailStatus === 'loading') return;
                      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trialEmail)) {
                        setEmailError('Email invalide');
                        setEmailStatus('error');
                        return;
                      }
                      setEmailStatus('loading');
                      setEmailError('');
                      try {
                        await fetch('/api/v2/leads', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            email: trialEmail,
                            source: 'trial_email_gate',
                            metadata: { style: selectedStyle, room: selectedRoom },
                          }),
                        });
                        trackLeadCaptured('trial_email_gate');
                        localStorage.setItem('trial_lead_email', trialEmail);
                        setStep('result');
                        setTimeout(() => {
                          resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                      } catch {
                        setEmailError('Erreur, réessayez');
                        setEmailStatus('error');
                      }
                    }}
                    className="space-y-3"
                  >
                    <input
                      type="email"
                      value={trialEmail}
                      onChange={(e) => { setTrialEmail(e.target.value); setEmailStatus('idle'); }}
                      placeholder="votre@email.com"
                      className="w-full px-4 py-3.5 rounded-xl border border-[#d2d2d7] focus:border-[#E07B54] focus:ring-2 focus:ring-[#E07B54]/20 outline-none transition-all text-[#1d1d1f] text-[15px]"
                      required
                      autoFocus
                    />
                    {emailStatus === 'error' && (
                      <p className="text-red-500 text-[12px]">{emailError}</p>
                    )}
                    <button
                      type="submit"
                      disabled={emailStatus === 'loading'}
                      className="w-full group inline-flex items-center justify-center gap-2 bg-[#E07B54] text-white px-6 py-3.5 rounded-xl text-[16px] font-semibold hover:bg-[#d06a45] transition-all disabled:opacity-50 shadow-lg shadow-[#E07B54]/20"
                    >
                      {emailStatus === 'loading' ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Mail className="w-5 h-5" />
                          Voir mon résultat
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </form>

                  <button
                    onClick={() => {
                      setStep('result');
                      setTimeout(() => {
                        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 100);
                    }}
                    className="w-full mt-3 text-[12px] text-[#636366] hover:text-[#1d1d1f] transition-colors py-2"
                  >
                    Passer →
                  </button>

                  <p className="text-[11px] text-[#aaa] text-center mt-3">
                    Pas de spam. Désinscription en 1 clic.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 4 : RÉSULTAT ── */}
          {step === 'result' && generatedImage && imagePreview && (
            <div ref={step === 'result' ? resultRef : undefined} className="space-y-8 scroll-mt-4">
              {/* Avant / Après */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="block text-[12px] font-semibold text-[#636366] uppercase tracking-[.1em]">
                    Avant
                  </span>
                  <div className="rounded-[16px] overflow-hidden bg-[#f5f5f7]">
                    <Image src={imagePreview} alt="Votre pièce avant transformation" width={600} height={400} className="w-full h-auto" sizes="(max-width: 768px) 100vw, 50vw" unoptimized />
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="block text-[12px] font-semibold text-[#636366] uppercase tracking-[.1em]">
                    Après — {selectedStyleInfo?.name}
                  </span>
                  <div className="relative rounded-[16px] overflow-hidden bg-[#f5f5f7]">
                    <Image src={generatedImage} alt="Résultat après transformation IA" width={600} height={400} className="w-full h-auto" sizes="(max-width: 768px) 100vw, 50vw" />
                    {/* Filigrane */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span
                        className="text-white/30 text-[36px] md:text-[52px] font-bold tracking-[.08em] rotate-[-15deg] select-none"
                        style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.2)' }}
                      >
                        InstaDeco
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Partage — Encourager la viralité */}
              <div className="bg-white rounded-[20px] border border-black/5 p-5 text-center shadow-sm">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Share2 className="w-4 h-4 text-[#E07B54]" />
                  <span className="text-[14px] font-semibold text-[#1d1d1f]">Montrez votre transformation à vos proches</span>
                </div>
                <ShareButtons
                  url="https://instadeco.app/essai"
                  title={`Regardez ma transformation déco en style ${selectedStyleInfo?.name} ! 🏠✨ Testez gratuitement :`}
                  description="J'ai transformé ma pièce avec l'IA en 30 secondes. Testez gratuitement !"
                  imageUrl={generatedImage}
                  variant="inline"
                />
              </div>

              {/* OFFRE FLASH — Conversion immédiate */}
              <FlashOffer
                stripePaymentUrl="/signup?redirect=/pricing"
                durationMinutes={15}
                originalPrice="9,90 €"
                flashPrice="4,99 €"
                credits={10}
              />

              {/* OU Créer un compte gratuit */}
              <div className="bg-gradient-to-br from-[#FFF8F5] to-[#FFF0E8] rounded-[24px] border border-[#F0E6E0] p-6 sm:p-8 text-center">
                <p className="text-[13px] font-medium text-[#636366] uppercase tracking-wider mb-3">Ou bien</p>
                <h2 className="text-[22px] sm:text-[26px] font-bold text-[#1d1d1f] tracking-[-0.02em]">
                  Créez votre compte gratuit
                </h2>
                <p className="mt-2 text-[15px] text-[#6B6B6B] max-w-md mx-auto leading-relaxed">
                  Recevez <span className="font-bold text-[#E07B54]">3 crédits offerts</span> pour transformer d&apos;autres pièces.
                </p>

                <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/signup"
                    className="group inline-flex items-center gap-2 bg-[#1d1d1f] text-white px-7 py-3.5 rounded-full text-[15px] font-semibold hover:bg-[#333] transition-all duration-200 shadow-lg active:scale-95"
                  >
                    <UserPlus className="w-4 h-4" />
                    Créer mon compte — c&apos;est gratuit
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-[12px] text-[#636366]">
                  <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-green-500" /> 3 crédits offerts</span>
                  <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-green-500" /> Sans engagement</span>
                  <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-green-500" /> 20+ styles</span>
                </div>
              </div>

              {/* Stats en bas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
                <div className="text-center p-4 rounded-2xl bg-white border border-black/5">
                  <p className="text-[20px] sm:text-[24px] font-bold text-[#E07B54]">0,99 €</p>
                  <p className="text-[12px] text-[#636366] mt-1">par transformation</p>
                </div>
                <div className="text-center p-4 rounded-2xl bg-white border border-black/5">
                  <p className="text-[20px] sm:text-[24px] font-bold text-[#1d1d1f]">30s</p>
                  <p className="text-[12px] text-[#636366] mt-1">temps de rendu</p>
                </div>
                <div className="text-center p-4 rounded-2xl bg-white border border-black/5">
                  <p className="text-[20px] sm:text-[24px] font-bold text-[#1d1d1f]">20+</p>
                  <p className="text-[12px] text-[#636366] mt-1">styles disponibles</p>
                </div>
              </div>
            </div>
          )}

          {/* ── ESSAI DÉJÀ UTILISÉ ── */}
          {step === 'trial-used' && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-[#FFF3ED] flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-[#E07B54]" />
              </div>
              <h2 className="text-[22px] sm:text-[28px] md:text-[32px] font-bold text-[#1d1d1f] tracking-[-0.02em]">
                Votre essai gratuit est terminé
              </h2>
              <p className="mt-3 text-[17px] text-[#636366] max-w-md mx-auto leading-relaxed">
                Vous avez déjà utilisé votre essai gratuit. Créez un compte pour obtenir <span className="font-bold text-[#E07B54]">3 crédits offerts</span> et continuer à transformer vos pièces.
              </p>

              <div className="mt-8 flex flex-col items-center gap-4">
                <Link
                  href="/signup"
                  className="group inline-flex items-center gap-2 bg-[#E07B54] text-white px-8 py-4 rounded-full text-[17px] font-semibold hover:bg-[#d06a45] transition-all duration-200 shadow-lg shadow-[#E07B54]/20 active:scale-95"
                >
                  <UserPlus className="w-5 h-5" />
                  Créer mon compte — 3 crédits offerts
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/pricing"
                  className="text-[14px] text-[#636366] hover:text-[#1d1d1f] transition-colors underline"
                >
                  Voir les tarifs
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[12px] sm:text-[13px] text-[#636366]">
                <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-500" /> 3 crédits offerts</span>
                <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-500" /> Sans engagement</span>
                <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-500" /> 0,99 €/transformation</span>
              </div>
            </div>
          )}
        </div>
      </section>
      <SocialProofToast initialDelay={5000} interval={20000} maxNotifications={5} />
      {/* Exit-intent popup pour capturer les emails avant départ */}
      <LeadCaptureLazy variant="popup" delay={30000} />
    </div>
  );
}
