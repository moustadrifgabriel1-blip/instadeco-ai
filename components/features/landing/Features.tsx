'use client';

import { useEffect, useRef, useState } from 'react';
import { Zap, LayoutTemplate, Wallet, Palette, MousePointerClick, Download, LucideIcon } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: "Ultra Rapide",
    description: "Obtenez un rendu photoréaliste en moins de 15 secondes grâce à nos serveurs GPU haute performance."
  },
  {
    icon: LayoutTemplate,
    title: "Respect de l'Architecture",
    description: "Notre IA analyse la structure de votre pièce (murs, fenêtres) pour préserver les volumes existants."
  },
  {
    icon: Wallet,
    title: "Économique",
    description: "Une fraction du prix d'un décorateur d'intérieur ou d'un logiciel de home staging 3D classique."
  },
  {
    icon: Palette,
    title: "+50 Styles Déco",
    description: "Scandinave, Japandi, Industriel, Bohème... Explorez une infinité de combinaisons stylistiques."
  },
  {
    icon: MousePointerClick,
    title: "Simplicité Extrême",
    description: "Aucune compétence technique requise. Prenez une photo, choisissez un style, et c'est tout."
  },
  {
    icon: Download,
    title: "Qualité HD",
    description: "Téléchargez vos rendus en haute définition, prêts à être partagés sur les réseaux ou avec vos clients."
  }
];

function FeatureCard({ 
  feature, 
  index, 
  isVisible 
}: { 
  feature: { icon: LucideIcon; title: string; description: string }; 
  index: number;
  isVisible: boolean;
}) {
  const Icon = feature.icon;
  
  return (
    <div
      className={`group card-interactive p-8 transition-all duration-500 ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Icon */}
      <div className="h-14 w-14 rounded-xl bg-[#FFE4D9] flex items-center justify-center mb-6 group-hover:bg-[#E07B54] transition-colors duration-300">
        <Icon className="h-7 w-7 text-[#E07B54] group-hover:text-white transition-colors duration-300" />
      </div>
      
      {/* Content */}
      <h3 className="text-xl font-bold mb-3 text-[#2D2D2D]">
        {feature.title}
      </h3>
      <p className="text-[#6B6B6B] leading-relaxed">
        {feature.description}
      </p>
    </div>
  );
}

export function Features() {
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
    <section ref={sectionRef} className="py-24 lg:py-32 bg-white relative overflow-hidden">
      {/* Décorations */}
      <div className="absolute top-20 right-[10%] w-48 h-48 bg-[#FFE4D9] rounded-full blur-3xl opacity-30" />
      <div className="absolute bottom-20 left-[5%] w-40 h-40 bg-[#FFE4D9] rounded-full blur-3xl opacity-20" />
      
      <div className="container px-4 md:px-6 relative z-10">
        {/* Header */}
        <div className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="badge-primary mx-auto mb-6">
            <span>✨</span>
            <span>Pourquoi nous choisir</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-6 text-[#2D2D2D]">
            Une expérience pensée pour{' '}
            <span className="text-gradient">vous</span>
          </h2>
          <p className="text-lg md:text-xl text-[#6B6B6B]">
            Une technologie de pointe au service de votre créativité.
          </p>
        </div>

        {/* Feature cards grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index} 
              feature={feature} 
              index={index}
              isVisible={isVisible}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
