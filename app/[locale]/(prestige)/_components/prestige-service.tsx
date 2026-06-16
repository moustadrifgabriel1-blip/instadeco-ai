'use client';

import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { prefersReducedMotion } from './use-prestige-scroll';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const STEPS = [
  {
    num: '01',
    title: 'Photographiez',
    body: 'Une photo de la pièce, prise au téléphone, suffit. Vide, datée, en travaux, peu importe le point de départ.',
  },
  {
    num: '02',
    title: 'Choisissez la mise en scène',
    body: 'Le style qui parle à votre clientèle. Du contemporain feutré au classique parisien, la pièce s’habille à votre image.',
  },
  {
    num: '03',
    title: 'Présentez le rêve',
    body: 'Le rendu vous revient en quelques secondes. Prêt pour l’annonce, prêt pour la visite, prêt à déclencher le coup de cœur.',
  },
];

/**
 * LE SERVICE — présenté simplement, après l'émotion. Trois gestes, rien de
 * plus. C'est ici qu'on explique le home staging virtuel de façon claire et
 * minimaliste, une fois que la valeur a été ressentie.
 */
export function PrestigeService() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const items = root.current?.querySelectorAll('[data-step]');
      if (items && items.length) {
        gsap.from(items, {
          autoAlpha: 0,
          y: 30,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.16,
          scrollTrigger: { trigger: root.current, start: 'top 70%', once: true },
        });
      }
    },
    { scope: root }
  );

  return (
    <section
      ref={root}
      id="service"
      className="relative w-full border-t border-[var(--gold-line)]"
      aria-label="Le service en trois gestes"
    >
      <div className="mx-auto max-w-6xl px-6 py-[clamp(4.5rem,15vh,10rem)] sm:px-10">
        <div className="max-w-2xl">
          <div className="prestige-eyebrow flex items-center gap-4">
            <span className="h-px w-10 bg-[var(--gold)]" aria-hidden />
            La méthode
          </div>
          <h2 className="prestige-display mt-5 text-[clamp(1.9rem,4.8vw,3.6rem)] leading-[1.04]">
            Trois gestes. Aucun chantier. Le résultat,{' '}
            <span className="italic text-[var(--gold)]">tout de suite</span>.
          </h2>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-sm border border-[var(--gold-line)] sm:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.num}
              data-step
              className="bg-[var(--stone-900)]/40 p-8 sm:p-10"
            >
              <span className="prestige-display block text-[clamp(2.4rem,4vw,3.2rem)] leading-none text-[var(--gold)]">
                {step.num}
              </span>
              <h3 className="prestige-display mt-6 text-[clamp(1.2rem,2.2vw,1.6rem)]">
                {step.title}
              </h3>
              <p className="mt-3 text-[0.95rem] font-light leading-relaxed text-[var(--mist)]">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
