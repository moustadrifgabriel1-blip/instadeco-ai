'use client';

import { PrestigeHero } from '../_components/prestige-hero';
import { PrestigeRoomReveal } from '../_components/prestige-room-reveal';
import { PrestigeEditorial } from '../_components/prestige-editorial';
import { PrestigeClimax } from '../_components/prestige-climax';
import { PrestigeService } from '../_components/prestige-service';
import { PrestigeSignature } from '../_components/prestige-signature';
import { usePrestigeSmoothScroll } from '../_components/use-prestige-scroll';

/**
 * /[locale]/visite — Maquette FLAGSHIP « Visite de prestige ».
 *
 * Une visite guidée, pièce après pièce, qui garde le plus beau pour la fin.
 * Page isolée (route group (prestige)) pour validation avant de dérouler la
 * refonte complète. Header/footer marketing masqués via le marqueur
 * data-prestige-root (cf. prestige.css). Smooth scroll Lenis + GSAP
 * ScrollTrigger montés ici, désactivés si prefers-reduced-motion.
 */
export default function VisitePage() {
  usePrestigeSmoothScroll();

  return (
    <div data-prestige-root>
      {/* L'entrée */}
      <PrestigeHero />

      {/* Chapitre I, le salon : révélation cinématique puis comparateur */}
      <PrestigeRoomReveal />

      {/* Chapitre II, la cuisine : éditorial parallax */}
      <PrestigeEditorial
        ariaLabel="Chapitre deux, la cuisine"
        chapter="Chapitre II, la cuisine"
        meta="La cuisine · 24 m²"
        title={
          <>
            Là où la maison <span className="italic text-[var(--gold)]">respire</span>.
          </>
        }
        body="Une cuisine nue laisse l'acheteur compter les défauts. Une cuisine habillée lui fait imaginer les dimanches matin. On ne montre plus un plan de travail, on raconte une vie."
        image="https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=1800&q=80"
        alt="Cuisine contemporaine mise en scène, plan de travail et lumière chaude"
      />

      {/* Chapitre III, la chambre : éditorial inversé */}
      <PrestigeEditorial
        ariaLabel="Chapitre trois, la chambre"
        chapter="Chapitre III, la chambre"
        meta="La suite · 18 m²"
        title={
          <>
            L&apos;intime, mis en{' '}
            <span className="italic text-[var(--gold)]">lumière</span>.
          </>
        }
        body="C'est la pièce qui se vend en silence. Quelques tons justes, une matière douce, et la chambre cesse d'être un volume à meubler pour devenir un refuge à habiter."
        image="https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1800&q=80"
        alt="Chambre élégante mise en scène, tête de lit et éclairage tamisé"
        reverse
      />

      {/* Le clou : le sommet de la visite */}
      <PrestigeClimax />

      {/* Le service, présenté simplement */}
      <PrestigeService />

      {/* La signature, l'appel aux agences */}
      <PrestigeSignature />
    </div>
  );
}
