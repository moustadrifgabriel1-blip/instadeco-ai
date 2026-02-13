'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
    // Ne pas afficher si déjà accepté
    const accepted = localStorage.getItem('cookies-accepted');
    if (!accepted) {
      // Délai pour ne pas bloquer le LCP
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookies-accepted', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.12)] border border-[#e5e5e7] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-[14px] text-[#1d1d1f] leading-relaxed">
              <span className="font-semibold">🍪 Cookies & Analyse.</span>{' '}
              Nous utilisons des cookies pour la connexion et des outils d'analyse (Google Analytics, Facebook Pixel) 
              afin de mesurer nos performances publicitaires.{' '}
              <Link 
                href="/legal/privacy" 
                className="text-[#0071e3] hover:underline"
              >
                En savoir plus
              </Link>
            </p>
          </div>
          <button
            onClick={handleAccept}
            className="flex-shrink-0 px-6 py-2.5 bg-[#1d1d1f] text-white text-[14px] font-medium rounded-full hover:bg-black transition-colors"
          >
            Compris
          </button>
        </div>
      </div>
    </div>
  );
}
