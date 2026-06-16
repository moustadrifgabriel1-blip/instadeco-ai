'use client';

import { PrestigeHero } from '../_components/prestige-hero';
import { PrestigeRoomReveal } from '../_components/prestige-room-reveal';
import { PrestigeEditorial } from '../_components/prestige-editorial';
import { PrestigeClimax } from '../_components/prestige-climax';
import { PrestigeService } from '../_components/prestige-service';
import { PrestigeSignature } from '../_components/prestige-signature';
import { usePrestigeSmoothScroll } from '@/lib/prestige-scroll';

/**
 * /[locale]/visite, Maquette FLAGSHIP « Visite de prestige ».
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

      {/* Capacité du service, volet 1 : toutes les pièces, tous les styles */}
      <PrestigeEditorial
        ariaLabel="Ce que le service couvre, toutes les pièces"
        chapter="Ce que le service couvre"
        meta="Toutes les pièces, un seul service"
        title={
          <>
            Aucune pièce ne lui{' '}
            <span className="italic text-[var(--gold)]">résiste</span>.
          </>
        }
        body="Séjour, cuisine, suite, salle de bain, terrasse : le service met en scène l'intégralité du bien dans le style qui parle à votre clientèle. Du contemporain feutré au classique parisien, vous habillez chaque volume à l'image de votre agence. Un seul outil pour transformer tout un portefeuille."
        image="https://tocgrsdlegabfkykhdrz.supabase.co/storage/v1/object/public/output-images/400d05a5-0d19-4feb-a922-d555c9ea9f85/b9fd06a0-f082-4408-a4e7-328ae890b97d.jpg"
        alt="Salle de bain transformée en espace spa par home staging virtuel IA"
      />

      {/* Capacité du service, volet 2 : vitesse et coût divisé */}
      <PrestigeEditorial
        ariaLabel="Pourquoi le service est imbattable"
        chapter="Pourquoi c'est imbattable"
        meta="En quelques secondes"
        title={
          <>
            Le staging, divisé{' '}
            <span className="italic text-[var(--gold)]">par cent</span>.
          </>
        }
        body="Le home staging classique, c'est des semaines, des camions, des milliers d'euros par bien. Ici, c'est une photo, un clic, et le rendu revient en quelques secondes. Vous mettez en scène autant de biens que vous voulez, autant de fois que vous voulez, pour une fraction du coût. La qualité d'une agence de luxe, à l'échelle."
        image="https://tocgrsdlegabfkykhdrz.supabase.co/storage/v1/object/public/output-images/f88c9b68-eda4-4d67-bfb4-f631d21b37c6/a529f606-f9ed-4c0e-b757-9bf2bb53bbce.jpg"
        alt="Chambre épurée mise en scène, rendu IA livré instantanément"
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
