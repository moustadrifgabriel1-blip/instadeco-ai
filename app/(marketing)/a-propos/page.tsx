import { Metadata } from 'next';
import Link from 'next/link';
import { Heart, Code, Palette, ArrowRight, Sparkles, Mountain, Users, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { JsonLd } from '@/lib/seo/json-ld';
import { generateBreadcrumbList } from '@/lib/seo/schemas';
import { getCanonicalUrl } from '@/lib/seo/config';

export const metadata: Metadata = {
  title: 'À Propos d\'InstaDeco AI - Notre Histoire',
  description: 'InstaDeco AI est né en Suisse de la rencontre entre une passionnée de décoration et un ingénieur tech. Découvrez comment nous rendons la décoration d\'intérieur accessible à tous grâce à l\'IA.',
  openGraph: {
    title: 'À Propos d\'InstaDeco AI - Notre Histoire',
    description: 'Un couple suisse, une passion pour la déco et la tech, et une mission : démocratiser la décoration d\'intérieur grâce à l\'IA.',
    type: 'website',
    url: getCanonicalUrl('/a-propos'),
    images: [getCanonicalUrl('/og-image.png')],
  },
  alternates: {
    canonical: getCanonicalUrl('/a-propos'),
  },
};

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <JsonLd data={[
        generateBreadcrumbList([{ label: 'À propos', path: '/a-propos' }]),
        {
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'À Propos d\'InstaDeco AI',
          description: 'L\'histoire d\'InstaDeco AI, fondée en Suisse par un couple passionné de déco et de technologie.',
          url: getCanonicalUrl('/a-propos'),
        },
      ]} />

      <Breadcrumbs items={[{ label: 'À propos', href: '/a-propos' }]} />

      {/* HERO */}
      <section className="pt-20 pb-16">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Mountain className="h-4 w-4" />
            Créé en Suisse 🇨🇭
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Quand la <span className="text-primary">déco</span> rencontre la <span className="text-primary">tech</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            InstaDeco AI est né d&apos;une histoire simple : un papa geek de 30 ans, une femme passionnée de décoration, et l&apos;envie de résoudre un problème que chaque couple connaît.
          </p>
        </div>
      </section>

      {/* NOTRE HISTOIRE */}
      <section className="py-16 bg-muted/20 border-t">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Notre histoire</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p>
              Tout a commencé dans notre appartement en Suisse. Ma femme, passionnée de décoration intérieure, passait des heures sur Pinterest et Instagram à chercher l&apos;inspiration pour notre salon. Moi, développeur et fan de technologie, je trouvais fascinant ce que l&apos;intelligence artificielle pouvait faire avec les images.
            </p>
            <p>
              Un soir, en la regardant comparer pour la dixième fois deux photos d&apos;ambiances &quot;moderne vs scandinave&quot; en essayant de s&apos;imaginer le résultat dans <em>notre</em> salon, j&apos;ai eu l&apos;idée : et si l&apos;IA pouvait prendre une photo de notre pièce et montrer à quoi elle ressemblerait dans chaque style ?
            </p>
            <p>
              Quelques prototypes plus tard, InstaDeco AI était né. Le premier test ? Notre propre salon, bien sûr. Ma femme a été bluffée — et moi aussi, honnêtement. Le rendu était photoréaliste et nous a permis de choisir notre nouvelle déco en quelques minutes au lieu de plusieurs weekends de doutes.
            </p>
            <p>
              On s&apos;est vite rendu compte qu&apos;on n&apos;était pas les seuls avec ce problème. Un architecte d&apos;intérieur facture 150&nbsp;€/h minimum, et la plupart des gens n&apos;ont ni le budget ni le temps de faire appel à un professionnel juste pour &quot;voir ce que ça donnerait&quot;. C&apos;est là qu&apos;InstaDeco prend tout son sens : <strong>rendre la visualisation déco accessible à tout le monde, pour moins d&apos;un café</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* NOS VALEURS */}
      <section className="py-16 border-t">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-10 text-center">Ce qui nous guide</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-none shadow-md">
              <CardContent className="pt-6 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-pink-600" />
                </div>
                <h3 className="text-lg font-bold">Accessibilité</h3>
                <p className="text-sm text-muted-foreground">
                  La belle déco ne devrait pas être réservée à ceux qui peuvent se payer un architecte. Nous croyons que chaque intérieur mérite d&apos;être un espace qu&apos;on aime, quel que soit le budget.
                </p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md">
              <CardContent className="pt-6 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Code className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold">Innovation</h3>
                <p className="text-sm text-muted-foreground">
                  Nous utilisons les dernières avancées en IA générative (Flux.1 + ControlNet) pour produire des résultats photoréalistes qui respectent la structure réelle de votre pièce — pas de templates génériques.
                </p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md">
              <CardContent className="pt-6 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold">Transparence</h3>
                <p className="text-sm text-muted-foreground">
                  Pas d&apos;abonnement caché, pas de frais surprise. Vous achetez des crédits, vous les utilisez quand vous voulez, ils n&apos;expirent jamais. On garde les choses simples.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* EN CHIFFRES */}
      <section className="py-16 bg-muted/20 border-t">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-10 text-center">InstaDeco en chiffres</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">12</div>
              <div className="text-sm text-muted-foreground mt-1">Styles de décoration</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">8</div>
              <div className="text-sm text-muted-foreground mt-1">Types de pièces</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">30s</div>
              <div className="text-sm text-muted-foreground mt-1">Par génération</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">3</div>
              <div className="text-sm text-muted-foreground mt-1">Pays (FR, CH, BE)</div>
            </div>
          </div>
        </div>
      </section>

      {/* POUR QUI */}
      <section className="py-16 border-t">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Pour qui est fait InstaDeco ?</h2>
          <div className="space-y-6 text-muted-foreground">
            <div className="flex gap-4 items-start">
              <Users className="w-5 h-5 text-primary mt-1 shrink-0" />
              <div>
                <strong className="text-foreground">Propriétaires et locataires</strong> — Vous avez envie de changer mais vous hésitez entre plusieurs styles ? Testez-les tous sur votre propre photo avant de dépenser le moindre euro.
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <Users className="w-5 h-5 text-primary mt-1 shrink-0" />
              <div>
                <strong className="text-foreground">Agents immobiliers</strong> — Le <Link href="/solution/home-staging-virtuel" className="text-primary hover:underline">home staging virtuel</Link> meuble virtuellement vos biens vides et aide les acheteurs à se projeter. Plus de visites, plus de ventes.
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <Users className="w-5 h-5 text-primary mt-1 shrink-0" />
              <div>
                <strong className="text-foreground">Architectes et décorateurs</strong> — Montrez un avant/après instantané à vos clients pour valider une direction déco avant de réaliser le projet complet. Consultez nos <Link href="/pro" className="text-primary hover:underline">offres Pro</Link>.
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <Users className="w-5 h-5 text-primary mt-1 shrink-0" />
              <div>
                <strong className="text-foreground">Couples comme nous</strong> — Fini les débats interminables &quot;tu verras bien quand ce sera posé&quot;. Montrez le résultat avant de commencer les travaux. Paix conjugale garantie.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TECHNOLOGIE */}
      <section className="py-16 bg-muted/20 border-t">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Notre technologie</h2>
          <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">
            <p>
              InstaDeco utilise <strong>Flux.1</strong>, l&apos;un des modèles d&apos;IA générative les plus avancés, couplé à <strong>ControlNet</strong> pour respecter la structure réelle de votre pièce. Contrairement aux outils qui génèrent des images &quot;à partir de rien&quot;, notre technologie analyse vos murs, fenêtres, portes et volumes pour appliquer le style choisi en conservant la géométrie exacte de votre espace.
            </p>
            <p>
              Le résultat : des rendus photoréalistes en 30 secondes que vous pouvez télécharger en HD (1024×1024) ou en ultra-HD (2048×2048). <Link href="/styles" className="text-primary hover:underline">12 styles de décoration</Link> sont disponibles, applicables à <Link href="/pieces" className="text-primary hover:underline">8 types de pièces</Link> — soit 96 combinaisons possibles.
            </p>
            <p>
              Nous opérons depuis la Suisse et servons la France, la Belgique et la Suisse. Vos images sont traitées de manière sécurisée et ne sont jamais utilisées pour entraîner nos modèles IA.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-primary-foreground border-t">
        <div className="container px-4 md:px-6 text-center">
          <Sparkles className="w-8 h-8 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl font-bold mb-4">Envie de voir ce que ça donne chez vous ?</h2>
          <p className="mb-6 text-primary-foreground/80 max-w-md mx-auto">
            3 crédits offerts à l&apos;inscription. Pas de carte bancaire requise. Résultat en 30 secondes.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" className="rounded-full" asChild>
              <Link href="/essai">
                Essayer gratuitement <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full border-white/30 text-white hover:bg-white/10" asChild>
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
