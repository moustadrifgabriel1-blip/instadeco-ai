import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Lightbulb, Home, Camera, Palette, TrendingUp, Maximize, Eye, Sun } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { JsonLd } from '@/lib/seo/json-ld';
import { generateBreadcrumbList } from '@/lib/seo/schemas';
import { getCanonicalUrl, getLocalizedCanonicalUrl, withLocalePath } from '@/lib/seo/config';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const path = '/solutions';

  return {
    title: 'Solutions Décoration IA - Home Staging, Simulateur, Avant/Après | InstaDeco',
    description: 'Découvrez toutes les solutions de décoration par intelligence artificielle : home staging virtuel, simulateur déco, avant/après, idées d\'aménagement, et plus. Résultat en 30 secondes.',
    keywords: [
      'home staging virtuel',
      'simulateur décoration intérieur',
      'avant après décoration',
      'logiciel home staging',
      'idée aménagement studio',
      'simulateur peinture',
      'décoration salon IA',
      'décoration chambre IA',
    ],
    openGraph: {
      title: 'Solutions Décoration par IA | InstaDeco',
      description: 'Home staging virtuel, simulateur déco, avant/après : toutes nos solutions IA pour votre intérieur.',
      type: 'website',
      url: getLocalizedCanonicalUrl(locale, path),
      images: [getCanonicalUrl('/og-image.png')],
    },
    alternates: {
      canonical: getLocalizedCanonicalUrl(locale, path),
      languages: {
        'fr-FR': getLocalizedCanonicalUrl('fr', path),
        en: getLocalizedCanonicalUrl('en', path),
        de: getLocalizedCanonicalUrl('de', path),
        'x-default': getLocalizedCanonicalUrl('fr', path),
      },
    },
  };
}

const SOLUTIONS = [
  {
    slug: 'home-staging-virtuel',
    title: 'Home Staging Virtuel',
    icon: Home,
    description: 'Meublez et décorez virtuellement vos biens immobiliers pour accélérer les ventes. Idéal pour les agents immobiliers et propriétaires vendeurs.',
    audience: 'Agents immobiliers, Propriétaires vendeurs',
    benefit: 'Vendez 3x plus vite grâce à des visuels attractifs',
  },
  {
    slug: 'simulateur-decoration-interieur',
    title: 'Simulateur Décoration Intérieur',
    icon: Eye,
    description: 'Testez différents styles de décoration sur votre propre pièce avant d\'acheter le moindre meuble ou pot de peinture.',
    audience: 'Propriétaires, Locataires',
    benefit: 'Évitez les erreurs d\'achat grâce à la visualisation',
  },
  {
    slug: 'logiciel-home-staging',
    title: 'Logiciel Home Staging',
    icon: Camera,
    description: 'Alternative simple et abordable aux logiciels 3D complexes. Pas de formation nécessaire, résultat professionnel garanti.',
    audience: 'Professionnels immobilier, Décorateurs',
    benefit: 'Résultat pro en 30 secondes, sans formation',
  },
  {
    slug: 'idee-amenagement-studio',
    title: 'Idées Aménagement Studio',
    icon: Maximize,
    description: 'Optimisez chaque mètre carré de votre studio grâce à des propositions d\'aménagement intelligentes adaptées aux petits espaces.',
    audience: 'Étudiants, Jeunes actifs',
    benefit: 'Maximisez votre espace avec des agencements malins',
  },
  {
    slug: 'simulateur-peinture',
    title: 'Simulateur Peinture',
    icon: Palette,
    description: 'Visualisez l\'impact d\'un changement de couleur ou de style sur vos murs avant de sortir les pinceaux.',
    audience: 'Propriétaires, Bricoleurs',
    benefit: 'Choisissez la bonne couleur du premier coup',
  },
  {
    slug: 'decoration-salon',
    title: 'Décoration Salon',
    icon: Sun,
    description: 'Trouvez le style parfait pour votre salon : du confort scandinave au loft industriel, en passant par le zen japandi.',
    audience: 'Tous les profils',
    benefit: '12 styles de salon à tester en un clic',
  },
  {
    slug: 'decoration-chambre',
    title: 'Décoration Chambre',
    icon: Lightbulb,
    description: 'Créez une atmosphère apaisante dans votre chambre. Styles doux, palettes reposantes et ambiances cocooning.',
    audience: 'Tous les profils',
    benefit: 'Transformez votre chambre en sanctuaire de repos',
  },
  {
    slug: 'avant-apres-decoration',
    title: 'Avant / Après Décoration',
    icon: TrendingUp,
    description: 'Visualisez instantanément le potentiel de transformation de votre pièce. Comparez l\'avant et l\'après en un coup d\'œil.',
    audience: 'Tous les profils',
    benefit: 'Le résultat avant de commencer les travaux',
  },
];

export default async function SolutionsIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <JsonLd data={[
        generateBreadcrumbList([{ label: 'Solutions', path: withLocalePath(locale, '/solutions') }], {
          home: { name: 'Accueil', url: withLocalePath(locale, '/') },
        }),
      ]} />

      <Breadcrumbs items={[{ label: 'Solutions décoration IA', href: '/solutions' }]} />

      {/* HERO */}
      <section className="pt-16 pb-12">
        <div className="container px-4 md:px-6 text-center max-w-3xl mx-auto">
          <h1 className="prestige-display text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Solutions de <span className="text-[var(--gold)]">Décoration par IA</span>
          </h1>
          <p className="prestige-body text-lg text-muted-foreground mb-8">
            Que vous soyez propriétaire, agent immobilier, décorateur ou simplement en quête d&apos;inspiration, InstaDeco a la solution qu&apos;il vous faut.
          </p>
          <Button size="lg" className="rounded-full bg-[var(--gold)] text-[#0c0a09] border border-[var(--gold)] hover:bg-transparent hover:text-[var(--gold)]" asChild>
            <Link href="/generate">
              Essayer gratuitement <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* GRILLE DES SOLUTIONS */}
      <section className="pb-20">
        <div className="container px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-6">
            {SOLUTIONS.map((sol) => {
              const Icon = sol.icon;
              return (
                <Card key={sol.slug} className="group bg-card border border-border hover:border-[var(--gold-line)] transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[rgba(200,162,77,0.12)] border border-[var(--gold-line)] flex items-center justify-center shrink-0">
                        <Icon className="w-6 h-6 text-[var(--gold)]" />
                      </div>
                      <div className="flex-1">
                        <Link href={`/solution/${sol.slug}`}>
                          <h2 className="prestige-display text-xl font-bold text-foreground group-hover:text-[var(--gold)] transition-colors mb-2">
                            {sol.title}
                          </h2>
                        </Link>
                        <p className="prestige-body text-sm text-muted-foreground mb-3">{sol.description}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                          <span>👤 {sol.audience}</span>
                        </div>
                        <div className="text-sm font-medium text-[var(--gold)] mb-3">
                          ✓ {sol.benefit}
                        </div>
                        <Link
                          href={`/solution/${sol.slug}`}
                          className="text-sm text-[var(--gold)] hover:underline inline-flex items-center gap-1"
                        >
                          En savoir plus <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* TEXTE SEO */}
      <section className="py-16 bg-muted/20 border-t border-[var(--gold-line)]">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto prose prose-sm prose-invert">
          <h2 className="prestige-display text-2xl font-bold text-foreground">Pourquoi utiliser l&apos;IA pour la décoration intérieure ?</h2>
          <p className="prestige-body text-muted-foreground">
            L&apos;intelligence artificielle révolutionne la décoration d&apos;intérieur en la rendant accessible à tous. Plus besoin de maîtriser un logiciel 3D complexe ou de faire appel à un architecte d&apos;intérieur pour visualiser votre projet.
          </p>
          <p className="prestige-body text-muted-foreground">
            Avec InstaDeco AI, une simple photo suffit. Notre technologie analyse la structure de votre pièce (murs, fenêtres, volumes) et applique le <Link href="/styles" className="text-[var(--gold)] hover:underline">style de décoration</Link> de votre choix en respectant les proportions. Le résultat est photoréaliste et téléchargeable en HD.
          </p>
          <h3 className="prestige-display text-lg font-semibold text-foreground">Pour les professionnels de l&apos;immobilier</h3>
          <p className="prestige-body text-muted-foreground">
            Le <Link href="/solution/home-staging-virtuel" className="text-[var(--gold)] hover:underline">home staging virtuel</Link> est devenu un outil indispensable. Nos <Link href="/pro" className="text-[var(--gold)] hover:underline">offres professionnelles</Link> permettent de traiter plusieurs biens par mois à un coût dérisoire comparé au home staging physique.
          </p>
          <h3 className="prestige-display text-lg font-semibold text-foreground">Pour les particuliers</h3>
          <p className="prestige-body text-muted-foreground">
            Que vous rénoviez votre <Link href="/piece/salon" className="text-[var(--gold)] hover:underline">salon</Link>, réaménagiez votre <Link href="/piece/chambre" className="text-[var(--gold)] hover:underline">chambre</Link> ou cherchiez des idées pour votre <Link href="/piece/cuisine" className="text-[var(--gold)] hover:underline">cuisine</Link>, InstaDeco vous permet de valider vos choix avant de dépenser.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-card border-y border-[var(--gold-line)] text-foreground">
        <div className="container px-4 md:px-6 text-center">
          <h2 className="prestige-display text-2xl font-bold mb-4">Quelle solution vous correspond ?</h2>
          <p className="prestige-body mb-6 text-muted-foreground">Testez InstaDeco gratuitement. 3 crédits offerts à l&apos;inscription.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="rounded-full bg-[var(--gold)] text-[#0c0a09] border border-[var(--gold)] hover:bg-transparent hover:text-[var(--gold)]" asChild>
              <Link href="/generate">
                Essayer maintenant <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full border-[var(--gold-line)] text-[var(--gold)] hover:bg-[rgba(200,162,77,0.12)]" asChild>
              <Link href="/pricing">
                Voir les tarifs
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
