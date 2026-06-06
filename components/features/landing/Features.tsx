'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Zap,
  LayoutTemplate,
  Wallet,
  Palette,
  MousePointerClick,
  Download,
  LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

const FEATURE_ICONS: LucideIcon[] = [
  Zap,
  LayoutTemplate,
  Wallet,
  Palette,
  MousePointerClick,
  Download,
];

function FeatureCard({
  feature,
  index,
  isVisible,
}: {
  feature: { title: string; description: string; icon: LucideIcon };
  index: number;
  isVisible: boolean;
}) {
  const Icon = feature.icon;

  return (
    <div
      className={`group card-interactive p-8 transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="h-14 w-14 rounded-xl bg-[#FFE4D9] flex items-center justify-center mb-6 group-hover:bg-[#E07B54] transition-colors duration-300">
        <Icon className="h-7 w-7 text-[#E07B54] group-hover:text-white transition-colors duration-300" />
      </div>

      <h3 className="text-xl font-bold mb-3 text-[#2D2D2D]">{feature.title}</h3>
      <p className="text-[#6B6B6B] leading-relaxed">{feature.description}</p>
    </div>
  );
}

export function Features() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const t = useTranslations('HomeLanding');
  const items = t.raw('features.items') as { title: string; description: string }[];

  const features = items.map((item, index) => ({
    ...item,
    icon: FEATURE_ICONS[index] ?? Zap,
  }));

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 lg:py-32 bg-white relative overflow-hidden">
      <div className="absolute top-20 right-[10%] w-48 h-48 bg-[#FFE4D9] rounded-full blur-3xl opacity-30" />
      <div className="absolute bottom-20 left-[5%] w-40 h-40 bg-[#FFE4D9] rounded-full blur-3xl opacity-20" />

      <div className="container px-4 md:px-6 relative z-10">
        <div
          className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div className="badge-primary mx-auto mb-6">
            <span>{t('features.badgeEmoji')}</span>
            <span>{t('features.badgeText')}</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-6 text-[#2D2D2D]">
            {t('features.titleStart')}
            <span className="text-gradient">{t('features.titleHighlight')}</span>
          </h2>
          <p className="text-lg md:text-xl text-[#6B6B6B]">{t('features.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  );
}
