'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { prefersReducedMotion } from '@/lib/prestige-scroll';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * LE CLOU, le sommet de la visite. Section plein écran épinglée : l'image
 * grandiose se rapproche lentement pendant que la phrase la plus forte se
 * pose, mot par mot. C'est le moment qu'on garde pour la fin.
 */
export function PrestigeClimax() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      const img = root.current?.querySelector('[data-climax-img]');
      const lines = root.current?.querySelectorAll('[data-climax-line]');
      const kicker = root.current?.querySelector('[data-climax-kicker]');

      const mm = gsap.matchMedia();

      // Desktop / tablette large : section epinglee, l'image se rapproche et la
      // phrase se pose mot a mot pendant le pin (l'effet « clou » d'origine).
      mm.add('(min-width: 1024px)', () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: '+=170%',
            scrub: 1.1,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        if (img) tl.fromTo(img, { scale: 1.18 }, { scale: 1, ease: 'none' }, 0);
        if (kicker) tl.fromTo(kicker, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, ease: 'power2.out' }, 0.08);
        if (lines && lines.length) {
          tl.fromTo(
            lines,
            { autoAlpha: 0, y: 40 },
            { autoAlpha: 1, y: 0, ease: 'power3.out', stagger: 0.14, duration: 0.6 },
            0.16
          );
        }
        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      });

      // Mobile / tactile : AUCUN pin (le pin epingle l'ecran et bloque le
      // scroll au doigt). L'image se rapproche doucement au defilement et la
      // phrase apparait a l'entree dans le viewport, scroll 100 % natif.
      mm.add('(max-width: 1023px)', () => {
        if (img) {
          gsap.fromTo(
            img,
            { scale: 1.12 },
            {
              scale: 1,
              ease: 'none',
              scrollTrigger: {
                trigger: root.current,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 0.8,
                invalidateOnRefresh: true,
              },
            }
          );
        }
        const reveal = [kicker, ...(lines ? Array.from(lines) : [])].filter(Boolean);
        const tl = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: 'top 72%', invalidateOnRefresh: true },
        });
        tl.fromTo(
          reveal,
          { autoAlpha: 0, y: 28 },
          { autoAlpha: 1, y: 0, ease: 'power3.out', stagger: 0.1, duration: 0.6 }
        );
        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      });

      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section
      ref={root}
      className="relative h-[100svh] min-h-[620px] w-full overflow-hidden"
      aria-label="Le clou de la visite"
    >
      {/* Fond grandiose */}
      <div className="absolute inset-0">
        <div data-climax-img className="absolute inset-0 will-change-transform">
          <Image
            src="https://tocgrsdlegabfkykhdrz.supabase.co/storage/v1/object/public/output-images/gemini/1782047276535-qdemla.jpg"
            alt="Séjour mis en scène au crépuscule, ambiance chaleureuse et habitée"
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
        <div className="prestige-climax-veil absolute inset-0" aria-hidden />
      </div>

      {/* Phrase sommet */}
      <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-6 text-center sm:px-10">
        <div data-climax-kicker className="prestige-eyebrow justify-center">
          Ce que ça change pour vous
        </div>
        <p className="prestige-display mt-7 text-[clamp(2.1rem,6.4vw,5.4rem)] leading-[1.02]">
          <span data-climax-line className="block">
            Le moment où l&apos;acheteur
          </span>
          <span data-climax-line className="block">
            cesse de visiter un bien
          </span>
          <span data-climax-line className="block italic text-[var(--gold)]">
            et commence à s&apos;y voir vivre.
          </span>
        </p>
        <p
          data-climax-line
          className="mt-9 max-w-xl text-[clamp(0.98rem,1.8vw,1.18rem)] font-light leading-relaxed text-[var(--mist)]"
        >
          Une pièce vide se visite. Une pièce habitée se désire. C&apos;est dans
          cette bascule que se joue la vente, et c&apos;est précisément ce que
          votre service déclenche. Des acquéreurs qui se projettent, des biens
          qui partent plus vite, une vitrine qui inspire confiance dès la
          première photo.
        </p>
      </div>
    </section>
  );
}
