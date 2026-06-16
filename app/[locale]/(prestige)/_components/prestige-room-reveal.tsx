'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { prefersReducedMotion } from './use-prestige-scroll';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * PARCOURS — Le salon. Section PINNÉE au scroll.
 *
 * Pendant le pin, l'« après » (pièce meublée) se révèle au SCRUB par
 * un clip-path inset piloté par scrollTrigger : la couche « après » est
 * superposée à l'« avant » (pièce vide/datée) et son masque s'ouvre de
 * la gauche vers la droite — la pièce se meuble sous nos yeux.
 *
 * Dégradations :
 *  - prefers-reduced-motion → pas de pin/scrub : on affiche l'« après »
 *    en entier avec une légende, état final immédiat.
 *  - mobile (<1024px via matchMedia) → on remplace le pin/scrub par un
 *    simple whileInView-like (clip-path animé à l'entrée, sans pin) pour
 *    éviter le scroll vide janky sur petit écran.
 */
export function PrestigeRoomReveal() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      const stage = root.current?.querySelector('[data-room-stage]');
      const after = root.current?.querySelector<HTMLElement>('[data-room-after]');
      const handle = root.current?.querySelector<HTMLElement>('[data-room-handle]');
      const caption = root.current?.querySelector<HTMLElement>('[data-room-caption]');
      if (!stage || !after || !handle || !caption) return;

      const mm = gsap.matchMedia();

      // === Desktop / tablette large : PIN + SCRUB ===
      mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.set(after, { clipPath: 'inset(0 100% 0 0)' });
        gsap.set(handle, { left: '0%' });
        gsap.set(caption, { autoAlpha: 0, y: 18 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: '+=160%',
            scrub: 1,
            pin: stage,
            pinSpacing: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        // La pièce se meuble (révélation gauche → droite)
        tl.to(after, { clipPath: 'inset(0 0% 0 0)', ease: 'none' }, 0)
          .to(handle, { left: '100%', ease: 'none' }, 0)
          // La légende monte en fin de révélation
          .to(caption, { autoAlpha: 1, y: 0, ease: 'power2.out', duration: 0.18 }, 0.7);

        return () => {
          gsap.set([after, handle, caption], { clearProps: 'all' });
        };
      });

      // === Mobile : pas de pin, révélation à l'entrée en viewport ===
      mm.add('(max-width: 1023px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.set(after, { clipPath: 'inset(0 100% 0 0)' });
        gsap.set(handle, { left: '0%' });
        gsap.set(caption, { autoAlpha: 0, y: 14 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: stage,
            start: 'top 70%',
            end: 'bottom 55%',
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });
        tl.to(after, { clipPath: 'inset(0 0% 0 0)', ease: 'none' }, 0)
          .to(handle, { left: '100%', ease: 'none' }, 0)
          .to(caption, { autoAlpha: 1, y: 0, duration: 0.2 }, 0.6);

        return () => {
          gsap.set([after, handle, caption], { clearProps: 'all' });
        };
      });
    },
    { scope: root }
  );

  const reduced = typeof window !== 'undefined' && prefersReducedMotion();

  return (
    <section
      ref={root}
      id="parcours"
      className="relative w-full"
      aria-label="Le parcours — le salon"
    >
      {/* En-tête de chapitre */}
      <div className="mx-auto max-w-6xl px-6 pt-[clamp(4rem,12vh,9rem)] sm:px-10">
        <div className="prestige-eyebrow flex items-center gap-4">
          <span className="h-px w-10 bg-[var(--gold)]" aria-hidden />
          Chapitre I — Le salon
        </div>
        <h2 className="prestige-display mt-5 max-w-3xl text-[clamp(2rem,5.6vw,4.2rem)] leading-[1.02]">
          Entrez. La pièce se{' '}
          <span className="italic text-[var(--gold)]">révèle</span>.
        </h2>
        <p className="mt-5 max-w-xl text-[clamp(0.95rem,1.8vw,1.1rem)] font-light text-[var(--mist)]">
          Déroulez pour transformer ce séjour brut en intérieur signé. Aucun
          travaux, aucun déplacement — la projection que vos acquéreurs
          n’oublieront pas.
        </p>
        <div className="prestige-rule mt-10 w-full" aria-hidden />
      </div>

      {/* Scène (élément pinné) */}
      <div className="mx-auto max-w-6xl px-6 py-[clamp(2.5rem,7vh,5rem)] sm:px-10">
        <div
          data-room-stage
          className="relative aspect-[4/5] w-full overflow-hidden rounded-sm border border-[var(--gold-line)] sm:aspect-[16/10]"
        >
          {/* AVANT — pièce vide / datée (couche du dessous, flux normal) */}
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=2200&q=80"
              alt="Salon avant home staging : pièce vide aux murs nus"
              fill
              sizes="(min-width: 1024px) 1152px, 100vw"
              className="object-cover object-center"
            />
            {/* étiquette AVANT */}
            <span className="absolute left-4 top-4 z-10 rounded-full border border-[var(--gold-line)] bg-[#0c0a09]/55 px-4 py-1.5 text-[0.62rem] font-light uppercase tracking-[0.32em] text-[var(--mist)] backdrop-blur-sm">
              Avant
            </span>
          </div>

          {/* APRÈS — pièce meublée (couche superposée, masquée au départ) */}
          <div
            data-room-after
            className="absolute inset-0"
            style={
              reduced ? undefined : { clipPath: 'inset(0 100% 0 0)' }
            }
          >
            <Image
              src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=2200&q=80"
              alt="Salon après home staging virtuel : intérieur contemporain meublé et chaleureux"
              fill
              sizes="(min-width: 1024px) 1152px, 100vw"
              className="object-cover object-center"
            />
            {/* étiquette APRÈS */}
            <span className="absolute right-4 top-4 z-10 rounded-full border border-[var(--gold)] bg-[var(--gold)]/90 px-4 py-1.5 text-[0.62rem] font-medium uppercase tracking-[0.32em] text-[#0c0a09]">
              Après
            </span>
            {/* voile bas pour la légende */}
            <div className="prestige-room-veil absolute inset-0" aria-hidden />
          </div>

          {/* Ligne de révélation (curseur or) — caché en reduced-motion */}
          {!reduced && (
            <div
              data-room-handle
              className="prestige-reveal-handle pointer-events-none absolute top-0 z-20 h-full w-px"
              style={{ left: '0%' }}
              aria-hidden
            />
          )}

          {/* Légende élégante (nom de pièce + style) */}
          <div
            data-room-caption
            className="absolute bottom-0 left-0 z-20 w-full p-6 sm:p-9"
            style={reduced ? undefined : { opacity: 0 }}
          >
            <div className="prestige-eyebrow !text-[var(--gold)]">
              Le salon · 48 m²
            </div>
            <p className="prestige-display mt-2 text-[clamp(1.4rem,3.4vw,2.4rem)] leading-tight">
              Style appliqué :{' '}
              <span className="italic">Contemporain chaleureux</span>
            </p>
          </div>
        </div>

        {/* Indice (desktop pin) — disparaît si reduced-motion */}
        {!reduced && (
          <p className="mt-6 hidden text-center text-[0.7rem] font-light uppercase tracking-[0.3em] text-[var(--mist)] lg:block">
            Continuez à dérouler — la pièce se meuble
          </p>
        )}
      </div>
    </section>
  );
}
