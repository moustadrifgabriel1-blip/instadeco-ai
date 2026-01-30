'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

const transformations = [
  {
    id: 1,
    before: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop",
    after: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&h=400&fit=crop",
    style: "Moderne",
    room: "Salon"
  },
  {
    id: 2,
    before: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop",
    after: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&h=400&fit=crop",
    style: "Scandinave",
    room: "Chambre"
  },
  {
    id: 3,
    before: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&h=400&fit=crop",
    after: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop",
    style: "Minimaliste",
    room: "Cuisine"
  },
  {
    id: 4,
    before: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&h=400&fit=crop",
    after: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop",
    style: "Industriel",
    room: "Bureau"
  },
  {
    id: 5,
    before: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=600&h=400&fit=crop",
    after: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&h=400&fit=crop",
    style: "Bohème",
    room: "Salon"
  },
  {
    id: 6,
    before: "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=600&h=400&fit=crop",
    after: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&h=400&fit=crop",
    style: "Japandi",
    room: "Chambre"
  }
];

function GalleryCard({ item, index, isVisible }: { item: typeof transformations[0]; index: number; isVisible: boolean }) {
  const [showAfter, setShowAfter] = useState(false);

  return (
    <div 
      className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
      onMouseEnter={() => setShowAfter(true)}
      onMouseLeave={() => setShowAfter(false)}
    >
      {/* Images */}
      <div className="relative aspect-[3/2] overflow-hidden">
        <img
          src={item.before}
          alt={`${item.room} avant`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${showAfter ? 'opacity-0' : 'opacity-100'}`}
        />
        <img
          src={item.after}
          alt={`${item.room} après - style ${item.style}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${showAfter ? 'opacity-100' : 'opacity-0'}`}
        />
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Label Avant/Après */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
            showAfter 
              ? 'bg-[#E07B54] text-white' 
              : 'bg-white/90 text-[#2D2D2D]'
          }`}>
            {showAfter ? 'Après' : 'Avant'}
          </span>
        </div>

        {/* Info */}
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-white font-medium">{item.room}</p>
          <p className="text-white/80 text-sm">Style {item.style}</p>
        </div>
      </div>
    </div>
  );
}

export function Gallery() {
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
    <section ref={sectionRef} className="py-20 lg:py-28 bg-[#FFF8F5]">
      <div className="container px-4 md:px-6">
        {/* Header */}
        <div className={`text-center max-w-2xl mx-auto mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="badge-primary mx-auto mb-4">
            <span>🖼️</span>
            <span>Galerie</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-[#2D2D2D] mb-4">
            Avant / Après impressionnants
          </h2>
          <p className="text-lg text-[#6B6B6B]">
            Survolez les images pour voir la transformation
          </p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {transformations.map((item, index) => (
            <GalleryCard key={item.id} item={item} index={index} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  );
}
