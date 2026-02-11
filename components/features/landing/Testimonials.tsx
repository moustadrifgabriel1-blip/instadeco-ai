'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

const testimonials = [
  {
    name: "Sophie Martin",
    role: "Architecte d'intérieur",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face",
    content: "Cet outil a révolutionné ma façon de présenter des propositions à mes clients. En quelques secondes, je peux leur montrer leur salon transformé. Gain de temps énorme !",
    rating: 5
  },
  {
    name: "Thomas Dubois",
    role: "Agent immobilier",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face",
    content: "Parfait pour le home staging virtuel. Mes annonces avec les photos relookées par IA se vendent 2x plus vite. L'investissement est rentabilisé dès la première vente.",
    rating: 5
  },
  {
    name: "Marie Laurent",
    role: "Passionnée de déco",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=face",
    content: "Enfin un outil simple pour visualiser mes idées ! J'ai testé 10 styles différents pour mon salon avant de me décider. Ça m'a évité des erreurs coûteuses.",
    rating: 5
  },
  {
    name: "Pierre Moreau",
    role: "Propriétaire Airbnb",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face",
    content: "J'utilise InstaDeco pour optimiser mes appartements en location. Les photos avant/après sont bluffantes et mes réservations ont augmenté de 40%.",
    rating: 5
  },
  {
    name: "Julie Petit",
    role: "Blogueuse déco",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face",
    content: "Mes abonnés adorent quand je partage des transformations InstaDeco. C'est devenu mon secret pour créer du contenu qui buzze sur Instagram !",
    rating: 5
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
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section ref={sectionRef} className="py-20 lg:py-28 bg-white overflow-hidden">
      <div className="container px-4 md:px-6">
        {/* Header */}
        <div className={`text-center max-w-2xl mx-auto mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="badge-primary mx-auto mb-4">
            <span>💬</span>
            <span>Témoignages</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-[#2D2D2D] mb-4">
            Ils ont transformé leur intérieur
          </h2>
          <p className="text-lg text-[#6B6B6B]">
            Découvrez ce que nos utilisateurs pensent d&apos;InstaDeco
          </p>
        </div>

        {/* Carousel */}
        <div className={`relative max-w-4xl mx-auto transition-all duration-700 delay-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          {/* Navigation buttons */}
          <button 
            onClick={goToPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 z-10 h-12 w-12 rounded-full bg-white border border-[#F0E6E0] shadow-soft flex items-center justify-center hover:border-[#E07B54] hover:shadow-warm transition-all"
            aria-label="Précédent"
          >
            <ChevronLeft className="h-5 w-5 text-[#2D2D2D]" />
          </button>
          <button 
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 z-10 h-12 w-12 rounded-full bg-white border border-[#F0E6E0] shadow-soft flex items-center justify-center hover:border-[#E07B54] hover:shadow-warm transition-all"
            aria-label="Suivant"
          >
            <ChevronRight className="h-5 w-5 text-[#2D2D2D]" />
          </button>

          {/* Testimonial card */}
          <div className="bg-[#FFF8F5] rounded-3xl p-8 md:p-12 text-center">
            {/* Avatar */}
            <div className="mb-6">
              <Image
                src={testimonials[currentIndex].image}
                alt={testimonials[currentIndex].name}
                width={80}
                height={80}
                className="h-20 w-20 rounded-full mx-auto object-cover border-4 border-white shadow-warm"
              />
            </div>

            {/* Stars */}
            <div className="flex justify-center gap-1 mb-6">
              {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
              ))}
            </div>

            {/* Quote */}
            <blockquote className="text-lg md:text-xl text-[#2D2D2D] mb-6 max-w-2xl mx-auto leading-relaxed">
              &ldquo;{testimonials[currentIndex].content}&rdquo;
            </blockquote>

            {/* Author */}
            <div>
              <p className="font-semibold text-[#2D2D2D]">{testimonials[currentIndex].name}</p>
              <p className="text-sm text-[#6B6B6B]">{testimonials[currentIndex].role}</p>
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'w-8 bg-[#E07B54]' 
                    : 'w-2 bg-[#F0E6E0] hover:bg-[#FFE4D9]'
                }`}
                aria-label={`Aller au témoignage ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
