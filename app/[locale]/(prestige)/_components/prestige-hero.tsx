'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { prefersReducedMotion } from './use-prestige-scroll';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * HERO — « L'Entrée ».
 *
 * - LCP : le titre N'EST PAS opacity:0 figé jusqu'au JS. L'entrée est
 *   100% CSS (classes .prestige-anim + --d). GSAP ne fait QUE le parallax
 *   de scroll (et il est sauté si prefers-reduced-motion).
 * - Aucun z-index négatif : couches de fond en flux normal (absolute
 *   inset-0), contenu en relative z-10. Compatible Safari iOS.
 */
export function PrestigeHero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      // Parallax doux de l'image de fond au scroll (transform only).
      const img = root.current?.querySelector('[data-hero-img]');
      if (img) {
        gsap.to(img, {
          yPercent: 14,
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
      }

      // Le voile s'assombrit en sortant du hero (renforce la transition)
      const veil = root.current?.querySelector('[data-hero-veil]');
      if (veil) {
        gsap.to(veil, {
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'center top',
            end: 'bottom top',
            scrub: true,
            invalidateOnRefresh: true,
          },
        });
      }
    },
    { scope: root }
  );

  return (
    <section
      ref={root}
      className="relative h-[100svh] min-h-[640px] w-full overflow-hidden"
      aria-label="L’entrée — bien d’exception"
    >
      {/* Couche image — flux normal, jamais z négatif */}
      <div className="absolute inset-0">
        <div data-hero-img className="prestige-hero-img absolute inset-0 will-change-transform">
          <Image
            src="https://tocgrsdlegabfkykhdrz.supabase.co/storage/v1/object/public/output-images/f88c9b68-eda4-4d67-bfb4-f631d21b37c6/8cf082e3-f460-4d66-b76a-6a4741cfe8e2.jpg"
            alt="Séjour contemporain mis en scène par home staging virtuel IA"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
        {/* Vignettage cinéma (gradient inline-safe via classe CSS) */}
        <div className="prestige-vignette absolute inset-0" aria-hidden />
        {/* Voile qui s'assombrit au scroll */}
        <div
          data-hero-veil
          className="absolute inset-0 bg-[#0c0a09] opacity-0"
          aria-hidden
        />
      </div>

      {/* Contenu — relative z-10 au-dessus des couches de fond */}
      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-end px-6 pb-[clamp(3rem,9vh,7rem)] sm:px-10">
        {/* Sur-titre or */}
        <div
          className="prestige-anim prestige-eyebrow flex items-center gap-4"
          style={{ ['--d' as string]: '150ms' }}
        >
          <span className="h-px w-10 bg-[var(--gold)]" aria-hidden />
          Home staging virtuel par IA · Agences de prestige
        </div>

        {/* Titre Cormorant énorme, accent or */}
        <h1
          className="prestige-anim prestige-display mt-6 max-w-4xl text-balance text-[clamp(2.6rem,8.4vw,7rem)] leading-[0.96] tracking-tight"
          style={{ ['--d' as string]: '320ms' }}
        >
          Vendez le rêve{' '}
          <span className="italic text-[var(--gold)]">avant la visite.</span>
        </h1>

        {/* Sous-titre court */}
        <p
          className="prestige-anim mt-7 max-w-xl text-[clamp(1rem,2.1vw,1.22rem)] font-light leading-relaxed text-[var(--mist)]"
          style={{ ['--d' as string]: '520ms' }}
        >
          Le home staging virtuel par IA pensé pour les agences immobilières
          de prestige. Vous envoyez la photo d&apos;une pièce, vous choisissez
          la mise en scène, le bien apparaît habité, désirable, prêt à
          déclencher le coup de cœur. En quelques secondes.
        </p>

        {/* CTA fort + filet or */}
        <div
          className="prestige-anim mt-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center"
          style={{ ['--d' as string]: '720ms' }}
        >
          <a
            href="#parcours"
            className="group inline-flex min-h-[52px] items-center gap-3 rounded-full border border-[var(--gold)] bg-[var(--gold)] px-8 py-3.5 text-sm font-medium uppercase tracking-[0.18em] text-[#0c0a09] transition-[transform,background-color,color] duration-500 ease-[var(--ease-slow)] hover:bg-transparent hover:text-[var(--gold)] focus-visible:bg-transparent focus-visible:text-[var(--gold)]"
          >
            Voir le service en action
            <span
              aria-hidden
              className="transition-transform duration-500 ease-[var(--ease-slow)] group-hover:translate-x-1"
            >
              →
            </span>
          </a>
          <span className="text-xs font-light uppercase tracking-[0.32em] text-[var(--mist)]">
            Rendu prêt en quelques secondes
          </span>
        </div>
      </div>

      {/* Méta verticale à droite, équilibre la composition et habille le vide */}
      <div
        className="prestige-anim-fade pointer-events-none absolute right-5 top-1/2 z-10 hidden -translate-y-1/2 flex-col items-center gap-6 sm:right-9 lg:flex"
        style={{ ['--d' as string]: '950ms' }}
        aria-hidden
      >
        <span className="h-14 w-px bg-[var(--gold-line)]" />
        <span className="prestige-eyebrow !text-[0.6rem] !tracking-[0.46em] text-[var(--mist)] [writing-mode:vertical-rl]">
          InstaDeco · MMXXVI
        </span>
        <span className="h-14 w-px bg-[var(--gold-line)]" />
      </div>

      {/* Indice de scroll, coin bas droit pour ne pas chevaucher le contenu */}
      <div
        className="prestige-anim-fade absolute bottom-7 right-6 z-10 flex flex-col items-center gap-3 sm:right-9"
        style={{ ['--d' as string]: '1100ms' }}
        aria-hidden
      >
        <span className="prestige-eyebrow !text-[0.56rem] !tracking-[0.34em] text-[var(--mist)] [writing-mode:vertical-rl]">
          Descendre
        </span>
        <span className="h-12 w-px animate-pulse bg-[var(--gold-line)]" />
      </div>
    </section>
  );
}
