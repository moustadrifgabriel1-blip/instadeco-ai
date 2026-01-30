'use client';

import { useEffect, useRef, useState } from 'react';
import { Users, Image, Star, Zap } from 'lucide-react';

const stats = [
  {
    icon: Users,
    value: "12,000+",
    label: "Utilisateurs actifs",
    suffix: ""
  },
  {
    icon: Image,
    value: "500,000+",
    label: "Images générées",
    suffix: ""
  },
  {
    icon: Star,
    value: "4.9",
    label: "Note moyenne",
    suffix: "/5"
  },
  {
    icon: Zap,
    value: "15",
    label: "Secondes en moyenne",
    suffix: "s"
  }
];

export function Stats() {
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
    <section ref={sectionRef} className="py-16 bg-[#2D2D2D]">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div 
              key={stat.label}
              className={`text-center transition-all duration-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-[#E07B54]/20 mb-4 mx-auto">
                <stat.icon className="h-6 w-6 text-[#E07B54]" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                {stat.value}<span className="text-[#E07B54]">{stat.suffix}</span>
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
