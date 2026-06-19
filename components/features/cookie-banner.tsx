'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie } from 'lucide-react';
import { getConsent, setConsent, type ConsentValue } from '@/lib/analytics/consent';

/**
 * Bandeau d'information cookies (RGPD / ePrivacy).
 * Affiché une seule fois, mémorisé dans localStorage.
 * 
 * Note : InstaDeco n'utilise que des cookies essentiels (session Supabase),
 * donc un simple bandeau informatif suffit (pas de consentement granulaire).
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Afficher seulement si l'utilisateur n'a pas encore choisi (opt-in préalable).
    if (getConsent() === null) {
      // Délai pour ne pas bloquer le LCP.
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const choose = (value: ConsentValue) => {
    setConsent(value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pt-4 sm:px-6 sm:pt-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pl-safe pr-safe animate-in slide-in-from-bottom duration-300">
      <div className="max-w-3xl mx-auto bg-[#0c0a09] rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.5)] border border-[var(--gold-line)] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-[14px] text-[var(--mist)] leading-relaxed">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--ivory)]">
                <Cookie className="h-4 w-4 text-[var(--gold)]" aria-hidden="true" />
                Cookies et mesure d&apos;audience.
              </span>{' '}
              Avec votre accord, nous utilisons Google Analytics et Meta Pixel pour mesurer notre audience.
              Rien n&apos;est activé sans votre choix.{' '}
              <Link href="/legal/privacy" className="text-[var(--gold)] hover:underline">
                En savoir plus
              </Link>
            </p>
          </div>
          <div className="flex flex-shrink-0 gap-2">
            <button
              onClick={() => choose('denied')}
              className="px-5 py-2.5 border border-[var(--gold-line)] text-[var(--ivory)] text-[14px] font-medium rounded-full hover:bg-[rgba(250,248,244,0.06)] transition-colors"
            >
              Refuser
            </button>
            <button
              onClick={() => choose('granted')}
              className="px-6 py-2.5 bg-[var(--gold)] text-[#0c0a09] text-[14px] font-semibold rounded-full hover:bg-[#d4b15f] transition-colors"
            >
              Accepter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
