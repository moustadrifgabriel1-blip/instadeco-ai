'use client';

import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

export function BeforeAfter() {
  return (
    <div className="relative w-full aspect-[4/3] md:aspect-[16/9] rounded-xl overflow-hidden shadow-2xl border border-white/10">
      <ReactCompareSlider
        itemOne={
          <ReactCompareSliderImage
            src="https://images.unsplash.com/photo-1581539250439-c96689b516dd?q=80&w=1000&auto=format&fit=crop"
            srcSet=""
            alt="Avant décoration"
          />
        }
        itemTwo={
          <ReactCompareSliderImage
            src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1000&auto=format&fit=crop"
            srcSet=""
            alt="Après décoration IA"
          />
        }
        className="h-full w-full"
      />
      <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-sm font-medium border border-white/20">
        Avant
      </div>
      <div className="absolute bottom-4 right-4 bg-primary/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-sm font-medium border border-white/20">
        Après
      </div>
    </div>
  );
}
