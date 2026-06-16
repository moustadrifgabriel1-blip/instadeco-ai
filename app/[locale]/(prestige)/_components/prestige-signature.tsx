'use client';

import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Link } from '@/i18n/navigation';
import { prefersReducedMotion } from '@/lib/prestige-scroll';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * SIGNATURE, la sortie. On reconduit le visiteur vers la porte, mais cette
 * fois c'est lui qui repart avec l'idée. Appel clair pour les agences.
 */
export function PrestigeSignature() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const items = root.current?.querySelectorAll('[data-sign-rise]');
      if (items && items.length) {
        gsap.from(items, {
          autoAlpha: 0,
          y: 30,
          duration: 1,
          ease: 'power3.out',
          stagger: 0.12,
          scrollTrigger: { trigger: root.current, start: 'top 72%', once: true },
        });
      }
    },
    { scope: root }
  );

  return (
    <section
      ref={root}
      className="relative w-full border-t border-[var(--gold-line)]"
      aria-label="Signature et appel aux agences"
    >
      <div className="mx-auto max-w-4xl px-6 py-[clamp(5rem,18vh,12rem)] text-center sm:px-10">
        <div data-sign-rise className="prestige-rule mx-auto mb-10 w-40" aria-hidden />
        <div data-sign-rise className="prestige-eyebrow justify-center">
          Pour les agences de prestige
        </div>
        <h2
          data-sign-rise
          className="prestige-display mx-auto mt-6 max-w-3xl text-[clamp(2.1rem,5.6vw,4.4rem)] leading-[1.02]"
        >
          Donnez à chaque bien la mise en scène{' '}
          <span className="italic text-[var(--gold)]">qu&apos;il mérite</span>.
        </h2>
        <p
          data-sign-rise
          className="mx-auto mt-7 max-w-xl text-[clamp(1rem,1.9vw,1.2rem)] font-light leading-relaxed text-[var(--mist)]"
        >
          Mettez en valeur tout votre portefeuille, autant de fois que vous le
          souhaitez. Vos acquéreurs se projettent, vos biens partent plus vite,
          votre vitrine inspire confiance. Rejoignez les agences qui vendent le
          rêve avant même la première visite.
        </p>

        <div
          data-sign-rise
          className="mt-11 flex flex-col items-center justify-center gap-5 sm:flex-row"
        >
          <Link
            href="/pro"
            className="group inline-flex min-h-[54px] items-center gap-3 rounded-full border border-[var(--gold)] bg-[var(--gold)] px-9 py-3.5 text-sm font-medium uppercase tracking-[0.18em] text-[#0c0a09] transition-[background-color,color] duration-500 ease-[var(--ease-slow)] hover:bg-transparent hover:text-[var(--gold)] focus-visible:bg-transparent focus-visible:text-[var(--gold)]"
          >
            Découvrir l&apos;offre agences
            <span
              aria-hidden
              className="transition-transform duration-500 ease-[var(--ease-slow)] group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
          <Link
            href="/exemples"
            className="inline-flex min-h-[54px] items-center gap-2 px-2 text-sm font-light uppercase tracking-[0.2em] text-[var(--mist)] underline-offset-8 transition-colors duration-500 hover:text-[var(--gold)] hover:underline focus-visible:text-[var(--gold)]"
          >
            Voir des exemples
          </Link>
        </div>

        <p data-sign-rise className="mt-12 text-[0.72rem] font-light uppercase tracking-[0.34em] text-[var(--mist)]">
          InstaDeco · Home staging virtuel par IA
        </p>
      </div>
    </section>
  );
}
