'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { ReactCompareSlider } from 'react-compare-slider';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

type Slide = {
  id: string;
  before: string;
  after: string;
  title: string;
  description: string;
};

function OptimizedSliderImage({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 768px) 100vw, 50vw"
      className="object-cover"
      priority={priority}
    />
  );
}

export function BeforeAfter() {
  const t = useTranslations('HomeLanding');
  const slides = useMemo(() => t.raw('beforeAfter.slides') as Slide[], [t]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentPair = slides[currentIndex] ?? slides[0];

  if (!currentPair) return null;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative w-full">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-[#2D2D2D]">{currentPair.title}</h3>
        <p className="text-sm text-[#6B6B6B]">{currentPair.description}</p>
      </div>

      <div className="relative w-full aspect-[3/4] md:aspect-[4/3] rounded-xl overflow-hidden shadow-2xl border border-white/10">
        <ReactCompareSlider
          itemOne={
            <div className="relative w-full h-full">
              <OptimizedSliderImage
                src={currentPair.before}
                alt={t('beforeAfter.altBefore')}
                priority
              />
            </div>
          }
          itemTwo={
            <div className="relative w-full h-full">
              <OptimizedSliderImage
                src={currentPair.after}
                alt={t('beforeAfter.altAfter')}
                priority
              />
            </div>
          }
          className="h-full w-full"
          position={50}
        />

        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-sm font-medium border border-white/20">
          {t('beforeAfter.before')}
        </div>
        <div className="absolute bottom-4 right-4 bg-gradient-to-r from-purple-600 to-blue-500 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-sm font-medium border border-white/20">
          {t('beforeAfter.after')}
        </div>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors border border-white/20"
              aria-label={t('beforeAfter.prevAria')}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors border border-white/20"
              aria-label={t('beforeAfter.nextAria')}
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2">
              {slides.map((_, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                  aria-label={t('beforeAfter.dotAria', { n: index + 1 })}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
