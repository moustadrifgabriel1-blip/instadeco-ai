'use client';

import { useState, useEffect, useCallback } from 'react';
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
  originalPrice = '9,99 €',
  flashPrice = '4,99 €',
  credits = 5,
  onExpire,
  className = '',
}: FlashOfferProps) {
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [isExpired, setIsExpired] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      setIsExpired(true);
      onExpire?.();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
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
    if (timeLeft <= 120 && timeLeft > 0) {
      setIsPulsing(true);
    }
  }, [timeLeft]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Calculer le pourcentage de temps restant pour la barre de progression
  const percentage = (timeLeft / (durationMinutes * 60)) * 100;

  if (isExpired) {
    return null;
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Fond avec gradient animé */}
      <div className={`rounded-[24px] border-2 ${isPulsing ? 'border-[#E07B54] animate-pulse' : 'border-[#F5D5C8]'} bg-gradient-to-br from-[#FFF8F5] via-[#FFF0E8] to-[#FFE4D9] p-6 sm:p-8 shadow-lg`}>
        
        {/* Badge "Offre limitée" */}
        <div className="flex items-center justify-center mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#E07B54] text-white rounded-full text-sm font-bold shadow-lg shadow-[#E07B54]/30">
            <Flame className="w-4 h-4 animate-bounce" />
            OFFRE DE BIENVENUE
            <Flame className="w-4 h-4 animate-bounce" />
          </div>
        </div>

        {/* Titre */}
        <h3 className="text-center text-[24px] sm:text-[28px] font-bold text-[#1d1d1f] tracking-[-0.02em] mb-1">
          {credits} générations pour <span className="text-[#E07B54]">{flashPrice}</span>
        </h3>
        <p className="text-center text-[15px] text-[#636366] mb-5">
          au lieu de <span className="line-through">{originalPrice}</span> — <span className="font-semibold text-[#E07B54]">-50%</span>
        </p>

        {/* Countdown */}
        <div className="flex justify-center mb-5">
          <div className={`inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/80 backdrop-blur-md border ${isPulsing ? 'border-red-200 bg-red-50/50' : 'border-black/5'} shadow-sm`}>
            <Clock className={`w-5 h-5 ${isPulsing ? 'text-red-500' : 'text-[#E07B54]'}`} />
            <div className="text-center">
              <span className={`text-[28px] font-mono font-bold tracking-wider ${isPulsing ? 'text-red-500' : 'text-[#1d1d1f]'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="w-full max-w-xs mx-auto h-1.5 bg-white/60 rounded-full overflow-hidden mb-5">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${isPulsing ? 'bg-red-500' : 'bg-[#E07B54]'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Avantages */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#1d1d1f] bg-white/70 px-3 py-1.5 rounded-full">
            <Check className="w-3.5 h-3.5 text-green-500" />
            {credits} transformations IA
          </span>
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#1d1d1f] bg-white/70 px-3 py-1.5 rounded-full">
            <Check className="w-3.5 h-3.5 text-green-500" />
            HD inclus
          </span>
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#1d1d1f] bg-white/70 px-3 py-1.5 rounded-full">
            <Check className="w-3.5 h-3.5 text-green-500" />
            Sans abonnement
          </span>
        </div>

        {/* CTA principal */}
        <div className="flex flex-col items-center gap-3">
          <a
            href={stripePaymentUrl}
            className="group w-full max-w-sm inline-flex items-center justify-center gap-2 bg-[#E07B54] text-white px-8 py-4 rounded-full text-[17px] font-bold hover:bg-[#d06a45] transition-all duration-200 shadow-xl shadow-[#E07B54]/30 active:scale-[0.98] hover:scale-[1.02]"
          >
            <Zap className="w-5 h-5" />
            Profiter de l&apos;offre — {flashPrice}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
          <p className="text-[11px] text-[#636366]">
            Paiement sécurisé par Stripe • Sans engagement
          </p>
        </div>
      </div>
    </div>
  );
}
