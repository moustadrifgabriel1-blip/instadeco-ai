import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

/**
 * Page vitrine d'un visuel avant/après, cible des liens en cold email (outbound
 * agents immo). But : servir une VRAIE page HTML depuis instadeco.app plutôt qu'un
 * fichier .jpg brut. Gmail flaggue moins un lien vers une page qu'un lien direct
 * vers un binaire, donc l'avertissement de redirection disparaît côté destinataire.
 *
 * Hors i18n (exclue du middleware next-intl) : pas de préfixe /fr/en/de, l'URL
 * envoyée reste stable et sans redirection. noindex : ce ne sont pas des pages du site.
 */

interface Visual {
  slug: string;
  image: string;
  piece: string;
  style: string;
  titre: string;
  intro: string;
}

const VISUALS: Record<string, Visual> = {
  'salon-minimaliste': {
    slug: 'salon-minimaliste',
    image: '/outbound/salon-minimaliste.jpg',
    piece: 'Salon',
    style: 'minimaliste',
    titre: 'Un salon vide devenu un séjour qui donne envie',
    intro:
      'La même pièce, à gauche telle qu’elle est photographiée pour l’annonce, à droite meublée par InstaDeco à partir de cette seule photo. Aucun meuble déplacé, aucun home staging physique.',
  },
  'salon-japandi': {
    slug: 'salon-japandi',
    image: '/outbound/salon-japandi.jpg',
    piece: 'Salon',
    style: 'japandi',
    titre: 'Une pièce nue transformée en salon chaleureux',
    intro:
      'À gauche la pièce vide, à droite le rendu InstaDeco généré depuis la photo d’origine. Un intérieur habité que l’acheteur peut se projeter à visiter, sans mobilier ni frais de mise en scène.',
  },
};

const CTA = 'https://instadeco.app/fr/pro?utm_source=outbound&utm_medium=email&utm_campaign=before-after';

export function generateStaticParams() {
  return Object.keys(VISUALS).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const visual = VISUALS[slug];
  if (!visual) return { title: 'InstaDeco', robots: { index: false, follow: false } };
  return {
    title: `${visual.titre} — InstaDeco`,
    description: visual.intro,
    robots: { index: false, follow: false },
  };
}

export default async function OutboundVisualPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const visual = VISUALS[slug];
  if (!visual) notFound();

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-3xl flex-col items-center px-6 py-12 text-center">
      <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-[#c8a24d]">
        InstaDeco · {visual.piece} {visual.style}
      </p>
      <h1 className="mb-4 font-serif text-3xl leading-tight text-[#faf8f4] sm:text-4xl">
        {visual.titre}
      </h1>
      <p className="mb-8 max-w-xl text-[15px] leading-relaxed text-[#b3a89a]">{visual.intro}</p>

      <div className="w-full overflow-hidden rounded-2xl border border-[#c8a24d]/25 bg-[#1c1917] shadow-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={visual.image}
          alt={`Avant après : ${visual.piece} ${visual.style} meublé par InstaDeco depuis une photo`}
          width={1080}
          height={1350}
          className="h-auto w-full"
        />
      </div>

      <div className="mt-10 flex flex-col items-center gap-3">
        <a
          href={CTA}
          className="inline-flex items-center justify-center rounded-full bg-[#c8a24d] px-8 py-3 text-[15px] font-semibold text-[#0c0a09] transition-opacity hover:opacity-90"
        >
          Meubler mes annonces, premier essai gratuit
        </a>
        <p className="text-xs text-[#8c8478]">
          Illimité pour 49 € par mois. L’essai ne demande pas de carte.
        </p>
      </div>
    </main>
  );
}
