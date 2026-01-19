'use client';

import { Check } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

const PRICING_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 10,
    price: 9.99,
    popular: false,
    checkoutUrl: 'https://buy.stripe.com/test_5kQ8wP379eNU0IWasH3F600',
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 30,
    price: 24.99,
    popular: true,
    checkoutUrl: 'https://buy.stripe.com/00wcN5azB218dvI7gv3F604',
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    credits: 100,
    price: 69.99,
    popular: false,
    checkoutUrl: 'https://buy.stripe.com/9B6fZhdLN5dkfDQ30f3F603',
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      // Appeler l'API pour créer une session Stripe
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packId: planId,
          userId: user.uid,
          userEmail: user.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Erreur lors de la création de la session');
      }

      const { url } = await response.json();

      // Rediriger vers Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Erreur:', error);
      alert(error instanceof Error ? error.message : 'Une erreur est survenue. Veuillez réessayer.');
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      {/* Header */}
      <header className="border-b border-[#d2d2d7] bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <a href="/" className="text-lg sm:text-[21px] font-semibold text-[#1d1d1f]">
            InstaDeco
          </a>
          <nav className="flex items-center gap-3 sm:gap-6">
            <a href="/generate" className="text-sm sm:text-[14px] text-[#1d1d1f] hover:opacity-70 transition-opacity">
              Générer
            </a>
            {user ? (
              <a
                href="/dashboard"
                className="text-sm sm:text-[14px] bg-[#1d1d1f] text-white px-3 sm:px-4 py-2 rounded-full hover:bg-[#424245] transition-colors touch-manipulation min-h-[44px] flex items-center"
              >
                <span className="hidden sm:inline">Mon Compte</span>
                <span className="sm:hidden">Compte</span>
              </a>
            ) : (
              <a
                href="/login"
                className="text-sm sm:text-[14px] bg-[#1d1d1f] text-white px-3 sm:px-4 py-2 rounded-full hover:bg-[#424245] transition-colors touch-manipulation min-h-[44px] flex items-center"
              >
                Connexion
              </a>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-semibold tracking-[-0.025em] text-[#1d1d1f] leading-[1.1] sm:leading-[1.07] mb-3 sm:mb-4">
          Tarifs simples et transparents
        </h1>
        <p className="text-base sm:text-lg md:text-[21px] text-[#86868b] max-w-2xl mx-auto px-2">
          Pas d&apos;abonnement. Achetez des crédits et utilisez-les quand vous voulez.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        {/* Desktop: Grille normale */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          {PRICING_PLANS.map((plan) => (
            <PricingCard key={plan.id} plan={plan} onSelect={handleSelectPlan} />
          ))}
        </div>

        {/* Mobile: Carrousel avec swipe */}
        <div className="md:hidden overflow-hidden">
          <MobileCarousel plans={PRICING_PLANS} onSelect={handleSelectPlan} />
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-[32px] font-semibold text-[#1d1d1f] text-center mb-12">
            Questions fréquentes
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.08)]">
              <h3 className="text-[19px] font-semibold text-[#1d1d1f] mb-2">
                Les crédits expirent-ils ?
              </h3>
              <p className="text-[15px] text-[#86868b]">
                Non ! Vos crédits n&apos;expirent jamais. Utilisez-les quand vous voulez.
              </p>
            </div>

            <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.08)]">
              <h3 className="text-[19px] font-semibold text-[#1d1d1f] mb-2">
                Puis-je obtenir un remboursement ?
              </h3>
              <p className="text-[15px] text-[#86868b]">
                Les crédits non utilisés peuvent être remboursés sous 14 jours.
              </p>
            </div>

            <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.08)]">
              <h3 className="text-[19px] font-semibold text-[#1d1d1f] mb-2">
                Combien coûte une génération ?
              </h3>
              <p className="text-[15px] text-[#86868b]">
                1 crédit = 1 génération d&apos;image en haute qualité (1024x1024px).
              </p>
            </div>

            <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.08)]">
              <h3 className="text-[19px] font-semibold text-[#1d1d1f] mb-2">
                Comment fonctionne le paiement ?
              </h3>
              <p className="text-[15px] text-[#86868b]">
                Paiement sécurisé via Stripe. Carte bancaire, Apple Pay et Google Pay acceptés.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#d2d2d7] py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-[12px] text-[#86868b]">
            © 2026 InstaDeco. Propulsé par Flux.1 | ControlNet.
          </p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="#" className="text-[12px] text-[#86868b] hover:text-[#1d1d1f] transition-colors">
              Confidentialité
            </a>
            <a href="#" className="text-[12px] text-[#86868b] hover:text-[#1d1d1f] transition-colors">
              Conditions
            </a>
            <a href="#" className="text-[12px] text-[#86868b] hover:text-[#1d1d1f] transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Composant carte de prix réutilisable
function PricingCard({ plan, onSelect }: { plan: typeof PRICING_PLANS[0]; onSelect: (id: string) => void }) {
  return (
    <div
      className={`relative bg-white rounded-[16px] sm:rounded-[20px] p-4 sm:p-6 md:p-8 shadow-[0_2px_16px_rgba(0,0,0,0.08)] transition-all hover:scale-[1.02] ${
        plan.popular ? 'ring-2 ring-[#1d1d1f]' : ''
      }`}
    >
      {plan.popular && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#1d1d1f] text-white text-[11px] sm:text-[12px] font-medium px-3 sm:px-4 py-1 rounded-full">
          Populaire
        </div>
      )}

      <div className="text-center mb-5 sm:mb-6 md:mb-8">
        <h3 className="text-xl sm:text-2xl md:text-[28px] font-semibold text-[#1d1d1f] mb-2">
          {plan.name}
        </h3>
        <div className="flex items-baseline justify-center gap-1 mb-2 sm:mb-3">
          <span className="text-3xl sm:text-4xl md:text-[48px] font-semibold text-[#1d1d1f]">
            {plan.price}€
          </span>
        </div>
        <p className="text-sm sm:text-base md:text-[17px] text-[#86868b]">
          {plan.credits} crédits
        </p>
      </div>

      <ul className="space-y-2.5 sm:space-y-3 md:space-y-4 mb-5 sm:mb-6 md:mb-8">
        <li className="flex items-start gap-2.5 sm:gap-3">
          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <span className="text-xs sm:text-sm md:text-[15px] text-[#1d1d1f] leading-tight">
            {plan.credits} générations d&apos;images
          </span>
        </li>
        <li className="flex items-start gap-2.5 sm:gap-3">
          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <span className="text-xs sm:text-sm md:text-[15px] text-[#1d1d1f] leading-tight">
            Qualité HD (1024×1024)
          </span>
        </li>
        <li className="flex items-start gap-2.5 sm:gap-3">
          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <span className="text-xs sm:text-sm md:text-[15px] text-[#1d1d1f] leading-tight">
            Téléchargement illimité
          </span>
        </li>
        <li className="flex items-start gap-2.5 sm:gap-3">
          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <span className="text-xs sm:text-sm md:text-[15px] text-[#1d1d1f] leading-tight">
            Tous les styles disponibles
          </span>
        </li>
        <li className="flex items-start gap-2.5 sm:gap-3">
          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <span className="text-xs sm:text-sm md:text-[15px] text-[#1d1d1f] leading-tight">
            Usage commercial
          </span>
        </li>
      </ul>

      <button
        onClick={() => onSelect(plan.id)}
        className={`w-full py-2.5 sm:py-3 rounded-full text-sm sm:text-base md:text-[17px] font-medium transition-all touch-manipulation min-h-[44px] sm:min-h-[48px] ${
          plan.popular
            ? 'bg-[#1d1d1f] text-white hover:bg-[#424245] active:scale-95'
            : 'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed] active:scale-95'
        }`}
      >
        Choisir ce pack
      </button>
    </div>
  );
}

// Carrousel mobile avec swipe
function MobileCarousel({ plans, onSelect }: { plans: typeof PRICING_PLANS; onSelect: (id: string) => void }) {
  const [currentIndex, setCurrentIndex] = useState(1); // Commencer par le plan "Pro" (populaire)
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Gestion du swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      // Swipe left
      setCurrentIndex((prev) => Math.min(plans.length - 1, prev + 1));
    }
    if (touchStart - touchEnd < -75) {
      // Swipe right
      setCurrentIndex((prev) => Math.max(0, prev - 1));
    }
  };

  return (
    <div className="relative">
      {/* Conteneur du carrousel */}
      <div
        ref={containerRef}
        className="overflow-visible"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-300 ease-out pt-4 pb-2"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
        >
          {plans.map((plan) => (
            <div key={plan.id} className="w-full flex-shrink-0 px-4">
              <PricingCard plan={plan} onSelect={onSelect} />
            </div>
          ))}
        </div>
      </div>

      {/* Indicateurs de points */}
      <div className="flex justify-center gap-2 mt-6">
        {plans.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all touch-manipulation ${
              index === currentIndex
                ? 'w-8 bg-[#1d1d1f]'
                : 'w-2 bg-[#d2d2d7] hover:bg-[#86868b]'
            }`}
            aria-label={`Aller au plan ${index + 1}`}
          />
        ))}
      </div>

      {/* Texte d'instruction swipe */}
      <p className="text-center text-xs text-[#86868b] mt-3">
        ← Glissez pour voir les autres offres →
      </p>
    </div>
  );
}
