'use client';

import Image from 'next/image';
import { useRef } from 'react';
import type { ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { prefersReducedMotion } from '@/lib/prestige-scroll';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface PrestigeEditorialProps {
  chapter: string;
  title: ReactNode;
  body: string;
  meta: string;
  image: string;
  alt: string;
  /** Image à gauche plutôt qu'à droite. */
  reverse?: boolean;
  ariaLabel: string;
}

/**
 * Chapitre éditorial : grande image en cadre, texte en regard. L'image se
 * déplace en parallax doux au scroll, le texte se pose à l'entrée en vue.
 * Sert à varier le rythme entre les moments forts (comparateur, le clou).
 */
export function PrestigeEditorial({
  chapter,
  title,
  body,
  meta,
  image,
  alt,
  reverse = false,
  ariaLabel,
}: PrestigeEditorialProps) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      const frame = root.current?.querySelector('[data-edito-img]');
      const text = root.current?.querySelectorAll('[data-edito-rise]');

      if (frame) {
        gsap.fromTo(
          frame,
          { yPercent: -8 },
          {
            yPercent: 8,
            ease: 'none',
            scrollTrigger: {
              trigger: root.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1,
              invalidateOnRefresh: true,
            },
          }
        );
      }

      if (text && text.length) {
        gsap.from(text, {
          autoAlpha: 0,
          y: 26,
          duration: 1,
          ease: 'power3.out',
          stagger: 0.12,
          scrollTrigger: {
            trigger: root.current,
            start: 'top 68%',
            once: true,
          },
        });
      }
    },
    { scope: root }
  );

  return (
    <section ref={root} className="relative w-full" aria-label={ariaLabel}>
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-[clamp(4rem,14vh,10rem)] sm:px-10 lg:grid-cols-12 lg:gap-16">
        {/* Cadre image */}
        <div
          className={`relative overflow-hidden rounded-sm border border-[var(--gold-line)] lg:col-span-7 ${
            reverse ? 'lg:order-2' : 'lg:order-1'
          }`}
        >
          <div className="relative aspect-[4/5] w-full sm:aspect-[5/4]">
            <div data-edito-img className="absolute -inset-y-[10%] inset-x-0 will-change-transform">
              <Image
                src={image}
                alt={alt}
                fill
                sizes="(min-width: 1024px) 680px, 100vw"
                className="object-cover object-center"
              />
            </div>
            <div className="prestige-edito-veil absolute inset-0" aria-hidden />
            <span className="absolute bottom-4 left-4 z-10 rounded-full border border-[var(--gold-line)] bg-[#0c0a09]/55 px-4 py-1.5 text-[0.6rem] font-light uppercase tracking-[0.3em] text-[var(--mist)] backdrop-blur-sm">
              {meta}
            </span>
          </div>
        </div>

        {/* Texte */}
        <div
          className={`lg:col-span-5 ${reverse ? 'lg:order-1' : 'lg:order-2'}`}
        >
          <div data-edito-rise className="prestige-eyebrow flex items-center gap-4">
            <span className="h-px w-10 bg-[var(--gold)]" aria-hidden />
            {chapter}
          </div>
          <h2
            data-edito-rise
            className="prestige-display mt-5 text-[clamp(1.9rem,4.6vw,3.6rem)] leading-[1.04]"
          >
            {title}
          </h2>
          <p
            data-edito-rise
            className="mt-6 max-w-md text-[clamp(0.98rem,1.7vw,1.15rem)] font-light leading-relaxed text-[var(--mist)]"
          >
            {body}
          </p>
          <div data-edito-rise className="prestige-rule mt-9 w-32" aria-hidden />
        </div>
      </div>
    </section>
  );
}
