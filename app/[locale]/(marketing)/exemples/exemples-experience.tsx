'use client';

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { usePrestigeSmoothScroll } from '@/lib/prestige-scroll';
import { PrestigeCompare } from '@/components/prestige/prestige-compare';

const OUT = 'https://tocgrsdlegabfkykhdrz.supabase.co/storage/v1/object/public/output-images';
const IN = 'https://tocgrsdlegabfkykhdrz.supabase.co/storage/v1/object/public/input-images';
const U = 'f88c9b68-eda4-4d67-bfb4-f631d21b37c6';

/**
 * Galerie de rendus réels (sorties IA, déjà exposées publiquement via la
 * galerie, donc anonymes). On ne montre QUE des « après » ici : la preuve de
 * qualité du service. Les avant/après complets sont les deux comparateurs.
 */
const GALLERY = [
  { src: `${OUT}/gemini/1782047014810-s1f7n.jpg`, label: 'Mid-century · Séjour', alt: 'Séjour mid-century mis en scène par IA' },
  { src: `${OUT}/gemini/1781863553799-atz5u.jpg`, label: 'Minimaliste · Séjour', alt: 'Séjour minimaliste mis en scène par IA' },
  { src: `${OUT}/gemini/1782046791638-lmu8e.jpg`, label: 'Minimaliste · Chambre', alt: 'Chambre minimaliste mise en scène par IA' },
  { src: `${OUT}/gemini/1782047083348-x6lthy.jpg`, label: 'Bohème · Séjour', alt: 'Séjour bohème mis en scène par IA' },
  { src: `${OUT}/gemini/1782046724114-gruqrj.jpg`, label: 'Japandi · Chambre', alt: 'Chambre japandi mise en scène par IA' },
  { src: '/images/after-chambre-1.jpg', label: 'Chaleureux · Chambre', alt: 'Chambre chaleureuse mise en scène par IA' },
];

export function ExemplesExperience() {
  usePrestigeSmoothScroll();

  return (
    <>
      {/* Barre du haut minimale (le chrome global est masqué en immersif) */}
      <div className="absolute left-0 right-0 top-0 z-40 mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-10">
        <Link href="/" className="prestige-display text-xl tracking-tight text-[var(--ivory)]">
          InstaDeco
        </Link>
        <Link
          href="/generate"
          className="prestige-eyebrow !text-[0.6rem] text-[var(--mist)] transition-colors hover:text-[var(--gold)]"
        >
          Essayer le service
        </Link>
      </div>

      {/* Hero */}
      <section className="relative flex min-h-[88svh] w-full flex-col justify-center px-6 sm:px-10">
        <div className="mx-auto w-full max-w-6xl">
          <div className="prestige-anim prestige-eyebrow flex items-center gap-4" style={{ ['--d' as string]: '120ms' }}>
            <span className="h-px w-10 bg-[var(--gold)]" aria-hidden />
            Exemples · Démonstration
          </div>
          <h1
            className="prestige-anim prestige-display mt-6 max-w-4xl text-balance text-[clamp(2.4rem,7vw,5.6rem)] leading-[0.98] tracking-tight"
            style={{ ['--d' as string]: '280ms' }}
          >
            Le service, <span className="italic text-[var(--gold)]">en démonstration</span>.
          </h1>
          <p
            className="prestige-anim mt-7 max-w-xl text-[clamp(1rem,2vw,1.2rem)] font-light leading-relaxed text-[var(--mist)]"
            style={{ ['--d' as string]: '460ms' }}
          >
            De vraies transformations, pas des photos de stock. Glissez la barre,
            comparez la pièce brute et la pièce mise en scène. C&apos;est
            exactement ce que vous livrerez à vos acquéreurs.
          </p>
        </div>
        <div
          className="prestige-anim-fade absolute bottom-7 right-6 z-10 flex flex-col items-center gap-3 sm:right-10"
          style={{ ['--d' as string]: '900ms' }}
          aria-hidden
        >
          <span className="prestige-eyebrow !text-[0.56rem] !tracking-[0.34em] text-[var(--mist)] [writing-mode:vertical-rl]">
            Découvrir
          </span>
          <span className="h-12 w-px animate-pulse bg-[var(--gold-line)]" />
        </div>
      </section>

      {/* Comparateur 1 */}
      <section className="mx-auto w-full max-w-6xl px-6 py-[clamp(3rem,9vh,7rem)] sm:px-10">
        <PrestigeCompare
          before={`${IN}/${U}/proof-japandi-115712.jpg`}
          after={`${OUT}/gemini/1781863530051-fswrzf.jpg`}
          beforeAlt="Séjour vide aux murs gris, photo de départ"
          afterAlt="Le même séjour mis en scène en japandi, épuré et chaleureux"
          eyebrow="Avant et après réel · Séjour"
          caption="Une pièce vide devient une évidence"
          priority
        />
      </section>

      {/* Respiration */}
      <section className="mx-auto w-full max-w-3xl px-6 py-[clamp(2rem,7vh,5rem)] text-center sm:px-10">
        <div className="prestige-rule mx-auto mb-8 w-32" aria-hidden />
        <p className="prestige-display text-[clamp(1.5rem,4vw,2.8rem)] leading-tight">
          Glissez. C&apos;est tout. Le bien se vend{' '}
          <span className="italic text-[var(--gold)]">déjà mieux</span>.
        </p>
      </section>

      {/* Comparateur 2 */}
      <section className="mx-auto w-full max-w-6xl px-6 py-[clamp(3rem,9vh,7rem)] sm:px-10">
        <PrestigeCompare
          before={`${IN}/${U}/proof-midcentury-221951.jpg`}
          after={`${OUT}/gemini/1781863542515-tv4qpk.jpg`}
          beforeAlt="Séjour vide et impersonnel, photo de départ"
          afterAlt="Le même séjour mis en scène en mid-century, chaleureux et vivant"
          eyebrow="Avant et après réel · Séjour"
          caption="La mise en scène qui fait basculer une visite"
        />
      </section>

      {/* Galerie de rendus */}
      <section className="mx-auto w-full max-w-6xl px-6 py-[clamp(3rem,10vh,8rem)] sm:px-10">
        <div className="max-w-2xl">
          <div className="prestige-eyebrow flex items-center gap-4">
            <span className="h-px w-10 bg-[var(--gold)]" aria-hidden />
            Galerie de rendus
          </div>
          <h2 className="prestige-display mt-5 text-[clamp(1.8rem,4.6vw,3.4rem)] leading-[1.04]">
            Des intérieurs livrés en{' '}
            <span className="italic text-[var(--gold)]">quelques secondes</span>.
          </h2>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GALLERY.map((g) => (
            <figure
              key={g.src}
              className="group relative aspect-[4/5] overflow-hidden rounded-sm border border-[var(--gold-line)]"
            >
              <Image
                src={g.src}
                alt={g.alt}
                fill
                sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                className="object-cover object-center transition-transform duration-700 ease-[var(--ease-slow)] group-hover:scale-[1.04]"
              />
              <div className="prestige-edito-veil absolute inset-0" aria-hidden />
              <figcaption className="prestige-eyebrow absolute bottom-4 left-4 !text-[0.58rem] text-[var(--ivory)]">
                {g.label}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-4xl px-6 py-[clamp(4rem,14vh,10rem)] text-center sm:px-10">
        <div className="prestige-rule mx-auto mb-10 w-40" aria-hidden />
        <div className="prestige-eyebrow justify-center">À votre tour</div>
        <h2 className="prestige-display mx-auto mt-6 max-w-3xl text-[clamp(2rem,5.4vw,4rem)] leading-[1.02]">
          Mettez en scène votre premier bien{' '}
          <span className="italic text-[var(--gold)]">maintenant</span>.
        </h2>
        <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row">
          <Link
            href="/generate"
            className="inline-flex min-h-[54px] items-center gap-3 rounded-full border border-[var(--gold)] bg-[var(--gold)] px-9 py-3.5 text-sm font-medium uppercase tracking-[0.18em] text-[#0c0a09] transition-[background-color,color] duration-500 ease-[var(--ease-slow)] hover:bg-transparent hover:text-[var(--gold)] focus-visible:bg-transparent focus-visible:text-[var(--gold)]"
          >
            Essayer le service
          </Link>
          <Link
            href="/pro"
            className="inline-flex min-h-[54px] items-center px-2 text-sm font-light uppercase tracking-[0.2em] text-[var(--mist)] underline-offset-8 transition-colors duration-500 hover:text-[var(--gold)] hover:underline focus-visible:text-[var(--gold)]"
          >
            Découvrir l&apos;offre agences
          </Link>
        </div>
      </section>

      {/* Pied immersif avec maillage interne (le footer global est masqué) */}
      <footer className="border-t border-[var(--gold-line)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-10 text-center sm:flex-row sm:px-10 sm:text-left">
          <span className="prestige-eyebrow !text-[0.58rem] text-[var(--mist)]">
            InstaDeco · Home staging virtuel par IA
          </span>
          <nav className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
            {[
              { href: '/', label: 'Accueil' },
              { href: '/pro', label: 'Agences' },
              { href: '/pricing', label: 'Tarifs' },
              { href: '/galerie', label: 'Galerie' },
              { href: '/blog', label: 'Blog' },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-xs font-light uppercase tracking-[0.2em] text-[var(--mist)] transition-colors hover:text-[var(--gold)]"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </>
  );
}
