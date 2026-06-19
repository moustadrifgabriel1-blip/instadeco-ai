import { Metadata } from 'next';
import Link from 'next/link';
import { Heart, Code, Palette, ArrowRight, Sparkles, Mountain, Users, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { JsonLd } from '@/lib/seo/json-ld';
import { generateBreadcrumbList } from '@/lib/seo/schemas';
import { getCanonicalUrl, getLocalizedCanonicalUrl, withLocalePath } from '@/lib/seo/config';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const path = '/a-propos';

  return {
    title: 'À Propos d\'InstaDeco AI - Notre Histoire',
    description: 'InstaDeco AI est né en Suisse de la rencontre entre une passionnée de décoration et un ingénieur tech. Découvrez comment nous rendons la décoration d\'intérieur accessible à tous grâce à l\'IA.',
    openGraph: {
      title: 'À Propos d\'InstaDeco AI - Notre Histoire',
      description: 'Un couple suisse, une passion pour la déco et la tech, et une mission : démocratiser la décoration d\'intérieur grâce à l\'IA.',
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

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      <JsonLd data={[
        generateBreadcrumbList([{ label: 'À propos', path: withLocalePath(locale, '/a-propos') }], {
          home: { name: 'Accueil', url: withLocalePath(locale, '/') },
        }),
        {
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'À Propos d\'InstaDeco AI',
          description: 'L\'histoire d\'InstaDeco AI, fondée en Suisse par un couple passionné de déco et de technologie.',
          url: getLocalizedCanonicalUrl(locale, '/a-propos'),
        },
      ]} />

      <Breadcrumbs items={[{ label: 'À propos', href: '/a-propos' }]} />

      {/* HERO */}
      <section className="pt-20 pb-16">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto text-center">
          <div className="prestige-eyebrow inline-flex items-center gap-2 bg-[rgba(200,162,77,0.12)] text-[var(--gold)] text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-[var(--gold-line)]">
            <Mountain className="h-4 w-4" />
            Créé en Suisse
          </div>
          <h1 className="prestige-display text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Quand la <span className="text-[var(--gold)]">déco</span> rencontre la <span className="text-[var(--gold)]">tech</span>
          </h1>
          <p className="prestige-body text-xl text-muted-foreground leading-relaxed">
            InstaDeco AI est né d&apos;une histoire simple : un papa geek de 30 ans, une femme passionnée de décoration, et l&apos;envie de résoudre un problème que chaque couple connaît.
          </p>
        </div>
      </section>

      {/* NOTRE HISTOIRE */}
      <section className="prestige-reveal py-16 bg-card border-t border-[var(--gold-line)]">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto">
          <h2 className="prestige-display text-2xl font-bold mb-4 text-foreground">Notre histoire</h2>
          <div className="prestige-rule w-16 mb-8" aria-hidden="true" />
          <div className="prestige-body prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p>
              Tout a commencé dans notre appartement en Suisse. Ma femme, passionnée de décoration intérieure, passait des heures sur Pinterest et Instagram à chercher l&apos;inspiration pour notre salon. Moi, développeur et fan de technologie, je trouvais fascinant ce que l&apos;intelligence artificielle pouvait faire avec les images.
            </p>
            <p>
              Un soir, en la regardant comparer pour la dixième fois deux photos d&apos;ambiances &quot;moderne vs scandinave&quot; en essayant de s&apos;imaginer le résultat dans <em>notre</em> salon, j&apos;ai eu l&apos;idée : et si l&apos;IA pouvait prendre une photo de notre pièce et montrer à quoi elle ressemblerait dans chaque style ?
            </p>
            <p>
              Quelques prototypes plus tard, InstaDeco AI était né. Le premier test ? Notre propre salon, bien sûr. Ma femme a été bluffée, et moi aussi, honnêtement. Le rendu était photoréaliste et nous a permis de choisir notre nouvelle déco en quelques minutes au lieu de plusieurs weekends de doutes.
            </p>
            <p>
              On s&apos;est vite rendu compte qu&apos;on n&apos;était pas les seuls avec ce problème. Un architecte d&apos;intérieur facture 150&nbsp;€/h minimum, et la plupart des gens n&apos;ont ni le budget ni le temps de faire appel à un professionnel juste pour &quot;voir ce que ça donnerait&quot;. C&apos;est là qu&apos;InstaDeco prend tout son sens : <strong>rendre la visualisation déco accessible à tout le monde, pour moins d&apos;un café</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* NOS VALEURS */}
      <section className="prestige-reveal py-16 border-t border-[var(--gold-line)]">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto">
          <h2 className="prestige-display text-2xl font-bold mb-4 text-center text-foreground">Ce qui nous guide</h2>
          <div className="prestige-rule w-16 mx-auto mb-10" aria-hidden="true" />
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="prestige-reveal bg-card border border-[var(--gold-line)] transition-all duration-500 ease-out hover:-translate-y-1 hover:border-[var(--gold)]">
              <CardContent className="pt-6 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[rgba(200,162,77,0.12)] border border-[var(--gold-line)] flex items-center justify-center">
                  <Heart className="w-6 h-6 text-[var(--gold)]" />
                </div>
                <h3 className="prestige-display text-lg font-bold text-foreground">Accessibilité</h3>
                <p className="text-sm text-muted-foreground">
                  La belle déco ne devrait pas être réservée à ceux qui peuvent se payer un architecte. Nous croyons que chaque intérieur mérite d&apos;être un espace qu&apos;on aime, quel que soit le budget.
                </p>
              </CardContent>
            </Card>
            <Card className="prestige-reveal bg-card border border-[var(--gold-line)] transition-all duration-500 ease-out hover:-translate-y-1 hover:border-[var(--gold)]" style={{ ['--reveal-d' as string]: '120ms' }}>
              <CardContent className="pt-6 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[rgba(200,162,77,0.12)] border border-[var(--gold-line)] flex items-center justify-center">
                  <Code className="w-6 h-6 text-[var(--gold)]" />
                </div>
                <h3 className="prestige-display text-lg font-bold text-foreground">Innovation</h3>
                <p className="text-sm text-muted-foreground">
                  Nous utilisons les dernières avancées en IA générative (Flux.1 + ControlNet) pour produire des résultats photoréalistes qui respectent la structure réelle de votre pièce, pas de templates génériques.
                </p>
              </CardContent>
            </Card>
            <Card className="prestige-reveal bg-card border border-[var(--gold-line)] transition-all duration-500 ease-out hover:-translate-y-1 hover:border-[var(--gold)]" style={{ ['--reveal-d' as string]: '240ms' }}>
              <CardContent className="pt-6 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[rgba(200,162,77,0.12)] border border-[var(--gold-line)] flex items-center justify-center">
                  <Shield className="w-6 h-6 text-[var(--gold)]" />
                </div>
                <h3 className="prestige-display text-lg font-bold text-foreground">Transparence</h3>
                <p className="text-sm text-muted-foreground">
                  Pas d&apos;abonnement caché, pas de frais surprise. Vous achetez des crédits, vous les utilisez quand vous voulez, ils n&apos;expirent jamais. On garde les choses simples.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* EN CHIFFRES */}
      <section className="prestige-reveal py-16 bg-card border-t border-[var(--gold-line)]">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto">
          <h2 className="prestige-display text-2xl font-bold mb-4 text-center text-foreground">InstaDeco en chiffres</h2>
          <div className="prestige-rule w-16 mx-auto mb-10" aria-hidden="true" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="prestige-reveal">
              <div className="prestige-display text-3xl font-bold text-[var(--gold)]">12</div>
              <div className="text-sm text-muted-foreground mt-1">Styles de décoration</div>
            </div>
            <div className="prestige-reveal" style={{ ['--reveal-d' as string]: '120ms' }}>
              <div className="prestige-display text-3xl font-bold text-[var(--gold)]">8</div>
              <div className="text-sm text-muted-foreground mt-1">Types de pièces</div>
            </div>
            <div className="prestige-reveal" style={{ ['--reveal-d' as string]: '240ms' }}>
              <div className="prestige-display text-3xl font-bold text-[var(--gold)]">30s</div>
              <div className="text-sm text-muted-foreground mt-1">Par génération</div>
            </div>
            <div className="prestige-reveal" style={{ ['--reveal-d' as string]: '360ms' }}>
              <div className="prestige-display text-3xl font-bold text-[var(--gold)]">3</div>
              <div className="text-sm text-muted-foreground mt-1">Pays (FR, CH, BE)</div>
            </div>
          </div>
        </div>
      </section>

      {/* POUR QUI */}
      <section className="prestige-reveal py-16 border-t border-[var(--gold-line)]">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto">
          <h2 className="prestige-display text-2xl font-bold mb-4 text-foreground">Pour qui est fait InstaDeco ?</h2>
          <div className="prestige-rule w-16 mb-8" aria-hidden="true" />
          <div className="space-y-6 text-muted-foreground">
            <div className="prestige-reveal flex gap-4 items-start">
              <Users className="w-5 h-5 text-[var(--gold)] mt-1 shrink-0" />
              <div>
                <strong className="text-foreground">Propriétaires et locataires.</strong> Vous avez envie de changer mais vous hésitez entre plusieurs styles ? Testez-les tous sur votre propre photo avant de dépenser le moindre euro.
              </div>
            </div>
            <div className="prestige-reveal flex gap-4 items-start" style={{ ['--reveal-d' as string]: '120ms' }}>
              <Users className="w-5 h-5 text-[var(--gold)] mt-1 shrink-0" />
              <div>
                <strong className="text-foreground">Agents immobiliers.</strong> Le <Link href="/solution/home-staging-virtuel" className="text-[var(--gold)] hover:underline">home staging virtuel</Link> meuble virtuellement vos biens vides et aide les acheteurs à se projeter. Plus de visites, plus de ventes.
              </div>
            </div>
            <div className="prestige-reveal flex gap-4 items-start" style={{ ['--reveal-d' as string]: '240ms' }}>
              <Users className="w-5 h-5 text-[var(--gold)] mt-1 shrink-0" />
              <div>
                <strong className="text-foreground">Architectes et décorateurs.</strong> Montrez un avant/après instantané à vos clients pour valider une direction déco avant de réaliser le projet complet. Consultez nos <Link href="/pro" className="text-[var(--gold)] hover:underline">offres Pro</Link>.
              </div>
            </div>
            <div className="prestige-reveal flex gap-4 items-start" style={{ ['--reveal-d' as string]: '360ms' }}>
              <Users className="w-5 h-5 text-[var(--gold)] mt-1 shrink-0" />
              <div>
                <strong className="text-foreground">Couples comme nous.</strong> Fini les débats interminables &quot;tu verras bien quand ce sera posé&quot;. Montrez le résultat avant de commencer les travaux. Paix conjugale garantie.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TECHNOLOGIE */}
      <section className="prestige-reveal py-16 bg-card border-t border-[var(--gold-line)]">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto">
          <h2 className="prestige-display text-2xl font-bold mb-4 text-foreground">Notre technologie</h2>
          <div className="prestige-rule w-16 mb-8" aria-hidden="true" />
          <div className="prestige-body prose prose-sm max-w-none text-muted-foreground space-y-4">
            <p>
              InstaDeco utilise <strong>Flux.1</strong>, l&apos;un des modèles d&apos;IA générative les plus avancés, couplé à <strong>ControlNet</strong> pour respecter la structure réelle de votre pièce. Contrairement aux outils qui génèrent des images &quot;à partir de rien&quot;, notre technologie analyse vos murs, fenêtres, portes et volumes pour appliquer le style choisi en conservant la géométrie exacte de votre espace.
            </p>
            <p>
              Le résultat : des rendus photoréalistes en 30 secondes que vous pouvez télécharger en HD (1024×1024) ou en ultra-HD (2048×2048). <Link href="/styles" className="text-[var(--gold)] hover:underline">12 styles de décoration</Link> sont disponibles, applicables à <Link href="/pieces" className="text-[var(--gold)] hover:underline">8 types de pièces</Link>, soit 96 combinaisons possibles.
            </p>
            <p>
              Nous opérons depuis la Suisse et servons la France, la Belgique et la Suisse. Vos images sont traitées de manière sécurisée et ne sont jamais utilisées pour entraîner nos modèles IA.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-card text-foreground border-t border-[var(--gold-line)]">
        <div className="container px-4 md:px-6 text-center">
          <Sparkles className="w-8 h-8 mx-auto mb-4 text-[var(--gold)]" />
          <h2 className="prestige-display text-2xl font-bold mb-4 text-foreground">Envie de voir ce que ça donne chez vous ?</h2>
          <p className="prestige-body mb-6 text-muted-foreground max-w-md mx-auto">
            3 crédits offerts à l&apos;inscription. Pas de carte bancaire requise. Résultat en 30 secondes.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="rounded-full bg-[var(--gold)] text-[#0c0a09] border border-[var(--gold)] hover:bg-transparent hover:text-[var(--gold)]" asChild>
              <Link href="/essai">
                Essayer gratuitement <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full border-[var(--gold-line)] text-foreground hover:bg-[rgba(200,162,77,0.12)] hover:text-[var(--gold)]" asChild>
              <Link href="/galerie">
                Voir la galerie
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
