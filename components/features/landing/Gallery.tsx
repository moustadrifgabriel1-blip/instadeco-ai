'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

type GalleryItem = {
  id: number;
  before: string;
  after: string;
  styleSlug: string;
  roomSlug: string;
};

function GalleryCard({
  item,
  index,
  isVisible,
  roomName,
  beforeLabel,
  afterLabel,
  styleLine,
  altBefore,
  altAfter,
}: {
  item: GalleryItem;
  index: number;
  isVisible: boolean;
  roomName: string;
  beforeLabel: string;
  afterLabel: string;
  styleLine: string;
  altBefore: string;
  altAfter: string;
}) {
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
      <div className="relative aspect-[3/2] overflow-hidden">
        <Image
          src={item.before}
          alt={altBefore}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={`object-cover transition-opacity duration-500 ${showAfter ? 'opacity-0' : 'opacity-100'}`}
        />
        <Image
          src={item.after}
          alt={altAfter}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={`object-cover transition-opacity duration-500 ${showAfter ? 'opacity-100' : 'opacity-0'}`}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="absolute top-3 left-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              showAfter ? 'bg-[#E07B54] text-white' : 'bg-white/90 text-[#2D2D2D]'
            }`}
          >
            {showAfter ? afterLabel : beforeLabel}
          </span>
        </div>

        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-white font-medium">{roomName}</p>
          <p className="text-white/80 text-sm">{styleLine}</p>
        </div>
      </div>
    </div>
  );
}

export function Gallery() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const t = useTranslations('HomeLanding');
  const tHome = useTranslations('Home');
  const items = t.raw('gallery.items') as GalleryItem[];

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
    <section ref={sectionRef} className="py-20 lg:py-28 bg-[#FFF8F5]">
      <div className="container px-4 md:px-6">
        <div
          className={`text-center max-w-2xl mx-auto mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div className="badge-primary mx-auto mb-4">
            <span>{t('gallery.badgeEmoji')}</span>
            <span>{t('gallery.badgeText')}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-[#2D2D2D] mb-4">{t('gallery.title')}</h2>
          <p className="text-lg text-[#6B6B6B]">{t('gallery.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, index) => {
            const styleName = (tHome as (key: string) => string)(`styleNames.${item.styleSlug}`);
            const roomName = (tHome as (key: string) => string)(`roomNames.${item.roomSlug}`);
            const styleLine = t('gallery.styleLine', { style: styleName });
            const altBefore = t('gallery.altBefore', { room: roomName });
            const altAfter = t('gallery.altAfter', { room: roomName, style: styleName });
            return (
              <GalleryCard
                key={item.id}
                item={item}
                index={index}
                isVisible={isVisible}
                roomName={roomName}
                beforeLabel={t('gallery.before')}
                afterLabel={t('gallery.after')}
                styleLine={styleLine}
                altBefore={altBefore}
                altAfter={altAfter}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
