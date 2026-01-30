'use client';

import { useState } from 'react';
import { Check, Sparkles, Clock, CreditCard, Image, Download, Palette, Building2, HelpCircle, ChevronDown, Heart } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { usePurchaseCredits } from '@/src/presentation/hooks/usePurchaseCredits';
import { CreditPackId } from '@/src/presentation/types';

const PRICING_PLANS = [
  {
    id: 'pack_10' as CreditPackId,
    name: 'Découverte',
    credits: 10,
    price: 9.99,
    popular: false,
    emoji: '🌱',
    description: 'Parfait pour tester',
  },
  {
    id: 'pack_25' as CreditPackId,
    name: 'Créatif',
    credits: 25,
    price: 19.99,
    popular: true,
    emoji: '✨',
    description: 'Le plus choisi',
  },
  {
    id: 'pack_50' as CreditPackId,
    name: 'Pro',
    credits: 50,
    price: 34.99,
    popular: false,
    emoji: '🚀',
    description: 'Pour les passionnés',
  },
];

// FAQ exhaustive pour réduire le SAV
const FAQ_ITEMS = [
  {
    category: 'credits',
    icon: CreditCard,
    question: "Combien coûte une génération d'image ?",
    answer: "1 crédit = 1 génération. C'est aussi simple que ça ! Chaque génération vous donne une image en haute qualité (1024×1024 pixels) que vous pouvez télécharger immédiatement."
  },
  {
    category: 'credits',
    icon: Clock,
    question: "Mes crédits expirent-ils ?",
    answer: "Non, jamais ! 🎉 Vos crédits restent sur votre compte indéfiniment. Utilisez-les quand vous voulez, à votre rythme. Pas de pression, pas de date limite."
  },
  {
    category: 'quality',
    icon: Image,
    question: "Quelle est la qualité des images générées ?",
    answer: "Toutes les images sont en haute définition (1024×1024 pixels). Vous pouvez aussi débloquer la version HD+ (2048×2048) pour seulement 1,99€ par image - parfait pour l'impression grand format !"
  },
  {
    category: 'usage',
    icon: Building2,
    question: "Puis-je utiliser les images pour mon activité pro ?",
    answer: "Absolument ! Toutes les images que vous générez vous appartiennent. Vous pouvez les utiliser pour vos projets personnels, votre portfolio, vos clients, vos réseaux sociaux... Aucune restriction d'usage commercial."
  },
  {
    category: 'quality',
    icon: Palette,
    question: "Comment choisir le bon style pour ma pièce ?",
    answer: "On propose 12 styles différents (Moderne, Scandinave, Japandi, Bohème...). Notre conseil : choisissez le style qui correspond à l'ambiance que vous voulez créer, et ajustez l'intensité de transformation selon vos goûts. Le mode 'Décor uniquement' garde vos meubles et change juste la déco !"
  },
  {
    category: 'usage',
    icon: Download,
    question: "Comment télécharger mes créations ?",
    answer: "Super simple ! Une fois l'image générée, cliquez sur 'Télécharger' et c'est fait. L'image se sauvegarde automatiquement sur votre appareil. Vous retrouvez aussi tout votre historique dans votre tableau de bord."
  },
  {
    category: 'payment',
    icon: CreditCard,
    question: "Quels moyens de paiement acceptez-vous ?",
    answer: "On accepte toutes les cartes bancaires (Visa, Mastercard, American Express), ainsi qu'Apple Pay et Google Pay. Paiement 100% sécurisé via Stripe, leader mondial du paiement en ligne."
  },
  {
    category: 'payment',
    icon: HelpCircle,
    question: "Puis-je obtenir un remboursement ?",
    answer: "Oui ! Si vous n'avez pas utilisé vos crédits, vous pouvez demander un remboursement intégral sous 14 jours après l'achat. Il suffit de nous contacter par email. Les crédits déjà utilisés ne sont pas remboursables."
  },
  {
    category: 'quality',
    icon: Sparkles,
    question: "Que faire si le résultat ne me plaît pas ?",
    answer: "L'IA est créative ! Si un résultat ne vous convient pas, relancez simplement une génération avec les mêmes paramètres : vous obtiendrez une nouvelle proposition. Vous pouvez aussi ajuster l'intensité de transformation ou changer de style."
  },
  {
    category: 'usage',
    icon: Image,
    question: "Quels types de photos fonctionnent le mieux ?",
    answer: "Pour de meilleurs résultats : prenez une photo bien éclairée, de face (pas d'angle extrême), et qui montre bien l'espace. Évitez les photos floues ou trop sombres. Les pièces vides ou peu meublées donnent plus de liberté à l'IA !"
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  const { purchase, isLoading, error } = usePurchaseCredits();

  const handleSelectPlan = async (planId: CreditPackId) => {
    if (!user) {
      router.push('/login');
      return;
    }

    const checkoutUrl = await purchase({
      packId: planId,
      successUrl: `${window.location.origin}/dashboard?payment=success`,
      cancelUrl: `${window.location.origin}/pricing?payment=cancelled`,
    });

    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8F5] via-[#FFFBF9] to-white">
      {/* Hero avec touches de couleur */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 text-center relative">
        {/* Décoration subtile */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-[#FFE4D9] rounded-full blur-3xl opacity-60" />
        <div className="absolute top-20 right-16 w-16 h-16 bg-[#E8F4E5] rounded-full blur-2xl opacity-50" />
        
        <div className="inline-flex items-center gap-2 bg-[#FFF0EB] text-[#D4603C] px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Heart className="w-4 h-4" />
          Sans abonnement, sans engagement
        </div>
        
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-semibold tracking-[-0.025em] text-[#2D2D2D] leading-[1.1] sm:leading-[1.07] mb-4">
          Des tarifs simples,<br />
          <span className="bg-gradient-to-r from-[#E07B54] to-[#D4603C] bg-clip-text text-transparent">
            comme votre déco
          </span>
        </h1>
        <p className="text-base sm:text-lg md:text-[21px] text-[#6B6B6B] max-w-2xl mx-auto">
          Achetez des crédits une fois, utilisez-les pour toujours.
          <br className="hidden sm:block" />
          Pas de surprise, pas d&apos;abonnement caché.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="max-w-md mx-auto px-4 mb-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm text-center">
            {error}
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        {/* Desktop */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          {PRICING_PLANS.map((plan) => (
            <PricingCard 
              key={plan.id} 
              plan={plan} 
              onSelect={() => handleSelectPlan(plan.id)}
              isLoading={isLoading}
            />
          ))}
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden">
          <MobileCarousel 
            plans={PRICING_PLANS} 
            onSelect={handleSelectPlan}
            isLoading={isLoading}
          />
        </div>

        {/* Reassurance */}
        <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-[#6B6B6B]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#E8F4E5] flex items-center justify-center">
              <Check className="w-3 h-3 text-[#4CAF50]" />
            </div>
            Paiement sécurisé
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#E8F4E5] flex items-center justify-center">
              <Check className="w-3 h-3 text-[#4CAF50]" />
            </div>
            Crédits sans expiration
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#E8F4E5] flex items-center justify-center">
              <Check className="w-3 h-3 text-[#4CAF50]" />
            </div>
            Remboursement 14j
          </div>
        </div>
      </div>

      {/* FAQ Section - Design épuré et chaleureux */}
      <div className="bg-white py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#FFF0EB] text-[#D4603C] px-4 py-2 rounded-full text-sm font-medium mb-4">
              <HelpCircle className="w-4 h-4" />
              Tout ce qu&apos;il faut savoir
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-[36px] font-semibold text-[#2D2D2D] mb-3">
              Questions fréquentes
            </h2>
            <p className="text-[#6B6B6B]">
              On répond à toutes vos questions pour que vous puissiez créer en toute sérénité
            </p>
          </div>
          
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, index) => (
              <div 
                key={index}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  openFaq === index 
                    ? 'bg-[#FFF8F5] border-[#F5D5C8] shadow-sm' 
                    : 'bg-white border-[#F0E8E4] hover:border-[#E8D5CC]'
                }`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      openFaq === index ? 'bg-[#E07B54] text-white' : 'bg-[#FFF0EB] text-[#E07B54]'
                    }`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-[#2D2D2D] pr-4">{item.question}</span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-[#6B6B6B] transition-transform flex-shrink-0 ${
                    openFaq === index ? 'rotate-180' : ''
                  }`} />
                </button>
                
                {openFaq === index && (
                  <div className="px-5 pb-5 pt-0">
                    <div className="pl-14 text-[#6B6B6B] leading-relaxed">
                      {item.answer}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Contact si besoin */}
          <div className="mt-10 text-center p-6 bg-gradient-to-r from-[#FFF8F5] to-[#FFF0EB] rounded-2xl border border-[#F5E6E0]">
            <p className="text-[#2D2D2D] mb-2">
              Vous avez encore une question ?
            </p>
            <a 
              href="mailto:contact@instadeco.app" 
              className="inline-flex items-center gap-2 text-[#E07B54] font-medium hover:underline"
            >
              Écrivez-nous, on répond sous 24h 💌
            </a>
          </div>
        </div>
      </div>

      {/* Footer chaleureux */}
      <footer className="bg-[#FFFBF9] border-t border-[#F5E6E0] py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-2xl">✨</span>
            <span className="font-semibold text-[#2D2D2D]">InstaDeco</span>
          </div>
          <p className="text-[12px] text-[#6B6B6B] mb-4">
            Transformez votre intérieur avec l&apos;IA. Propulsé par Flux.1 + ControlNet.
          </p>
          <div className="flex justify-center gap-6">
            <a href="/legal/privacy" className="text-[12px] text-[#6B6B6B] hover:text-[#E07B54] transition-colors">
              Confidentialité
            </a>
            <a href="/legal/cgv" className="text-[12px] text-[#6B6B6B] hover:text-[#E07B54] transition-colors">
              CGV
            </a>
            <a href="mailto:contact@instadeco.app" className="text-[12px] text-[#6B6B6B] hover:text-[#E07B54] transition-colors">
              Contact
            </a>
          </div>
          <p className="text-[11px] text-[#9B9B9B] mt-6">
            © 2026 InstaDeco. Fait avec ❤️ en Suisse.
          </p>
        </div>
      </footer>
    </div>
  );
}

// Types
interface PricingPlan {
  id: CreditPackId;
  name: string;
  credits: number;
  price: number;
  popular: boolean;
  emoji: string;
  description: string;
}

// Carte de prix avec design chaleureux
function PricingCard({ 
  plan, 
  onSelect, 
  isLoading 
}: { 
  plan: PricingPlan; 
  onSelect: () => void;
  isLoading: boolean;
}) {
  return (
    <div
      className={`relative bg-white rounded-3xl p-6 md:p-8 transition-all hover:scale-[1.02] hover:shadow-xl ${
        plan.popular 
          ? 'ring-2 ring-[#E07B54] shadow-lg shadow-[#E07B54]/10' 
          : 'border border-[#F0E8E4] shadow-sm hover:border-[#E8D5CC]'
      }`}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#E07B54] to-[#D4603C] text-white text-[12px] font-medium px-4 py-1.5 rounded-full shadow-lg">
          ⭐ Le plus choisi
        </div>
      )}

      <div className="text-center mb-6">
        <div className="text-4xl mb-3">{plan.emoji}</div>
        <h3 className="text-2xl font-semibold text-[#2D2D2D] mb-1">
          {plan.name}
        </h3>
        <p className="text-sm text-[#6B6B6B]">{plan.description}</p>
      </div>

      <div className="text-center mb-6">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl md:text-5xl font-bold text-[#2D2D2D]">
            {plan.price}€
          </span>
        </div>
        <p className="text-[#6B6B6B] mt-1">
          {plan.credits} crédits • <span className="text-[#E07B54] font-medium">{(plan.price / plan.credits).toFixed(2)}€/crédit</span>
        </p>
      </div>

      <ul className="space-y-3 mb-8">
        {[
          `${plan.credits} générations HD`,
          'Tous les styles inclus',
          'Téléchargement illimité',
          'Usage commercial OK',
          'Crédits sans expiration',
        ].map((feature, i) => (
          <li key={i} className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-[#E8F4E5] flex items-center justify-center flex-shrink-0">
              <Check className="w-3 h-3 text-[#4CAF50]" />
            </div>
            <span className="text-sm text-[#2D2D2D]">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        disabled={isLoading}
        className={`w-full py-3.5 rounded-full text-base font-medium transition-all disabled:opacity-50 ${
          plan.popular
            ? 'bg-gradient-to-r from-[#E07B54] to-[#D4603C] text-white hover:shadow-lg hover:shadow-[#E07B54]/30 active:scale-95'
            : 'bg-[#2D2D2D] text-white hover:bg-[#3D3D3D] active:scale-95'
        }`}
      >
        {isLoading ? 'Chargement...' : 'Choisir ce pack'}
      </button>
    </div>
  );
}

// Carrousel mobile
function MobileCarousel({ 
  plans, 
  onSelect,
  isLoading,
}: { 
  plans: PricingPlan[]; 
  onSelect: (id: CreditPackId) => void;
  isLoading: boolean;
}) {
  const [currentIndex, setCurrentIndex] = useState(1);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      setCurrentIndex((prev) => Math.min(plans.length - 1, prev + 1));
    }
    if (touchStart - touchEnd < -75) {
      setCurrentIndex((prev) => Math.max(0, prev - 1));
    }
  };

  return (
    <div className="relative">
      <div
        className="overflow-visible"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-300 ease-out pt-6 pb-2"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {plans.map((plan) => (
            <div key={plan.id} className="w-full flex-shrink-0 px-4">
              <PricingCard 
                plan={plan} 
                onSelect={() => onSelect(plan.id)}
                isLoading={isLoading}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {plans.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'w-8 bg-[#E07B54]'
                : 'w-2 bg-[#E8D5CC] hover:bg-[#D4A599]'
            }`}
          />
        ))}
      </div>
      
      <p className="text-center text-xs text-[#6B6B6B] mt-3">
        ← Glissez pour voir les offres →
      </p>
    </div>
  );
}
