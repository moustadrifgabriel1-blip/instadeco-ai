'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, ArrowRight, Sparkles, Shield, Zap, Star, Check, UserPlus, Gift, Share2, Mail, TreePine, Leaf, Wheat, Factory, Landmark, Sofa, BedDouble, CookingPot, ShowerHead, Briefcase, Utensils } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { FlashOffer } from '@/components/features/flash-offer';
import { ShareButtons } from '@/components/features/share-buttons';
import { SocialProofToast } from '@/components/features/social-proof-toast';
import { LeadCaptureLazy } from '@/components/features/lead-capture-lazy';
import { trackTrialStart, trackTrialComplete, trackLeadCaptured } from '@/lib/analytics/gtag';
import { compressImageToDataUrl } from '@/lib/image/compress-client';
import { TRIAL_MAX_GENERATIONS } from '@/src/shared/constants/trial';

// Compteur d'essais consommés côté client (UX immédiate ; la vraie limite est serveur).
const TRIAL_COUNT_KEY = 'instadeco_trial_count';
function readTrialCount(): number {
  try {
    const raw = localStorage.getItem(TRIAL_COUNT_KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    // Migration depuis l'ancien flag booléen (= 1 essai consommé).
    if (!raw && localStorage.getItem('instadeco_trial_used')) return 1;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

// Styles populaires pour l'essai (6 max)
const TRIAL_STYLES: { id: string; name: string; desc: string; Icon: LucideIcon }[] = [
  { id: 'moderne', name: 'Moderne', desc: 'Lignes épurées, élégance contemporaine', Icon: Sparkles },
  { id: 'scandinave', name: 'Scandinave', desc: 'Cocooning nordique lumineux', Icon: TreePine },
  { id: 'boheme', name: 'Bohème', desc: 'Chaleur éclectique colorée', Icon: Leaf },
  { id: 'japandi', name: 'Japandi', desc: 'Zen japonais et hygge nordique', Icon: Wheat },
  { id: 'industriel', name: 'Industriel', desc: 'Loft urbain brut et moderne', Icon: Factory },
  { id: 'classique', name: 'Classique', desc: 'Élégance traditionnelle française', Icon: Landmark },
];

const TRIAL_ROOMS: { id: string; name: string; Icon: LucideIcon }[] = [
  { id: 'salon', name: 'Salon', Icon: Sofa },
  { id: 'chambre', name: 'Chambre', Icon: BedDouble },
  { id: 'cuisine', name: 'Cuisine', Icon: CookingPot },
  { id: 'salle-de-bain', name: 'Salle de bain', Icon: ShowerHead },
  { id: 'bureau', name: 'Bureau', Icon: Briefcase },
  { id: 'salle-a-manger', name: 'Salle à manger', Icon: Utensils },
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
  const [step, setStep] = useState<'upload' | 'options' | 'generating' | 'result' | 'trial-used'>('upload');
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
  const [emailUnlocked, setEmailUnlocked] = useState(false);
  const [trialsUsed, setTrialsUsed] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);

  const remainingTrials = Math.max(0, TRIAL_MAX_GENERATIONS - trialsUsed);

  // Vérifier le quota d'essais déjà consommés (bypass si cookie dev)
  useEffect(() => {
    const isDevMode = document.cookie.includes('instadeco_dev=');
    if (isDevMode) {
      console.log('🔓 Dev mode actif, trial illimité');
      return; // Ne pas bloquer
    }
    const used = readTrialCount();
    setTrialsUsed(used);
    if (used >= TRIAL_MAX_GENERATIONS) {
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

  // Compresse + convertit le fichier en base64 (redimension ~1600px, JPEG ~0.85)
  // pour alléger le body POST. Fallback base64 brut géré en interne.
  const fileToBase64 = async (file: File): Promise<string> => {
    return compressImageToDataUrl(file);
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
            localStorage.setItem(TRIAL_COUNT_KEY, String(TRIAL_MAX_GENERATIONS));
            setTrialsUsed(TRIAL_MAX_GENERATIONS);
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
        // Incrémenter le compteur d'essais consommés (UX immédiate).
        const newUsed = readTrialCount() + 1;
        localStorage.setItem(TRIAL_COUNT_KEY, String(newUsed));
        setTrialsUsed(newUsed);
        trackTrialComplete(selectedStyle, selectedRoom);
        setTimeout(() => {
          // WOW MOMENT : on affiche le résultat EN CLAIR immédiatement (filigrane
          // InstaDeco présent). L'email devient optionnel (HD / sans filigrane).
          setStep('result');
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
    <div className="min-h-screen bg-background">
      {/* Navigation simplifiée */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-[var(--gold-line)]">
        <div className="max-w-[980px] mx-auto px-6 h-12 flex items-center justify-between">
          <Link href="/" className="prestige-display text-[21px] font-semibold tracking-[-0.01em] text-foreground">
            InstaDeco
          </Link>
          <Link
            href="/signup"
            className="text-xs font-medium text-[#0c0a09] bg-[var(--gold)] border border-[var(--gold)] px-4 py-1.5 rounded-full hover:bg-transparent hover:text-[var(--gold)] transition-colors"
          >
            Créer un compte gratuit
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-6 px-4 sm:pt-24 sm:pb-8 sm:px-6">
        <div className="max-w-[680px] mx-auto text-center">
          <div className="prestige-eyebrow inline-flex items-center gap-2 px-4 py-1.5 bg-[rgba(200,162,77,0.12)] border border-[var(--gold-line)] rounded-full mb-4">
            <Gift className="w-4 h-4" />
            Essai gratuit, sans inscription
          </div>
          <h1 className="prestige-display text-[26px] sm:text-[36px] md:text-[48px] font-semibold tracking-[-0.025em] text-foreground leading-[1.08]">
            Testez InstaDeco en 30 secondes
          </h1>
          <p className="mt-3 text-[15px] sm:text-[17px] md:text-[19px] text-muted-foreground font-normal leading-[1.4]">
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
                prestige-reveal relative rounded-[28px] border-2 border-dashed transition-all duration-300 cursor-pointer
                ${isDragActive
                  ? 'border-[var(--gold)] bg-[rgba(200,162,77,0.12)]'
                  : 'border-border hover:border-[var(--gold)] bg-card'
                }
              `}
            >
              <input {...getInputProps()} />
              <div className="py-14 px-4 sm:py-20 sm:px-8 text-center">
                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-[rgba(200,162,77,0.12)] border border-[var(--gold-line)] flex items-center justify-center">
                  <Plus className="w-7 h-7 text-[var(--gold)]" strokeWidth={1.5} />
                </div>
                <p className="prestige-display text-[17px] sm:text-[19px] text-foreground font-semibold tracking-[-0.01em]">
                  {isDragActive ? 'Déposez votre image ici' : 'Ajoutez une photo de votre pièce'}
                </p>
                <p className="mt-2 text-[14px] text-muted-foreground">
                  Glissez-déposez ou cliquez. PNG, JPG, WEBP. Max 10 Mo
                </p>
                <div className="mt-6 flex items-center justify-center gap-3 sm:gap-6 flex-wrap text-[12px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-[var(--gold)]" /> Résultat en 30s</span>
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-[var(--gold)]" /> 100% privé</span>
                  <span className="flex items-center gap-1"><Star className="w-3 h-3 text-[var(--gold)]" /> Gratuit</span>
                </div>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 2 : OPTIONS ── */}
          {step === 'options' && imagePreview && (
            <div className="space-y-8">
              {/* Aperçu de l'image */}
              <div className="prestige-reveal relative rounded-[20px] overflow-hidden bg-card border border-[var(--gold-line)] shadow-sm">
                <Image
                  src={imagePreview}
                  alt="Votre pièce, aperçu avant transformation"
                  width={800}
                  height={533}
                  className="w-full h-auto max-h-[400px] object-cover"
                  sizes="(max-width: 768px) 100vw, 672px"
                  unoptimized
                />
                <button
                  onClick={() => { setImageFile(null); setImagePreview(null); setStep('upload'); }}
                  className="absolute top-3 right-3 px-3 py-1.5 bg-background/90 backdrop-blur-md border border-[var(--gold-line)] rounded-full text-[12px] font-medium text-foreground hover:bg-background transition-colors shadow-sm"
                >
                  Changer de photo
                </button>
              </div>

              {/* Type de pièce */}
              <div className="prestige-reveal text-center" style={{ ['--reveal-d' as string]: '120ms' }}>
                <label className="prestige-eyebrow block mb-3">
                  Type de pièce
                </label>
                <div className="flex flex-wrap justify-center gap-2">
                  {TRIAL_ROOMS.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoom(room.id)}
                      className={`
                        px-4 py-2 rounded-full text-[14px] font-medium transition-all duration-200 border
                        ${selectedRoom === room.id
                          ? 'bg-[var(--gold)] border-[var(--gold)] text-[#0c0a09]'
                          : 'bg-card border-border text-foreground hover:border-[var(--gold-line)]'
                        }
                      `}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <room.Icon className="w-4 h-4" /> {room.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Style */}
              <div className="prestige-reveal text-center" style={{ ['--reveal-d' as string]: '240ms' }}>
                <label className="prestige-eyebrow block mb-3">
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
                          ? 'border-[var(--gold)] bg-[rgba(200,162,77,0.12)]'
                          : 'border-border bg-card hover:border-[var(--gold-line)]'
                        }
                      `}
                    >
                      <style.Icon className="w-6 h-6 text-[var(--gold)]" />
                      <p className={`prestige-display font-semibold text-[14px] mt-1 ${selectedStyle === style.id ? 'text-[var(--gold)]' : 'text-foreground'}`}>
                        {style.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{style.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Erreur */}
              {error && (
                <div className="text-center py-2" role="alert">
                  <p className="text-destructive text-[14px]">{error}</p>
                </div>
              )}

              {/* Bouton Générer */}
              <div className="prestige-reveal flex flex-col items-center pt-2 gap-3" style={{ ['--reveal-d' as string]: '360ms' }}>
                <button
                  onClick={handleGenerate}
                  className="group inline-flex items-center gap-2 bg-[var(--gold)] text-[#0c0a09] border border-[var(--gold)] px-8 py-4 rounded-full text-[17px] font-semibold hover:bg-transparent hover:text-[var(--gold)] transition-all duration-200 shadow-lg shadow-[var(--gold-soft)]/20 active:scale-95"
                >
                  <Sparkles className="w-5 h-5" />
                  Transformer ma pièce
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <span className="text-[12px] text-muted-foreground">
                  100% gratuit. {remainingTrials} essai{remainingTrials > 1 ? 's' : ''} disponible{remainingTrials > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 3 : GÉNÉRATION EN COURS ── */}
          {step === 'generating' && (
            <div className="flex flex-col items-center py-16">
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 rounded-full border-[3px] border-border" />
                <div className="absolute inset-0 rounded-full border-[3px] border-[var(--gold)] border-t-transparent animate-spin" />
                <div className="absolute inset-2 rounded-full border-[2px] border-[var(--gold-line)] border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-[var(--gold)]" />
                </div>
              </div>
              <p className="prestige-display text-[19px] text-foreground font-semibold tracking-[-0.01em]">
                {LOADING_MESSAGES.filter((m) => m.threshold <= Math.round(progress)).pop()?.text || 'Préparation...'}
              </p>
              <p className="mt-1 text-[15px] text-muted-foreground">{Math.round(progress)}%</p>
              <div
                className="w-56 h-[4px] bg-card rounded-full mt-5 overflow-hidden"
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
              <p className="mt-6 text-[12px] text-muted-foreground">
                Votre photo reste 100% privée
              </p>
            </div>
          )}

          {/* ── ÉTAPE 4 : RÉSULTAT (affiché EN CLAIR immédiatement) ── */}
          {step === 'result' && generatedImage && imagePreview && (
            <div ref={resultRef} className="space-y-8 scroll-mt-4">
              {/* Bandeau wow moment */}
              <div className="prestige-reveal text-center">
                <div className="prestige-eyebrow inline-flex items-center gap-2 px-4 py-1.5 bg-[rgba(200,162,77,0.12)] border border-[var(--gold-line)] rounded-full">
                  <Sparkles className="w-4 h-4" />
                  Voici votre transformation !
                </div>
              </div>

              {/* Avant / Après */}
              <div className="prestige-reveal grid md:grid-cols-2 gap-4" style={{ ['--reveal-d' as string]: '120ms' }}>
                <div className="space-y-2">
                  <span className="prestige-eyebrow block">
                    Avant
                  </span>
                  <div className="rounded-[16px] overflow-hidden bg-card border border-border">
                    <Image src={imagePreview} alt="Votre pièce avant transformation" width={600} height={400} className="w-full h-auto" sizes="(max-width: 768px) 100vw, 50vw" unoptimized />
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="prestige-eyebrow block">
                    Après, {selectedStyleInfo?.name}
                  </span>
                  <div className="relative rounded-[16px] overflow-hidden bg-card border border-[var(--gold-line)]">
                    <Image src={generatedImage} alt="Résultat après transformation IA" width={600} height={400} className="w-full h-auto" sizes="(max-width: 768px) 100vw, 50vw" />
                    {/* Scrim de lisibilité sous le filigrane */}
                    <div className="absolute inset-0 prestige-text-scrim pointer-events-none" aria-hidden="true" />
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

              {/* Nouvel essai si quota restant (sans recharger la page) */}
              {remainingTrials > 0 && (
                <div className="prestige-reveal text-center">
                  <button
                    onClick={() => {
                      setGeneratedImage(null);
                      setError(null);
                      setStep('options');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-2 bg-transparent text-[var(--gold)] border border-[var(--gold)] px-6 py-3 rounded-full text-[15px] font-semibold hover:bg-[var(--gold)] hover:text-[#0c0a09] transition-all active:scale-95"
                  >
                    <Sparkles className="w-4 h-4" />
                    Essayer un autre style. {remainingTrials} essai{remainingTrials > 1 ? 's' : ''} restant{remainingTrials > 1 ? 's' : ''}
                  </button>
                </div>
              )}

              {/* Email OPTIONNEL, débloque le HD sans filigrane (pas un gate) */}
              {!emailUnlocked ? (
                <div className="prestige-reveal bg-card rounded-[20px] border border-[var(--gold-line)] p-5 sm:p-6 shadow-sm">
                  <div className="flex items-center justify-center gap-2 mb-1.5">
                    <Mail className="w-4 h-4 text-[var(--gold)]" />
                    <span className="prestige-display text-[15px] font-semibold text-foreground">Recevez votre image en <span className="text-[var(--gold)]">HD</span>, sans filigrane</span>
                  </div>
                  <p className="text-[13px] text-muted-foreground text-center mb-4">
                    Entrez votre email pour télécharger la version haute définition (optionnel) et recevez <span className="font-semibold text-[var(--gold)]">3 crédits offerts</span>.
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
                            source: 'trial_hd_unlock',
                            metadata: { style: selectedStyle, room: selectedRoom },
                          }),
                        });
                        trackLeadCaptured('trial_hd_unlock');
                        localStorage.setItem('trial_lead_email', trialEmail);
                        setEmailUnlocked(true);
                        setEmailStatus('idle');
                      } catch {
                        setEmailError('Erreur, réessayez');
                        setEmailStatus('error');
                      }
                    }}
                    className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
                  >
                    <input
                      type="email"
                      value={trialEmail}
                      onChange={(e) => { setTrialEmail(e.target.value); setEmailStatus('idle'); }}
                      placeholder="votre@email.com"
                      className="flex-1 px-4 py-3 rounded-xl bg-background border border-border focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold-soft)]/20 outline-none transition-all text-foreground placeholder:text-muted-foreground text-[15px]"
                      required
                    />
                    <button
                      type="submit"
                      disabled={emailStatus === 'loading'}
                      className="inline-flex items-center justify-center gap-2 bg-[var(--gold)] text-[#0c0a09] border border-[var(--gold)] px-5 py-3 rounded-xl text-[15px] font-semibold hover:bg-transparent hover:text-[var(--gold)] transition-all disabled:opacity-50"
                    >
                      {emailStatus === 'loading' ? (
                        <div className="w-5 h-5 border-2 border-[#0c0a09]/30 border-t-[#0c0a09] rounded-full animate-spin" />
                      ) : (
                        <>Débloquer le HD</>
                      )}
                    </button>
                  </form>
                  {emailStatus === 'error' && (
                    <p className="text-destructive text-[12px] text-center mt-2">{emailError}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground text-center mt-2">
                    Pas de spam. Désinscription en 1 clic.
                  </p>
                </div>
              ) : (
                <div className="prestige-reveal bg-[rgba(16,185,129,0.10)] rounded-[20px] border border-emerald-500/30 p-4 text-center">
                  <p className="text-[14px] font-semibold text-emerald-400 flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" />
                    Version HD envoyée, vérifiez votre boîte mail.
                  </p>
                </div>
              )}

              {/* Partage, Encourager la viralité */}
              <div className="prestige-reveal bg-card rounded-[20px] border border-[var(--gold-line)] p-5 text-center shadow-sm">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Share2 className="w-4 h-4 text-[var(--gold)]" />
                  <span className="prestige-display text-[14px] font-semibold text-foreground">Montrez votre transformation à vos proches</span>
                </div>
                <ShareButtons
                  url="https://instadeco.app/essai"
                  title={`Regardez ma transformation déco en style ${selectedStyleInfo?.name} ! 🏠✨ Testez gratuitement :`}
                  description="J'ai transformé ma pièce avec l'IA en 30 secondes. Testez gratuitement !"
                  imageUrl={generatedImage}
                  variant="inline"
                />
              </div>

              {/* OFFRE FLASH, Conversion immédiate */}
              <FlashOffer
                stripePaymentUrl="/signup?redirect=/pricing"
                durationMinutes={15}
                originalPrice="9,90 €"
                flashPrice="4,99 €"
                credits={10}
              />

              {/* OU Créer un compte gratuit */}
              <div className="bg-[var(--stone-900)] rounded-[24px] border border-[var(--gold-line)] p-6 sm:p-8 text-center">
                <p className="prestige-eyebrow mb-3">Ou bien</p>
                <h2 className="prestige-display text-[22px] sm:text-[26px] font-bold text-foreground tracking-[-0.02em]">
                  Créez votre compte gratuit
                </h2>
                <p className="mt-2 text-[15px] text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Recevez <span className="font-bold text-[var(--gold)]">3 crédits offerts</span> pour transformer d&apos;autres pièces.
                </p>

                <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/signup"
                    className="group inline-flex items-center gap-2 bg-[var(--gold)] text-[#0c0a09] border border-[var(--gold)] px-7 py-3.5 rounded-full text-[15px] font-semibold hover:bg-transparent hover:text-[var(--gold)] transition-all duration-200 shadow-lg active:scale-95"
                  >
                    <UserPlus className="w-4 h-4" />
                    Créer mon compte, c&apos;est gratuit
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-[12px] text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> 3 crédits offerts</span>
                  <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Sans engagement</span>
                  <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> 20+ styles</span>
                </div>
              </div>

              {/* Stats en bas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
                <div className="text-center p-4 rounded-2xl bg-card border border-border">
                  <p className="prestige-display text-[20px] sm:text-[24px] font-bold text-[var(--gold)]">0,99 €</p>
                  <p className="text-[12px] text-muted-foreground mt-1">par transformation</p>
                </div>
                <div className="text-center p-4 rounded-2xl bg-card border border-border">
                  <p className="prestige-display text-[20px] sm:text-[24px] font-bold text-foreground">30s</p>
                  <p className="text-[12px] text-muted-foreground mt-1">temps de rendu</p>
                </div>
                <div className="text-center p-4 rounded-2xl bg-card border border-border">
                  <p className="prestige-display text-[20px] sm:text-[24px] font-bold text-foreground">20+</p>
                  <p className="text-[12px] text-muted-foreground mt-1">styles disponibles</p>
                </div>
              </div>
            </div>
          )}

          {/* ── ESSAI DÉJÀ UTILISÉ ── */}
          {step === 'trial-used' && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-[rgba(200,162,77,0.12)] border border-[var(--gold-line)] flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-[var(--gold)]" />
              </div>
              <h2 className="prestige-display text-[22px] sm:text-[28px] md:text-[32px] font-bold text-foreground tracking-[-0.02em]">
                Votre essai gratuit est terminé
              </h2>
              <p className="mt-3 text-[17px] text-muted-foreground max-w-md mx-auto leading-relaxed">
                Vous avez déjà utilisé votre essai gratuit. Créez un compte pour obtenir <span className="font-bold text-[var(--gold)]">3 crédits offerts</span> et continuer à transformer vos pièces.
              </p>

              <div className="mt-8 flex flex-col items-center gap-4">
                <Link
                  href="/signup"
                  className="group inline-flex items-center gap-2 bg-[var(--gold)] text-[#0c0a09] border border-[var(--gold)] px-8 py-4 rounded-full text-[17px] font-semibold hover:bg-transparent hover:text-[var(--gold)] transition-all duration-200 shadow-lg shadow-[var(--gold-soft)]/20 active:scale-95"
                >
                  <UserPlus className="w-5 h-5" />
                  Créer mon compte, 3 crédits offerts
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/pricing"
                  className="text-[14px] text-muted-foreground hover:text-foreground transition-colors underline"
                >
                  Voir les tarifs
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[12px] sm:text-[13px] text-muted-foreground">
                <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> 3 crédits offerts</span>
                <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> Sans engagement</span>
                <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> 0,99 €/transformation</span>
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
