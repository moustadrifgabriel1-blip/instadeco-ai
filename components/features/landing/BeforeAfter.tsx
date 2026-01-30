'use client';

import { useState } from 'react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Paires d'images avant/après réelles
const beforeAfterPairs = [
  {
    id: 'chambre-boheme',
    // Remplacer par les vraies images locales une fois téléchargées
    before: '/images/before-chambre-1.jpg',
    after: '/images/after-chambre-1.jpg',
    title: 'Chambre → Style Bohème Moderne',
    description: 'Sol, meubles et décoration transformés par notre IA'
  },
  // Fallback avec images Unsplash si les locales ne sont pas dispo
];

export function BeforeAfter() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentPair = beforeAfterPairs[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? beforeAfterPairs.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === beforeAfterPairs.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative w-full">
      {/* Titre de la transformation */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-white">{currentPair.title}</h3>
        <p className="text-sm text-white/60">{currentPair.description}</p>
      </div>

      {/* Slider de comparaison */}
      <div className="relative w-full aspect-[3/4] md:aspect-[4/3] rounded-xl overflow-hidden shadow-2xl border border-white/10">
        <ReactCompareSlider
          itemOne={
            <ReactCompareSliderImage
              src={currentPair.before}
              alt="Avant décoration"
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />
          }
          itemTwo={
            <ReactCompareSliderImage
              src={currentPair.after}
              alt="Après décoration IA"
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />
          }
          className="h-full w-full"
          position={50}
        />
        
        {/* Labels Avant/Après */}
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-sm font-medium border border-white/20">
          Avant
        </div>
        <div className="absolute bottom-4 right-4 bg-gradient-to-r from-purple-600 to-blue-500 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-sm font-medium border border-white/20">
          Après IA ✨
        </div>

        {/* Navigation (si plusieurs paires) */}
        {beforeAfterPairs.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors border border-white/20"
              aria-label="Précédent"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors border border-white/20"
              aria-label="Suivant"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Indicateurs de pagination */}
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2">
              {beforeAfterPairs.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                  aria-label={`Voir transformation ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
