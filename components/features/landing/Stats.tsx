'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Star, Zap, DollarSign, LucideIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

const STAT_ICONS: LucideIcon[] = [Image, DollarSign, Zap, Star];

type StatRow = {
  target: number;
  suffix: string;
  label: string;
  highlight: boolean;
  prefix?: string;
};

export function Stats() {
  const [isVisible, setIsVisible] = useState(false);
  const [animatedValues, setAnimatedValues] = useState<number[]>([0, 0, 0, 0]);
  const sectionRef = useRef<HTMLElement>(null);
  const t = useTranslations('HomeLanding');
  const locale = useLocale();
  const rows = useMemo(() => t.raw('stats.rows') as StatRow[], [t]);
  const deal = t('stats.deal');

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

  useEffect(() => {
    if (!isVisible) return;
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setAnimatedValues(
        rows.map((r) => {
          const val = r.target * eased;
          return r.target >= 100 ? Math.floor(val) : Math.round(val * 10) / 10;
        }),
      );

      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, [isVisible, rows]);

  const numberLocale =
    locale === 'de' ? 'de-CH' : locale === 'en' ? 'en-US' : 'fr-CH';

  return (
    <section ref={sectionRef} className="py-16 bg-background">
      <div className="container px-4 md:px-6">
        <p className="prestige-eyebrow text-center mb-8">
          {t('stats.headline')}
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {rows.map((stat, index) => {
            const Icon = STAT_ICONS[index] ?? Image;
            return (
              <div
                key={stat.label}
                className={`text-center transition-all duration-500 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-[rgba(200,162,77,0.12)] border border-[var(--gold-line)] mb-3 sm:mb-4 mx-auto">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-[var(--gold)]" />
                </div>
                <div className="prestige-display text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground mb-1">
                  {stat.highlight ? (
                    <>
                      <span className="text-muted-foreground/60 text-lg line-through">
                        {animatedValues[index].toLocaleString(numberLocale)}
                      </span>{' '}
                      <span className="text-[var(--gold)]">{deal}</span>
                    </>
                  ) : (
                    <>
                      {animatedValues[index].toLocaleString(numberLocale)}
                      <span className="text-[var(--gold)]">{stat.suffix}</span>
                    </>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
