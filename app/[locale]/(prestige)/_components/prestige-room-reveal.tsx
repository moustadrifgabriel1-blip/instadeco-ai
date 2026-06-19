'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { prefersReducedMotion } from '@/lib/prestige-scroll';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * CHAPITRE I, Le salon. Section PINNÉE au scroll.
 *
 * Deux temps, un seul geste :
 *  1. Révélation cinématique. Pendant le pin, l'« après » (pièce meublée)
 *     se dévoile au scrub, de la gauche vers la droite. Lent, sur 210 % de
 *     hauteur d'écran, pour que la pièce se meuble vraiment sous les yeux.
 *  2. Comparateur. Dès que la révélation est complète, la barre devient
 *     interactive et définitive : l'utilisateur glisse pour comparer avant
 *     et après lui même. Le scroll ne reprend plus la main (pas de
 *     re-masquage en remontant). Souris, tactile et clavier.
 *
 * Dégradations :
 *  - prefers-reduced-motion : pas de pin ni de scrub. On affiche d'emblée
 *    le comparateur à mi course, déjà manipulable.
 *  - mobile (<1024px) : révélation au défilement sans pin, puis comparateur.
 */
export function PrestigeRoomReveal() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const pinEl = root.current?.querySelector<HTMLElement>('[data-room-pin]');
      const stage = root.current?.querySelector<HTMLElement>('[data-room-stage]');
      const after = root.current?.querySelector<HTMLElement>('[data-room-after]');
      const handle = root.current?.querySelector<HTMLElement>('[data-room-handle]');
      const caption = root.current?.querySelector<HTMLElement>('[data-room-caption]');
      const scrollHint = root.current?.querySelector<HTMLElement>('[data-room-scrollhint]');
      const dragHint = root.current?.querySelector<HTMLElement>('[data-room-draghint]');
      if (!pinEl || !stage || !after || !handle || !caption) return;

      const state = { p: 0, interactive: false, dragging: false };

      const apply = (raw: number) => {
        const p = Math.min(1, Math.max(0, raw));
        state.p = p;
        after.style.clipPath = `inset(0 ${(1 - p) * 100}% 0 0)`;
        handle.style.left = `${p * 100}%`;
        const pct = Math.round(p * 100);
        handle.setAttribute('aria-valuenow', String(pct));
        handle.setAttribute('aria-valuetext', `${pct} % de la version après`);
      };

      const enableInteractive = () => {
        if (state.interactive) return;
        state.interactive = true;
        apply(1);
        stage.dataset.interactive = 'true';
        handle.style.pointerEvents = 'auto';
        handle.setAttribute('tabindex', '0');
        gsap.to(caption, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' });
        if (scrollHint) gsap.to(scrollHint, { autoAlpha: 0, duration: 0.4 });
        if (dragHint) gsap.to(dragHint, { autoAlpha: 1, duration: 0.6, delay: 0.1 });
      };

      // --- Glisser / cliquer (actif seulement après révélation) ---
      const setFromClientX = (clientX: number) => {
        const rect = stage.getBoundingClientRect();
        apply((clientX - rect.left) / rect.width);
      };
      const onDown = (e: PointerEvent) => {
        if (!state.interactive) return;
        state.dragging = true;
        try {
          stage.setPointerCapture(e.pointerId);
        } catch {
          /* noop */
        }
        setFromClientX(e.clientX);
      };
      const onMove = (e: PointerEvent) => {
        if (!state.dragging) return;
        setFromClientX(e.clientX);
      };
      const onUp = () => {
        state.dragging = false;
      };
      const onKey = (e: KeyboardEvent) => {
        if (!state.interactive) return;
        if (e.key === 'ArrowLeft') {
          apply(state.p - 0.04);
          e.preventDefault();
        } else if (e.key === 'ArrowRight') {
          apply(state.p + 0.04);
          e.preventDefault();
        } else if (e.key === 'Home') {
          apply(0);
          e.preventDefault();
        } else if (e.key === 'End') {
          apply(1);
          e.preventDefault();
        }
      };

      stage.addEventListener('pointerdown', onDown);
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      handle.addEventListener('keydown', onKey);

      const mm = gsap.matchMedia();

      if (prefersReducedMotion()) {
        // On offre directement le comparateur, déjà à mi course.
        apply(0.5);
        enableInteractive();
      } else {
        // Desktop / tablette large : pin + scrub lent, puis comparateur.
        mm.add('(min-width: 1024px)', () => {
          apply(0);
          gsap.set(caption, { autoAlpha: 0, y: 20 });
          if (dragHint) gsap.set(dragHint, { autoAlpha: 0 });
          const proxy = { v: 0 };
          const tween = gsap.to(proxy, {
            v: 1,
            ease: 'none',
            scrollTrigger: {
              // On pin le WRAPPER pleine hauteur (pas le stage étroit) : pendant
              // le pin il occupe tout le viewport, donc le comparateur reste
              // centré, sans saut de largeur ni découpe.
              trigger: pinEl,
              start: 'top top',
              end: '+=210%',
              scrub: 1.3,
              pin: pinEl,
              pinSpacing: true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
            onUpdate: () => {
              if (state.interactive) return;
              // Révélation complète à 82 % du pin, le reste = fenêtre
              // interactive avant que la scène ne se libère.
              const rp = Math.min(1, proxy.v / 0.82);
              apply(rp);
              if (rp >= 0.999) enableInteractive();
            },
          });
          return () => {
            tween.scrollTrigger?.kill();
            tween.kill();
          };
        });

        // Mobile : révélation au défilement (sans pin), puis comparateur.
        mm.add('(max-width: 1023px)', () => {
          apply(0);
          gsap.set(caption, { autoAlpha: 0, y: 14 });
          if (dragHint) gsap.set(dragHint, { autoAlpha: 0 });
          const proxy = { v: 0 };
          const tween = gsap.to(proxy, {
            v: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: stage,
              start: 'top 72%',
              end: 'bottom 58%',
              scrub: 0.9,
              invalidateOnRefresh: true,
            },
            onUpdate: () => {
              if (state.interactive) return;
              apply(proxy.v);
              if (proxy.v >= 0.999) enableInteractive();
            },
          });
          return () => {
            tween.scrollTrigger?.kill();
            tween.kill();
          };
        });
      }

      return () => {
        stage.removeEventListener('pointerdown', onDown);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        handle.removeEventListener('keydown', onKey);
        mm.revert();
      };
    },
    { scope: root }
  );

  return (
    <section
      ref={root}
      id="parcours"
      className="relative w-full"
      aria-label="Chapitre un, le salon"
    >
      {/* En tête de chapitre */}
      <div className="mx-auto max-w-6xl px-6 pt-[clamp(4rem,12vh,9rem)] sm:px-10">
        <div className="prestige-eyebrow flex items-center gap-4">
          <span className="h-px w-10 bg-[var(--gold)]" aria-hidden />
          La démonstration
        </div>
        <h2 className="prestige-display mt-5 max-w-3xl text-[clamp(2rem,5.6vw,4.2rem)] leading-[1.02]">
          Une vraie photo. Le service à l&apos;
          <span className="italic text-[var(--gold)]">œuvre</span>.
        </h2>
        <p className="mt-5 max-w-xl text-[clamp(0.95rem,1.8vw,1.1rem)] font-light text-[var(--mist)]">
          Voici une pièce telle que votre client vous l&apos;envoie. Correcte,
          mais sans relief, le genre qu&apos;on oublie sitôt la porte refermée.
          Déroulez, et regardez le service la transformer. Aucun chantier, aucun
          loueur de mobilier, aucune attente.
        </p>
        <div className="prestige-rule mt-10 w-full" aria-hidden />
      </div>

      {/* Wrapper PINNÉ pleine hauteur : on pin ce conteneur (et non le stage
          étroit) pour que, pendant le pin, le comparateur reste centré dans le
          viewport, sans saut de largeur ni découpe. Pas de min-h sur mobile
          (le pin n'est actif qu'en >=1024px). */}
      <div
        data-room-pin
        className="flex w-full items-center justify-center px-6 py-[clamp(2.5rem,7vh,5rem)] sm:px-10 lg:min-h-[100svh] lg:py-0"
      >
        <div
          data-room-stage
          className="prestige-compare-stage relative aspect-[4/5] max-h-[86svh] w-full max-w-6xl touch-pan-y select-none overflow-hidden rounded-sm border border-[var(--gold-line)] sm:aspect-[16/10]"
        >
          {/* AVANT, pièce vide / datée (couche du dessous) */}
          <div className="absolute inset-0">
            <Image
              src="https://tocgrsdlegabfkykhdrz.supabase.co/storage/v1/object/public/input-images/f88c9b68-eda4-4d67-bfb4-f631d21b37c6/1781787540154.jpg"
              alt="Salon vide aux murs nus, photo brute avant mise en scène"
              fill
              sizes="(min-width: 1024px) 1152px, 100vw"
              className="object-cover object-center"
              draggable={false}
            />
            <span className="absolute left-4 top-4 z-10 rounded-full border border-[var(--gold-line)] bg-[#0c0a09]/55 px-4 py-1.5 text-[0.62rem] font-light uppercase tracking-[0.32em] text-[var(--mist)] backdrop-blur-sm">
              Avant
            </span>
          </div>

          {/* APRÈS, pièce meublée (couche superposée, masquée au départ) */}
          <div
            data-room-after
            className="absolute inset-0"
            style={{ clipPath: 'inset(0 100% 0 0)' }}
          >
            <Image
              src="https://tocgrsdlegabfkykhdrz.supabase.co/storage/v1/object/public/output-images/gemini/1781862702952-ec11kc.jpg"
              alt="Le même salon mis en scène par le service, intérieur scandinave épuré et chaleureux"
              fill
              sizes="(min-width: 1024px) 1152px, 100vw"
              className="object-cover object-center"
              draggable={false}
            />
            <span className="absolute right-4 top-4 z-10 rounded-full border border-[var(--gold)] bg-[var(--gold)]/90 px-4 py-1.5 text-[0.62rem] font-medium uppercase tracking-[0.32em] text-[#0c0a09]">
              Après
            </span>
            <div className="prestige-room-veil absolute inset-0" aria-hidden />
          </div>

          {/* Poignée de révélation puis de comparaison */}
          <div
            data-room-handle
            role="slider"
            aria-label="Comparer avant et après"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={0}
            tabIndex={-1}
            className="prestige-compare-handle pointer-events-none absolute top-0 z-30 h-full"
            style={{ left: '0%' }}
          >
            <span className="prestige-compare-line" aria-hidden />
            <span className="prestige-compare-knob" aria-hidden>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
                <path
                  d="M9 6l-4 6 4 6M15 6l4 6-4 6"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>

          {/* Légende (nom de pièce + style) */}
          <div
            data-room-caption
            className="pointer-events-none absolute bottom-0 left-0 z-20 w-full p-6 sm:p-9"
            style={{ opacity: 0 }}
          >
            <div className="prestige-eyebrow !text-[var(--gold)]">Mise en scène appliquée</div>
            <p className="prestige-display mt-2 text-[clamp(1.4rem,3.4vw,2.4rem)] leading-tight">
              Scandinave épuré,{' '}
              <span className="italic">livré en quelques secondes</span>
            </p>
          </div>
        </div>

        {/* Indices : défilement avant révélation, puis glisser pour comparer */}
        <div className="relative mt-6 h-5 text-center">
          <p
            data-room-scrollhint
            className="absolute inset-x-0 text-[0.7rem] font-light uppercase tracking-[0.3em] text-[var(--mist)]"
          >
            Continuez à dérouler, le service opère
          </p>
          <p
            data-room-draghint
            className="absolute inset-x-0 text-[0.7rem] font-light uppercase tracking-[0.3em] text-[var(--gold)]"
            style={{ opacity: 0 }}
          >
            À vous. Glissez la barre pour comparer
          </p>
        </div>
      </div>
    </section>
  );
}
