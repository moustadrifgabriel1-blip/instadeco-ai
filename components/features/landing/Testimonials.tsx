'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const useCases = [
  {
    profile: "Propriétaires",
    role: "Visualiser avant travaux",
    image: "/images/use-case-owner.svg",
    content: "Comparez plusieurs styles sur votre propre photo avant de vous lancer dans des travaux. Moderne, scandinave, japandi… le résultat s'affiche en ~30 secondes.",
    icon: "🏠"
  },
  {
    profile: "Agents immobiliers",
    role: "Home staging virtuel",
    image: "/images/use-case-agent.svg",
    content: "Meublez virtuellement vos biens vides pour aider les acheteurs à se projeter. Un complément rapide et économique au home staging physique.",
    icon: "🏢"
  },
  {
    profile: "Architectes d'intérieur",
    role: "Propositions rapides",
    image: "/images/use-case-architect.svg",
    content: "Montrez un avant/après instantané à vos clients pour valider une direction déco avant de réaliser le projet complet.",
    icon: "🎨"
  }
];

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Auto-scroll
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % useCases.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + useCases.length) % useCases.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % useCases.length);
  };

  return (
    <section ref={sectionRef} className="py-20 lg:py-28 bg-white overflow-hidden">
      <div className="container px-4 md:px-6">
        {/* Header */}
        <div className={`text-center max-w-2xl mx-auto mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="badge-primary mx-auto mb-4">
            <span>�</span>
            <span>Cas d&apos;usage</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-[#2D2D2D] mb-4">
            Pour qui est fait InstaDeco ?
          </h2>
          <p className="text-lg text-[#6B6B6B]">
            Découvrez comment chaque profil utilise la déco par IA
          </p>
        </div>

        {/* Carousel */}
        <div className={`relative max-w-4xl mx-auto transition-all duration-700 delay-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          {/* Navigation buttons */}
          <button 
            onClick={goToPrev}
            className="absolute left-2 sm:left-0 top-1/2 -translate-y-1/2 sm:-translate-x-4 md:-translate-x-12 z-10 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white border border-[#F0E6E0] shadow-soft hidden sm:flex items-center justify-center hover:border-[#E07B54] hover:shadow-warm transition-all"
            aria-label="Précédent"
          >
            <ChevronLeft className="h-5 w-5 text-[#2D2D2D]" />
          </button>
          <button 
            onClick={goToNext}
            className="absolute right-2 sm:right-0 top-1/2 -translate-y-1/2 sm:translate-x-4 md:translate-x-12 z-10 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white border border-[#F0E6E0] shadow-soft hidden sm:flex items-center justify-center hover:border-[#E07B54] hover:shadow-warm transition-all"
            aria-label="Suivant"
          >
            <ChevronRight className="h-5 w-5 text-[#2D2D2D]" />
          </button>

          {/* Use case card */}
          <div className="bg-[#FFF8F5] rounded-3xl p-5 sm:p-8 md:p-12 text-center">
            {/* Icon */}
            <div className="mb-6">
              <span className="text-5xl">{useCases[currentIndex].icon}</span>
            </div>

            {/* Description */}
            <p className="text-lg md:text-xl text-[#2D2D2D] mb-6 max-w-2xl mx-auto leading-relaxed">
              {useCases[currentIndex].content}
            </p>

            {/* Profile */}
            <div>
              <p className="font-semibold text-[#2D2D2D]">{useCases[currentIndex].profile}</p>
              <p className="text-sm text-[#6B6B6B]">{useCases[currentIndex].role}</p>
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {useCases.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'w-8 bg-[#E07B54]' 
                    : 'w-2 bg-[#F0E6E0] hover:bg-[#FFE4D9]'
                }`}
                aria-label={`Aller au cas d'usage ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
