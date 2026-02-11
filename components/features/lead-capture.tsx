'use client';

import { useState, useEffect } from 'react';
import { X, Gift, ArrowRight, Sparkles } from 'lucide-react';

interface LeadCaptureProps {
  /** Délai avant affichage (ms). Par défaut 8s */
  delay?: number;
  /** Variante : 'banner' fixe en bas ou 'popup' centré */
  variant?: 'banner' | 'popup';
}

/**
 * Composant de capture d'email avec lead magnet (3 crédits gratuits)
 * 
 * Apparaît après un délai ou quand l'utilisateur s'apprête à quitter.
 * Se souvient du choix via localStorage pour ne pas harceler.
 */
export function LeadCapture({ delay = 8000, variant = 'banner' }: LeadCaptureProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Ne pas afficher si déjà vu ou déjà inscrit
    if (typeof window === 'undefined') return;
    const dismissed = localStorage.getItem('lead_capture_dismissed');
    const submitted = localStorage.getItem('lead_capture_submitted');
    if (dismissed || submitted) return;

    // Timer de délai
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    // Exit intent (desktop uniquement)
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        setIsVisible(true);
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [delay]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('lead_capture_dismissed', Date.now().toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === 'loading') return;

    // Validation email basique
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg('Email invalide');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/v2/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'lead_capture' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur');
      }

      setStatus('success');
      localStorage.setItem('lead_capture_submitted', Date.now().toString());
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Une erreur est survenue');
      setStatus('error');
    }
  };

  if (!isVisible) return null;

  // ===== VARIANTE POPUP =====
  if (variant === 'popup') {
    return (
      <>
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-300"
          onClick={handleDismiss}
        />
        {/* Popup */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="lead-capture-title"
          className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[480px] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 duration-300"
          onKeyDown={(e) => { if (e.key === 'Escape') handleDismiss(); }}
        >
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors z-10"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>

          {/* Header gradient */}
          <div className="bg-gradient-to-br from-[#E07B54] to-[#D4603C] p-8 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8" />
            </div>
            <h3 id="lead-capture-title" className="text-2xl font-bold mb-2">3 crédits offerts</h3>
            <p className="text-white/80 text-sm">
              Testez la transformation IA de votre intérieur
            </p>
          </div>

          {/* Body */}
          <div className="p-8">
            {status === 'success' ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">C&apos;est parti !</h4>
                <p className="text-gray-600 text-sm">
                  Vos 3 crédits gratuits vous attendent.
                  <br />Créez votre compte pour les utiliser.
                </p>
                <a
                  href="/signup"
                  className="inline-flex items-center gap-2 bg-[#E07B54] text-white px-6 py-3 rounded-full font-semibold mt-4 hover:bg-[#D4603C] transition-colors"
                >
                  Créer mon compte <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <>
                <p className="text-gray-600 text-sm text-center mb-6">
                  Entrez votre email pour recevoir vos 3 crédits gratuits
                  et des idées déco exclusives.
                </p>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }}
                    placeholder="votre@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#E07B54] focus:ring-2 focus:ring-[#E07B54]/20 outline-none transition-all text-gray-900"
                    required
                  />
                  {status === 'error' && (
                    <p className="text-red-500 text-xs">{errorMsg}</p>
                  )}
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full bg-[#E07B54] hover:bg-[#D4603C] text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {status === 'loading' ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Recevoir mes 3 crédits gratuits <Gift className="w-4 h-4" /></>
                    )}
                  </button>
                </form>
                <p className="text-xs text-gray-400 text-center mt-4">
                  Pas de spam. Désinscription en 1 clic.
                </p>
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  // ===== VARIANTE BANNER =====
  return (
    <div className="fixed bottom-0 inset-x-0 z-50 animate-in slide-in-from-bottom duration-500">
      <div className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] border-t border-[#E07B54]/30 shadow-2xl">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center gap-4">
          {/* Close */}
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 sm:static p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>

          {/* Texte */}
          <div className="flex items-center gap-3 flex-1">
            <div className="hidden sm:flex w-10 h-10 bg-[#E07B54]/20 rounded-full items-center justify-center flex-shrink-0">
              <Gift className="w-5 h-5 text-[#E07B54]" />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-white font-semibold text-sm">
                <span className="text-[#E07B54]">3 crédits offerts</span> — Testez la transformation IA de votre intérieur
              </p>
            </div>
          </div>

          {/* Formulaire */}
          {status === 'success' ? (
            <a
              href="/signup"
              className="inline-flex items-center gap-2 bg-[#E07B54] text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[#D4603C] transition-colors whitespace-nowrap"
            >
              Créer mon compte <ArrowRight className="w-4 h-4" />
            </a>
          ) : (
            <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }}
                placeholder="votre@email.com"
                className="px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-white placeholder-gray-400 text-sm focus:border-[#E07B54] focus:ring-1 focus:ring-[#E07B54] outline-none w-full sm:w-56"
                required
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="bg-[#E07B54] hover:bg-[#D4603C] text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all disabled:opacity-50 whitespace-nowrap flex items-center gap-1.5"
              >
                {status === 'loading' ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>OK <ArrowRight className="w-3.5 h-3.5" /></>
                )}
              </button>
            </form>
          )}
        </div>
        {status === 'error' && (
          <p className="text-red-400 text-xs text-center pb-2">{errorMsg}</p>
        )}
      </div>
    </div>
  );
}
