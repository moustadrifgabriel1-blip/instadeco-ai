'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { prefersReducedMotion } from '@/lib/prestige-scroll';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface PrestigeCompareProps {
  before: string;
  after: string;
  beforeAlt: string;
  afterAlt: string;
  eyebrow?: string;
  caption?: string;
  className?: string;
  priority?: boolean;
}

/**
 * Comparateur avant/après réutilisable (vitrine exemples, home). Se révèle
 * une fois à l'entrée en vue (clip animé), puis reste pleinement interactif :
 * souris, tactile, clavier. Pas de pin ni de scroll lock, contrairement au
 * comparateur signature du flagship /visite. Styles dans app/globals.css
 * (.prestige-compare-*), tokens via .prestige-root / .prestige-app parent.
 */
export function PrestigeCompare({
  before,
  after,
  beforeAlt,
  afterAlt,
  eyebrow,
  caption,
  className,
  priority,
}: PrestigeCompareProps) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const stage = root.current?.querySelector<HTMLElement>('[data-cmp-stage]');
      const afterEl = root.current?.querySelector<HTMLElement>('[data-cmp-after]');
      const handle = root.current?.querySelector<HTMLElement>('[data-cmp-handle]');
      if (!stage || !afterEl || !handle) return;

      const state = { p: 0.5, dragging: false };
      const apply = (raw: number) => {
        const p = Math.min(1, Math.max(0, raw));
        state.p = p;
        afterEl.style.clipPath = `inset(0 ${(1 - p) * 100}% 0 0)`;
        handle.style.left = `${p * 100}%`;
        const pct = Math.round(p * 100);
        handle.setAttribute('aria-valuenow', String(pct));
        handle.setAttribute('aria-valuetext', `${pct} % de la version après`);
      };
      const setFromClientX = (clientX: number) => {
        const rect = stage.getBoundingClientRect();
        apply((clientX - rect.left) / rect.width);
      };
      const onDown = (e: PointerEvent) => {
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
      stage.dataset.interactive = 'true';

      let tween: gsap.core.Tween | null = null;
      if (prefersReducedMotion()) {
        apply(0.5);
      } else {
        apply(0);
        const proxy = { v: 0 };
        tween = gsap.to(proxy, {
          v: 0.5,
          ease: 'power2.out',
          duration: 1.1,
          scrollTrigger: { trigger: stage, start: 'top 80%', once: true },
          onUpdate: () => apply(proxy.v),
        });
      }

      return () => {
        stage.removeEventListener('pointerdown', onDown);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        handle.removeEventListener('keydown', onKey);
        tween?.scrollTrigger?.kill();
        tween?.kill();
      };
    },
    { scope: root }
  );

  return (
    <div ref={root} className={className}>
      <div
        data-cmp-stage
        className="prestige-compare-stage relative aspect-[4/5] w-full touch-pan-y select-none overflow-hidden rounded-sm border border-[var(--gold-line)] sm:aspect-[16/10]"
      >
        {/* AVANT */}
        <div className="absolute inset-0">
          <Image
            src={before}
            alt={beforeAlt}
            fill
            sizes="(min-width: 1024px) 1100px, 100vw"
            className="object-cover object-center"
            draggable={false}
            priority={priority}
          />
          <span className="absolute left-4 top-4 z-10 rounded-full border border-[var(--gold-line)] bg-[#0c0a09]/55 px-4 py-1.5 text-[0.6rem] font-light uppercase tracking-[0.3em] text-[var(--mist)] backdrop-blur-sm">
            Avant
          </span>
        </div>

        {/* APRÈS */}
        <div data-cmp-after className="absolute inset-0" style={{ clipPath: 'inset(0 50% 0 0)' }}>
          <Image
            src={after}
            alt={afterAlt}
            fill
            sizes="(min-width: 1024px) 1100px, 100vw"
            className="object-cover object-center"
            draggable={false}
            priority={priority}
          />
          <span className="absolute right-4 top-4 z-10 rounded-full border border-[var(--gold)] bg-[var(--gold)]/90 px-4 py-1.5 text-[0.6rem] font-medium uppercase tracking-[0.3em] text-[#0c0a09]">
            Après
          </span>
          {caption && <div className="prestige-room-veil absolute inset-0" aria-hidden />}
        </div>

        {/* Poignée */}
        <div
          data-cmp-handle
          role="slider"
          aria-label="Comparer avant et après"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={50}
          tabIndex={0}
          className="prestige-compare-handle absolute top-0 z-30 h-full"
          style={{ left: '50%' }}
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

        {/* Légende */}
        {caption && (
          <div className="pointer-events-none absolute bottom-0 left-0 z-20 w-full p-5 sm:p-7">
            {eyebrow && <div className="prestige-eyebrow !text-[var(--gold)]">{eyebrow}</div>}
            <p className="prestige-display mt-1.5 text-[clamp(1.1rem,2.6vw,1.8rem)] leading-tight">
              {caption}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
