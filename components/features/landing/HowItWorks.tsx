'use client';

import { useEffect, useRef, useState } from 'react';

const steps = [
  {
    number: "01",
    title: "Prenez une photo",
    description: "Photographiez votre pièce ou uploadez une image existante. L'IA fonctionne avec n'importe quelle pièce.",
    icon: "📸"
  },
  {
    number: "02",
    title: "Choisissez un style",
    description: "Sélectionnez parmi 12 styles déco : Moderne, Scandinave, Japandi, Bohème, Industriel...",
    icon: "🎨"
  },
  {
    number: "03",
    title: "Lancez la magie",
    description: "Notre IA transforme votre pièce en moins de 30 secondes. Téléchargez le résultat en HD !",
    icon: "✨"
  }
];

export function HowItWorks() {
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

  return (
    <section ref={sectionRef} className="py-20 lg:py-28 bg-white relative overflow-hidden">
      {/* Decorations */}
      <div className="absolute top-20 right-[5%] w-32 h-32 bg-[#FFE4D9] rounded-full blur-3xl opacity-40" />
      <div className="absolute bottom-20 left-[10%] w-24 h-24 bg-[#FFE4D9] rounded-full blur-2xl opacity-30" />
      
      <div className="container px-4 md:px-6 relative z-10">
        {/* Header */}
        <div className={`text-center max-w-2xl mx-auto mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="badge-primary mx-auto mb-4">
            <span>🚀</span>
            <span>Comment ça marche</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-[#2D2D2D] mb-4">
            3 étapes simples
          </h2>
          <p className="text-lg text-[#6B6B6B]">
            Transformez n&apos;importe quelle pièce en quelques clics
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div 
              key={step.number}
              className={`relative text-center transition-all duration-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-[#E07B54] to-transparent opacity-30" />
              )}
              
              {/* Icon */}
              <div className="inline-flex items-center justify-center h-24 w-24 rounded-2xl bg-[#FFF8F5] border border-[#F0E6E0] text-4xl mb-6 mx-auto">
                {step.icon}
              </div>
              
              {/* Number */}
              <div className="text-[#E07B54] font-bold text-sm mb-2">
                ÉTAPE {step.number}
              </div>
              
              {/* Content */}
              <h3 className="text-xl font-bold text-[#2D2D2D] mb-3">
                {step.title}
              </h3>
              <p className="text-[#6B6B6B] leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
