'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Flame, Clock, ArrowRight, Check, Sparkles, Gift, Zap } from 'lucide-react';

interface FlashOfferProps {
  /** URL du Stripe Payment Link pour l'offre flash */
  stripePaymentUrl?: string;
  /** Durée du countdown en minutes */
  durationMinutes?: number;
  /** Prix barré (original) */
  originalPrice?: string;
  /** Prix de l'offre flash */
  flashPrice?: string;
  /** Nombre de crédits inclus */
  credits?: number;
  /** Callback quand l'offre expire */
  onExpire?: () => void;
  /** Classe CSS supplémentaire */
  className?: string;
}

export function FlashOffer({
  stripePaymentUrl = '/pricing',
  durationMinutes = 15,
  originalPrice = '9,90 €',
  flashPrice = '4,99 €',
  credits = 10,
  onExpire,
  className = '',
}: FlashOfferProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  // Persist timer in localStorage so it survives page refresh
  useEffect(() => {
    const STORAGE_KEY = 'instadeco_flash_offer_end';
    const stored = localStorage.getItem(STORAGE_KEY);
    let endTime: number;

    if (stored) {
      endTime = parseInt(stored, 10);
    } else {
      endTime = Date.now() + durationMinutes * 60 * 1000;
      localStorage.setItem(STORAGE_KEY, endTime.toString());
    }

    const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
    if (remaining <= 0) {
      setIsExpired(true);
      onExpire?.();
    } else {
      setTimeLeft(remaining);
    }
  }, [durationMinutes, onExpire]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) {
      if (timeLeft === 0) {
        setIsExpired(true);
        onExpire?.();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          setIsExpired(true);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onExpire]);

  // Effet pulsant quand le temps est bas
  useEffect(() => {
    if (timeLeft !== null && timeLeft <= 120 && timeLeft > 0) {
      setIsPulsing(true);
    }
  }, [timeLeft]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Calculer le pourcentage de temps restant pour la barre de progression
  const percentage = timeLeft !== null ? (timeLeft / (durationMinutes * 60)) * 100 : 100;

  if (isExpired || timeLeft === null) {
    return null;
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Fond prestige nuit + or */}
      <div className={`rounded-[24px] border ${isPulsing ? 'border-[var(--gold)] animate-pulse' : 'border-[var(--gold-line)]'} bg-[var(--ink)] p-6 sm:p-8 shadow-lg`}>

        {/* Badge "Offre limitée" */}
        <div className="flex items-center justify-center mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[var(--gold)] text-[#0c0a09] rounded-full text-sm font-bold shadow-lg shadow-[var(--gold)]/20">
            <Flame className="w-4 h-4 animate-bounce" />
            OFFRE DE BIENVENUE
            <Flame className="w-4 h-4 animate-bounce" />
          </div>
        </div>

        {/* Titre */}
        <h3 className="prestige-display text-center text-[24px] sm:text-[28px] font-semibold text-[var(--ivory)] tracking-[-0.02em] mb-1">
          {credits} générations pour <span className="text-[var(--gold)]">{flashPrice}</span>
        </h3>
        <p className="text-center text-[15px] text-[var(--mist)] mb-5">
          au lieu de <span className="line-through">{originalPrice}</span>, <span className="font-semibold text-[var(--gold)]">-50%</span>
        </p>

        {/* Countdown */}
        <div className="flex justify-center mb-5">
          <div className={`inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#1c1917] border ${isPulsing ? 'border-red-500/40' : 'border-[var(--gold-line)]'} shadow-sm`}>
            <Clock className={`w-5 h-5 ${isPulsing ? 'text-red-400' : 'text-[var(--gold)]'}`} />
            <div className="text-center">
              <span className={`text-[28px] font-mono font-bold tracking-wider ${isPulsing ? 'text-red-400' : 'text-[var(--ivory)]'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="w-full max-w-xs mx-auto h-1.5 bg-[#1c1917] rounded-full overflow-hidden mb-5">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${isPulsing ? 'bg-red-400' : 'bg-[var(--gold)]'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Avantages */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--ivory)] bg-[#1c1917] px-3 py-1.5 rounded-full">
            <Check className="w-3.5 h-3.5 text-[var(--gold)]" />
            {credits} transformations IA
          </span>
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--ivory)] bg-[#1c1917] px-3 py-1.5 rounded-full">
            <Check className="w-3.5 h-3.5 text-[var(--gold)]" />
            HD inclus
          </span>
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--ivory)] bg-[#1c1917] px-3 py-1.5 rounded-full">
            <Check className="w-3.5 h-3.5 text-[var(--gold)]" />
            Sans abonnement
          </span>
        </div>

        {/* CTA principal */}
        <div className="flex flex-col items-center gap-3">
          <Link
            href={stripePaymentUrl}
            className="group w-full max-w-sm inline-flex items-center justify-center gap-2 bg-[var(--gold)] text-[#0c0a09] px-8 py-4 rounded-full text-[17px] font-bold hover:bg-[#d4b15f] transition-all duration-200 shadow-xl shadow-[var(--gold)]/20 active:scale-[0.98] hover:scale-[1.02]"
          >
            <Zap className="w-5 h-5" />
            Profiter de l&apos;offre, {flashPrice}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-[11px] text-[var(--mist)]">
            Paiement sécurisé par Stripe • Sans engagement
          </p>
        </div>
      </div>
    </div>
  );
}
