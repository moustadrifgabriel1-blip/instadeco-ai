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
      className={`group bg-card border border-[var(--gold-line)] rounded-3xl p-8 transition-all duration-500 hover:border-[var(--gold)] ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="h-14 w-14 rounded-xl bg-[rgba(200,162,77,0.12)] flex items-center justify-center mb-6 group-hover:bg-[var(--gold)] transition-colors duration-300">
        <Icon className="h-7 w-7 text-[var(--gold)] group-hover:text-[#0c0a09] transition-colors duration-300" />
      </div>

      <h3 className="prestige-display text-xl font-semibold mb-3 text-foreground">{feature.title}</h3>
      <p className="prestige-body text-muted-foreground leading-relaxed">{feature.description}</p>
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
    <section ref={sectionRef} className="py-24 lg:py-32 bg-background relative overflow-hidden">
      <div className="absolute top-20 right-[10%] w-48 h-48 bg-[var(--gold-soft)] rounded-full blur-3xl opacity-10" />
      <div className="absolute bottom-20 left-[5%] w-40 h-40 bg-[var(--gold-soft)] rounded-full blur-3xl opacity-[0.07]" />

      <div className="container px-4 md:px-6 relative z-10">
        <div
          className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div className="inline-flex items-center justify-center gap-2 mx-auto mb-6">
            <span className="text-[var(--gold)]">{t('features.badgeEmoji')}</span>
            <span className="prestige-eyebrow">{t('features.badgeText')}</span>
          </div>
          <h2 className="prestige-display text-3xl md:text-4xl lg:text-5xl font-semibold mb-6 text-foreground">
            {t('features.titleStart')}
            <span className="text-[var(--gold)]">{t('features.titleHighlight')}</span>
          </h2>
          <p className="prestige-body text-lg md:text-xl text-muted-foreground">{t('features.subtitle')}</p>
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
