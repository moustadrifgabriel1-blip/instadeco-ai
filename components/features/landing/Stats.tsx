'use client';

import { useEffect, useRef, useState } from 'react';
import { Users, Image, Star, Zap, DollarSign } from 'lucide-react';

const stats = [
  {
    icon: Image,
    value: "12",
    label: "styles de décoration",
    suffix: "+",
    animate: false,
    target: 12,
  },
  {
    icon: DollarSign,
    value: "150",
    label: "€/h chez un déco",
    suffix: " €/h",
    prefix: "vs ",
    highlight: true,
    animate: false,
    target: 150,
  },
  {
    icon: Zap,
    value: "30",
    label: "secondes par design",
    suffix: "s",
    animate: false,
    target: 30,
  },
  {
    icon: Star,
    value: "8",
    label: "types de pièces",
    suffix: "",
    animate: false,
    target: 8,
  }
];

export function Stats() {
  const [isVisible, setIsVisible] = useState(false);
  const [animatedValues, setAnimatedValues] = useState<number[]>(stats.map(() => 0));
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

  // Animate counters on visible
  useEffect(() => {
    if (!isVisible) return;
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      // Easing out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      
      setAnimatedValues(stats.map(s => {
        const val = s.target * eased;
        return s.target >= 100 ? Math.floor(val) : Math.round(val * 10) / 10;
      }));

      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, [isVisible]);

  return (
    <section ref={sectionRef} className="py-16 bg-[#2D2D2D]">
      <div className="container px-4 md:px-6">
        {/* Value anchoring headline */}
        <p className="text-center text-white/50 text-sm mb-8 tracking-wide uppercase">
          Le résultat d&apos;un architecte d&apos;intérieur • Le prix d&apos;un café
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {stats.map((stat, index) => (
            <div 
              key={stat.label}
              className={`text-center transition-all duration-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="inline-flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-[#E07B54]/20 mb-3 sm:mb-4 mx-auto">
                <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-[#E07B54]" />
              </div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1">
                {stat.highlight ? (
                  <><span className="text-white/40 text-lg line-through">{animatedValues[index]}</span> <span className="text-[#E07B54]">→ 0,99 €</span></>
                ) : (
                  <>{animatedValues[index].toLocaleString('fr-CH')}<span className="text-[#E07B54]">{stat.suffix}</span></>
                )}
              </div>
              <div className="text-sm text-white/60">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
