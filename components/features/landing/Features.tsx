'use client';

import { useEffect, useRef, useState } from 'react';
import { Zap, LayoutTemplate, Wallet, Palette, MousePointerClick, Download, LucideIcon } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: "30 Secondes Chrono",
    description: "Un décorateur prend 2 semaines. Vous obtenez un rendu photoréaliste en 30 secondes — résultat comparable, 150x plus rapide."
  },
  {
    icon: LayoutTemplate,
    title: "Votre Pièce, Pas un Template",
    description: "L'IA analyse VOTRE espace (murs, fenêtres, volumes) pour un résultat sur mesure. Pas un catalogue générique."
  },
  {
    icon: Wallet,
    title: "0,99 € au lieu de 150 €/h",
    description: "Un architecte d'intérieur coûte 150 €/h minimum. InstaDeco vous donne un résultat comparable pour moins d'un café."
  },
  {
    icon: Palette,
    title: "20+ Styles, 0 Limite",
    description: "Scandinave, Japandi, Haussmannien, Chalet Alpin... Testez tous les styles en un clic. Chez un déco, c'est 3 propositions max."
  },
  {
    icon: MousePointerClick,
    title: "Photo → Résultat. C'est Tout.",
    description: "Pas de logiciel 3D complexe. Prenez une photo, choisissez un style, et admirez. Votre grand-mère pourrait le faire."
  },
  {
    icon: Download,
    title: "HD Prêt à Imprimer",
    description: "Téléchargez en haute définition, partagez sur les réseaux, envoyez à vos artisans. Vos images, vos droits."
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
