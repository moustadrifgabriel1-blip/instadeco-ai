'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

type UseCase = {
  profile: string;
  role: string;
  content: string;
  icon: string;
};

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const t = useTranslations('HomeLanding');
  const cases = t.raw('testimonials.cases') as UseCase[];

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
    if (cases.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % cases.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [cases.length]);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + cases.length) % cases.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % cases.length);
  };

  if (cases.length === 0) return null;

  return (
    <section ref={sectionRef} className="py-20 lg:py-28 bg-white overflow-hidden">
      <div className="container px-4 md:px-6">
        <div
          className={`text-center max-w-2xl mx-auto mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div className="badge-primary mx-auto mb-4">
            <span>{t('testimonials.badgeEmoji')}</span>
            <span>{t('testimonials.badgeText')}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-[#2D2D2D] mb-4">
            {t('testimonials.title')}
          </h2>
          <p className="text-lg text-[#6B6B6B]">{t('testimonials.subtitle')}</p>
        </div>

        <div
          className={`relative max-w-4xl mx-auto transition-all duration-700 delay-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          <button
            type="button"
            onClick={goToPrev}
            className="absolute left-2 sm:left-0 top-1/2 -translate-y-1/2 sm:-translate-x-4 md:-translate-x-12 z-10 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white border border-[#F0E6E0] shadow-soft hidden sm:flex items-center justify-center hover:border-[#E07B54] hover:shadow-warm transition-all"
            aria-label={t('testimonials.prevAria')}
          >
            <ChevronLeft className="h-5 w-5 text-[#2D2D2D]" />
          </button>
          <button
            type="button"
            onClick={goToNext}
            className="absolute right-2 sm:right-0 top-1/2 -translate-y-1/2 sm:translate-x-4 md:translate-x-12 z-10 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white border border-[#F0E6E0] shadow-soft hidden sm:flex items-center justify-center hover:border-[#E07B54] hover:shadow-warm transition-all"
            aria-label={t('testimonials.nextAria')}
          >
            <ChevronRight className="h-5 w-5 text-[#2D2D2D]" />
          </button>

          <div className="bg-[#FFF8F5] rounded-3xl p-5 sm:p-8 md:p-12 text-center">
            <div className="mb-6">
              <span className="text-5xl">{cases[currentIndex].icon}</span>
            </div>

            <p className="text-lg md:text-xl text-[#2D2D2D] mb-6 max-w-2xl mx-auto leading-relaxed">
              {cases[currentIndex].content}
            </p>

            <div>
              <p className="font-semibold text-[#2D2D2D]">{cases[currentIndex].profile}</p>
              <p className="text-sm text-[#6B6B6B]">{cases[currentIndex].role}</p>
            </div>
          </div>

          <div className="flex justify-center gap-2 mt-6">
            {cases.map((_, index) => (
              <button
                type="button"
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-8 bg-[#E07B54]'
                    : 'w-2 bg-[#F0E6E0] hover:bg-[#FFE4D9]'
                }`}
                aria-label={t('testimonials.dotAria', { n: index + 1 })}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
