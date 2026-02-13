import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Metadata } from 'next';
import { ArrowRight, Palette, Home, Lightbulb, Sparkles } from 'lucide-react';
import { Hero } from '@/components/features/landing/Hero';
import { LeadCaptureLazy } from '@/components/features/lead-capture-lazy';
import { SocialProofToast } from '@/components/features/social-proof-toast';
import { JsonLd } from '@/lib/seo/json-ld';
import { generateFAQSchema } from '@/lib/seo/schemas';
import { getCanonicalUrl } from '@/lib/seo/config';

// Lazy load below-the-fold components
const HowItWorks = dynamic(() => import('@/components/features/landing/HowItWorks').then(mod => ({ default: mod.HowItWorks })), {
  loading: () => <div className="min-h-[400px]" />,
});

const Gallery = dynamic(() => import('@/components/features/landing/Gallery').then(mod => ({ default: mod.Gallery })), {
  loading: () => <div className="min-h-[400px]" />,
});

const Features = dynamic(() => import('@/components/features/landing/Features').then(mod => ({ default: mod.Features })), {
  loading: () => <div className="min-h-[400px]" />,
});

const Stats = dynamic(() => import('@/components/features/landing/Stats').then(mod => ({ default: mod.Stats })), {
  loading: () => <div className="min-h-[200px]" />,
});

const Testimonials = dynamic(() => import('@/components/features/landing/Testimonials').then(mod => ({ default: mod.Testimonials })), {
  loading: () => <div className="min-h-[400px]" />,
});

const FinalCTA = dynamic(() => import('@/components/features/landing/FinalCTA').then(mod => ({ default: mod.FinalCTA })), {
  loading: () => <div className="min-h-[200px]" />,
});

/**
 * Metadata spécifique à la homepage (overrides le layout global)
 */
export const metadata: Metadata = {
  title: 'InstaDeco AI - Décoration d\'Intérieur par IA | Résultat en 30 Secondes',
  description: 'Transformez n\'importe quelle pièce avec l\'IA pour 0,99€. 20+ styles de décoration, résultat photoréaliste en ~30 secondes. Home staging virtuel, simulation déco avant/après. Essai gratuit.',
  alternates: {
    canonical: getCanonicalUrl('/'),
  },
};

/** FAQ SSR pour la homepage — indexable par Google */
const homepageFAQ = [
  {
    question: 'Comment fonctionne la décoration par IA d\'InstaDeco ?',
    answer: 'Prenez une photo de votre pièce, choisissez un style parmi plus de 20 options (Moderne, Scandinave, Japandi, Bohème…), et notre IA génère un rendu photoréaliste de votre pièce redécorée en ~30 secondes. Le résultat respecte la structure de votre espace (murs, fenêtres, volumes).',
  },
  {
    question: 'Combien coûte InstaDeco par rapport à un architecte d\'intérieur ?',
    answer: 'Un architecte d\'intérieur facture en moyenne 150€/h pour une consultation. Avec InstaDeco, chaque génération coûte à partir de 0,99€ et vous recevez un résultat comparable en 30 secondes au lieu de 2 semaines.',
  },
  {
    question: 'Quels styles de décoration sont disponibles ?',
    answer: 'InstaDeco propose plus de 20 styles : Moderne, Scandinave, Industriel, Bohème, Japandi, Minimaliste, Art Déco, Contemporain, Haussmannien, Provençal, Chalet Alpin, Bord de mer, Luxe et bien d’autres. Chaque style peut être appliqué à tous les types de pièces.',
  },
  {
    question: 'Puis-je utiliser InstaDeco pour du home staging virtuel ?',
    answer: 'Oui ! Le home staging virtuel est l\'un des cas d\'usage principaux. Agents immobiliers et propriétaires utilisent InstaDeco pour meubler virtuellement des biens vides et aider les acheteurs à se projeter, multipliant les visites et accélérant les ventes.',
  },
  {
    question: 'Les images générées sont-elles réalistes ?',
    answer: 'Nos rendus utilisent la technologie Flux.1 avec ControlNet, qui analyse la structure de votre pièce pour produire des résultats photoréalistes. Les images sont téléchargeables en HD et peuvent être partagées ou imprimées.',
  },
];

/** Styles populaires pour le maillage interne SSR */
const POPULAR_STYLES = [
  { slug: 'moderne', name: 'Moderne', description: 'Lignes épurées, matériaux nobles et palette neutre' },
  { slug: 'scandinave', name: 'Scandinave', description: 'Bois clair, blanc et tons chaleureux' },
  { slug: 'industriel', name: 'Industriel', description: 'Métal, brique et esprit loft' },
  { slug: 'boheme', name: 'Bohème', description: 'Textures riches, couleurs terracotta et plantes' },
  { slug: 'japandi', name: 'Japandi', description: 'Minimalisme japonais et design scandinave' },
  { slug: 'minimaliste', name: 'Minimaliste', description: 'L\'essentiel, rien de plus' },
];

/** Types de pièces pour le maillage interne SSR */
const POPULAR_ROOMS = [
  { slug: 'salon', name: 'Salon' },
  { slug: 'chambre', name: 'Chambre' },
  { slug: 'cuisine', name: 'Cuisine' },
  { slug: 'salle-de-bain', name: 'Salle de bain' },
  { slug: 'bureau', name: 'Bureau' },
  { slug: 'entree', name: 'Entrée' },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* JSON-LD FAQ — rendu SSR pour Google */}
      <JsonLd data={[generateFAQSchema(homepageFAQ)]} />

      {/* Composants interactifs (client-side) */}
      <Hero />
      <HowItWorks />
      <Gallery />
      <Features />
      <Stats />
      <Testimonials />
      <FinalCTA />

      {/* ============================================ */}
      {/* SECTION SSR: Maillage interne + contenu SEO */}
      {/* Ce contenu est rendu côté serveur pour Google */}
      {/* ============================================ */}

      {/* Découvrir par style */}
      <section className="py-16 bg-muted/20 border-t">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold text-center mb-2">Explorez nos styles de décoration</h2>
          <p className="text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
            Chaque intérieur mérite un style qui lui correspond. Découvrez nos 20+ styles de décoration et trouvez celui qui vous ressemble.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {POPULAR_STYLES.map((style) => (
              <Link
                key={style.slug}
                href={`/style/${style.slug}`}
                className="group p-4 rounded-xl border bg-background hover:border-primary/30 hover:shadow-md transition-all text-center"
              >
                <Palette className="w-6 h-6 mx-auto mb-2 text-primary group-hover:scale-110 transition-transform" />
                <div className="font-semibold text-sm">{style.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{style.description}</div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/styles" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
              Voir tous les styles <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Découvrir par pièce */}
      <section className="py-16 border-t">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold text-center mb-2">Décorez chaque pièce de votre intérieur</h2>
          <p className="text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
            Salon, chambre, cuisine ou bureau : notre IA s&apos;adapte à chaque espace pour des résultats sur mesure.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {POPULAR_ROOMS.map((room) => (
              <Link
                key={room.slug}
                href={`/piece/${room.slug}`}
                className="group p-4 rounded-xl border bg-background hover:border-primary/30 hover:shadow-md transition-all text-center"
              >
                <Home className="w-6 h-6 mx-auto mb-2 text-primary group-hover:scale-110 transition-transform" />
                <div className="font-semibold text-sm">{room.name}</div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/pieces" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
              Tous les types de pièces <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Solutions populaires */}
      <section className="py-16 bg-muted/20 border-t">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold text-center mb-2">Solutions de décoration par IA</h2>
          <p className="text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
            Que vous souhaitiez vendre votre bien, rénover ou simplement trouver l&apos;inspiration, InstaDeco a la solution.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { slug: 'home-staging-virtuel', title: 'Home Staging Virtuel', desc: 'Meublez virtuellement vos biens pour accélérer la vente' },
              { slug: 'simulateur-decoration-interieur', title: 'Simulateur Déco', desc: 'Testez votre déco avant d\'acheter le moindre meuble' },
              { slug: 'avant-apres-decoration', title: 'Avant / Après', desc: 'Visualisez la transformation instantanément' },
              { slug: 'decoration-salon', title: 'Décoration Salon', desc: 'Idées et inspiration pour votre pièce à vivre' },
            ].map((sol) => (
              <Link
                key={sol.slug}
                href={`/solution/${sol.slug}`}
                className="group p-5 rounded-xl border bg-background hover:border-primary/30 hover:shadow-md transition-all"
              >
                <Lightbulb className="w-5 h-5 text-primary mb-2" />
                <div className="font-semibold text-sm mb-1">{sol.title}</div>
                <div className="text-xs text-muted-foreground">{sol.desc}</div>
                <div className="text-xs text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1">
                  En savoir plus <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/solutions" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
              Toutes nos solutions <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ SSR — contenu textuel complet indexable */}
      <section className="py-16 border-t">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">Questions fréquentes</h2>
          <div className="space-y-4">
            {homepageFAQ.map((item, i) => (
              <details key={i} className="group border rounded-xl bg-background p-5">
                <summary className="flex cursor-pointer items-center justify-between font-medium text-sm">
                  {item.question}
                  <ArrowRight className="h-4 w-4 transition-transform group-open:rotate-90 shrink-0 ml-4" />
                </summary>
                <p className="pt-3 text-sm text-muted-foreground leading-relaxed">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Lien blog SSR */}
      <section className="py-12 border-t bg-muted/10">
        <div className="container px-4 md:px-6 text-center">
          <h2 className="text-xl font-bold mb-3">Le blog décoration & IA</h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-xl mx-auto">
            Conseils déco, tendances, guides pratiques et actualités de l&apos;IA appliquée à la décoration intérieure.
          </p>
          <Link href="/blog" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
            Lire nos articles <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </section>

      <LeadCaptureLazy variant="popup" delay={12000} />
      <SocialProofToast initialDelay={10000} interval={30000} maxNotifications={6} />
    </main>
  );
}
