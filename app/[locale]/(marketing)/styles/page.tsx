import { Metadata } from 'next';
import Link from 'next/link';
import {
  Palette,
  ArrowRight,
  Building2,
  TreePine,
  Factory,
  Leaf,
  Sprout,
  Square,
  Sparkles,
  LayoutGrid,
  TreeDeciduous,
  Waves,
  Armchair,
  Gem,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { JsonLd } from '@/lib/seo/json-ld';
import { generateBreadcrumbList, generateFAQSchema } from '@/lib/seo/schemas';
import { getCanonicalUrl, getLocalizedCanonicalUrl, withLocalePath } from '@/lib/seo/config';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const path = '/styles';

  return {
    title: '12 Styles de Décoration Intérieure par IA - Moderne, Scandinave, Japandi...',
    description: 'Découvrez 12 styles de décoration intérieure et appliquez-les à votre pièce grâce à l\'IA. Moderne, Scandinave, Industriel, Bohème, Japandi, Minimaliste et plus. Guide complet avec exemples.',
    keywords: [
      'styles décoration intérieure',
      'décoration moderne',
      'décoration scandinave',
      'décoration industrielle',
      'style japandi',
      'style bohème',
      'idée décoration maison',
      'tendance déco 2025',
    ],
    openGraph: {
      title: '12 Styles de Décoration par IA | InstaDeco',
      description: 'Explorez tous les styles déco et appliquez-les à votre intérieur en 30 secondes.',
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

const STYLES: {
  slug: string;
  name: string;
  icon: LucideIcon;
  description: string;
  keywords: string[];
  rooms: string[];
}[] = [
  {
    slug: 'moderne',
    name: 'Moderne',
    icon: Building2,
    description: 'Lignes épurées, matériaux nobles et palette de couleurs neutres. Le style moderne mise sur l\'élégance minimaliste avec des meubles aux formes géométriques et des espaces ouverts.',
    keywords: ['lignes épurées', 'matériaux nobles', 'palette neutre'],
    rooms: ['salon', 'cuisine', 'salle-de-bain'],
  },
  {
    slug: 'scandinave',
    name: 'Scandinave',
    icon: TreePine,
    description: 'Bois clair, blanc dominant et textiles chaleureux. Le style scandinave ou nordique apporte luminosité et fonctionnalité, avec un mobilier simple et des touches de hygge.',
    keywords: ['bois clair', 'blanc', 'hygge', 'fonctionnel'],
    rooms: ['salon', 'chambre', 'bureau'],
  },
  {
    slug: 'industriel',
    name: 'Industriel',
    icon: Factory,
    description: 'Métal brut, brique apparente et esprit loft new-yorkais. Le style industriel célèbre les matériaux authentiques et les structures visibles pour un intérieur au caractère affirmé.',
    keywords: ['métal brut', 'brique', 'loft', 'caractère'],
    rooms: ['salon', 'cuisine', 'bureau'],
  },
  {
    slug: 'boheme',
    name: 'Bohème',
    icon: Leaf,
    description: 'Mix de textures, couleurs terracotta et collections voyageuses. Le style bohème invite à l\'évasion avec des tapis berbères, du macramé et une profusion de plantes vertes.',
    keywords: ['textures', 'terracotta', 'plantes', 'évasion'],
    rooms: ['salon', 'chambre'],
  },
  {
    slug: 'japandi',
    name: 'Japandi',
    icon: Sprout,
    description: 'Fusion parfaite entre minimalisme japonais et chaleur scandinave. Le Japandi privilégie les formes organiques, le bois et une palette de tons naturels apaisants.',
    keywords: ['japonais', 'scandinave', 'wabi-sabi', 'formes organiques'],
    rooms: ['chambre', 'salle-de-bain', 'salon'],
  },
  {
    slug: 'minimaliste',
    name: 'Minimaliste',
    icon: Square,
    description: 'L\'essentiel, rien de plus. Le style minimaliste élimine le superflu pour ne garder que le nécessaire. Chaque objet a sa raison d\'être dans un espace épuré et serein.',
    keywords: ['épuré', 'essentiel', 'espace', 'serein'],
    rooms: ['chambre', 'bureau'],
  },
  {
    slug: 'art-deco',
    name: 'Art Déco',
    icon: Sparkles,
    description: 'Glamour des années 20, dorures et motifs géométriques. L\'Art Déco mêle luxe et modernité avec des matières nobles comme le velours, le laiton et le marbre.',
    keywords: ['glamour', 'dorures', 'velours', 'années 20'],
    rooms: ['salon', 'chambre'],
  },
  {
    slug: 'contemporain',
    name: 'Contemporain',
    icon: LayoutGrid,
    description: 'Tendances actuelles et design d\'aujourd\'hui. Le style contemporain est en constante évolution, intégrant les dernières innovations en matière de design et de matériaux.',
    keywords: ['tendance', 'actuel', 'design', 'innovation'],
    rooms: ['salon', 'cuisine'],
  },
  {
    slug: 'rustique',
    name: 'Rustique',
    icon: TreeDeciduous,
    description: 'Bois massif, pierre naturelle et charme campagnard. Le style rustique crée une atmosphère authentique et enveloppante, parfaite pour les maisons de caractère.',
    keywords: ['bois massif', 'pierre', 'campagne', 'authentique'],
    rooms: ['cuisine', 'salle-a-manger'],
  },
  {
    slug: 'coastal',
    name: 'Coastal',
    icon: Waves,
    description: 'Bleu océan, blanc immaculé et matériaux naturels. Le style Coastal apporte la fraîcheur du bord de mer dans votre intérieur avec du rotin, du lin et des coquillages.',
    keywords: ['bord de mer', 'bleu', 'blanc', 'naturel'],
    rooms: ['salon', 'chambre'],
  },
  {
    slug: 'mid-century',
    name: 'Mid-Century Modern',
    icon: Armchair,
    description: 'Design iconique des années 50-60. Le Mid-Century Modern se caractérise par des pieds fuselés, des formes organiques et des couleurs vives ponctuelles sur fond bois.',
    keywords: ['années 50', 'pieds fuselés', 'formes organiques', 'iconique'],
    rooms: ['salon', 'bureau'],
  },
  {
    slug: 'luxe',
    name: 'Luxe',
    icon: Gem,
    description: 'Matériaux haut de gamme, finitions impeccables et détails raffinés. Le style Luxe ne fait aucun compromis sur la qualité, avec du marbre, des boiseries et de la soie.',
    keywords: ['haut de gamme', 'marbre', 'raffiné', 'prestige'],
    rooms: ['salon', 'chambre', 'salle-de-bain'],
  },
];

const FAQ = [
  {
    question: 'Quel est le style de décoration le plus populaire en 2025 ?',
    answer: 'Le Japandi et le Scandinave restent les styles les plus recherchés en France. Le Japandi séduit par son mélange de minimalisme japonais et de chaleur nordique, tandis que le Scandinave reste un classique intemporel pour sa luminosité et son côté cocooning.',
  },
  {
    question: 'Comment choisir le bon style de décoration pour mon intérieur ?',
    answer: 'Prenez en compte la luminosité de votre pièce, la surface disponible, votre mode de vie et vos goûts esthétiques. Avec InstaDeco, vous pouvez tester chaque style sur votre propre pièce en 30 secondes pour voir ce qui vous convient le mieux.',
  },
  {
    question: 'Peut-on mixer plusieurs styles de décoration ?',
    answer: 'Absolument ! Le mix & match est même très tendance. Le Japandi est lui-même une fusion de deux styles. L\'important est de garder un fil conducteur (palette de couleurs, type de matériaux) pour créer un ensemble cohérent.',
  },
];

export default async function StylesIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      <JsonLd data={[
        generateBreadcrumbList([{ label: 'Styles', path: withLocalePath(locale, '/styles') }], {
          home: { name: 'Accueil', url: withLocalePath(locale, '/') },
        }),
        generateFAQSchema(FAQ),
      ]} />

      <Breadcrumbs items={[{ label: 'Styles de décoration', href: '/styles' }]} />

      {/* HERO */}
      <section className="pt-16 pb-12">
        <div className="container px-4 md:px-6 text-center max-w-3xl mx-auto">
          <p className="prestige-eyebrow text-[var(--gold)] mb-4">Galerie des styles</p>
          <h1 className="prestige-display text-4xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
            12 Styles de <span className="text-[var(--gold)]">Décoration Intérieure</span>
          </h1>
          <p className="prestige-body text-lg text-muted-foreground mb-8">
            Explorez tous les styles disponibles sur InstaDeco AI. Chaque style peut être appliqué à n&apos;importe quelle pièce en 30 secondes. Trouvez le vôtre et testez-le sur votre photo.
          </p>
          <Button size="lg" className="rounded-full bg-[var(--gold)] text-[#0c0a09] border border-[var(--gold)] hover:bg-transparent hover:text-[var(--gold)]" asChild>
            <Link href="/quiz">
              <Palette className="w-4 h-4 mr-2" />
              Faire le quiz : mon style idéal
            </Link>
          </Button>
        </div>
      </section>

      {/* GRILLE DES STYLES */}
      <section className="pb-20 prestige-reveal">
        <div className="container px-4 md:px-6">
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {STYLES.map((style, idx) => (
              <Card key={style.slug} style={{ ['--reveal-d' as string]: `${(idx % 3) * 120}ms` }} className="prestige-reveal group bg-card border border-[var(--gold-line)] hover:border-[var(--gold)] hover:shadow-lg transition-all duration-500 ease">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[rgba(200,162,77,0.12)] border border-[var(--gold-line)]">
                      <style.icon className="w-6 h-6 text-[var(--gold)]" />
                    </span>
                    <div className="flex-1">
                      <Link href={`/style/${style.slug}`} className="block">
                        <h2 className="prestige-display text-xl font-bold text-foreground group-hover:text-[var(--gold)] transition-colors mb-2">
                          Style {style.name}
                        </h2>
                      </Link>
                      <p className="prestige-body text-sm text-muted-foreground mb-3">{style.description}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {style.keywords.map((kw) => (
                          <span key={kw} className="text-xs bg-[rgba(200,162,77,0.12)] text-[var(--gold)] border border-[var(--gold-line)] px-2 py-0.5 rounded-full">{kw}</span>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground mb-3">
                        Idéal pour : {style.rooms.map((r, i) => (
                          <span key={r}>
                            <Link href={`/deco/${style.slug}/${r}`} className="hover:text-[var(--gold)] hover:underline">
                              {r.replace(/-/g, ' ')}
                            </Link>
                            {i < style.rooms.length - 1 && ', '}
                          </span>
                        ))}
                      </div>
                      <Link
                        href={`/style/${style.slug}`}
                        className="text-sm text-[var(--gold)] hover:underline inline-flex items-center gap-1"
                      >
                        Découvrir le style {style.name} <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* TEXTE SEO */}
      <section className="py-16 bg-card border-t border-[var(--gold-line)]">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto prose prose-sm prose-invert">
          <h2 className="prestige-display text-2xl font-bold text-foreground">Comment choisir son style de décoration intérieure ?</h2>
          <p>
            Choisir un style de décoration, c&apos;est donner une identité à votre intérieur. Chaque style reflète une personnalité, un mode de vie et des valeurs esthétiques. Que vous soyez attiré par le <Link href="/style/minimaliste" className="text-[var(--gold)] hover:underline">minimalisme</Link> épuré ou l&apos;exubérance du <Link href="/style/boheme" className="text-[var(--gold)] hover:underline">style bohème</Link>, il existe un style fait pour vous.
          </p>
          <p>
            Avec InstaDeco AI, vous n&apos;avez plus besoin de vous en remettre à votre imagination. Prenez une photo de votre pièce, sélectionnez un style, et visualisez le résultat en 30 secondes. C&apos;est la meilleure façon de comparer les styles avant de se lancer dans des achats ou des travaux.
          </p>
          <h3 className="prestige-display text-lg font-semibold text-foreground">Les tendances déco en France</h3>
          <p>
            En France, le <Link href="/style/scandinave" className="text-[var(--gold)] hover:underline">style Scandinave</Link> reste indétrônable pour les petits espaces grâce à sa luminosité. Le <Link href="/style/japandi" className="text-[var(--gold)] hover:underline">Japandi</Link> monte en puissance avec son approche zen et durable. Pour les grands volumes, le <Link href="/style/industriel" className="text-[var(--gold)] hover:underline">style Industriel</Link> et le <Link href="/style/contemporain" className="text-[var(--gold)] hover:underline">Contemporain</Link> continuent de séduire.
          </p>
          <p>
            Et pour ceux qui veulent aller plus loin, nos <Link href="/solutions" className="text-[var(--gold)] hover:underline">solutions de décoration par IA</Link> couvrent tous les cas d&apos;usage : du <Link href="/solution/home-staging-virtuel" className="text-[var(--gold)] hover:underline">home staging virtuel</Link> à la <Link href="/solution/simulateur-decoration-interieur" className="text-[var(--gold)] hover:underline">simulation de décoration</Link>.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 border-t border-[var(--gold-line)]">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto">
          <p className="prestige-eyebrow text-[var(--gold)] text-center mb-3">FAQ</p>
          <h2 className="prestige-display text-2xl font-bold text-foreground text-center mb-8">Questions fréquentes</h2>
          <div className="space-y-4">
            {FAQ.map((item, i) => (
              <details key={i} className="group border border-border rounded-xl bg-card p-5">
                <summary className="flex cursor-pointer items-center justify-between font-medium text-sm text-foreground">
                  {item.question}
                  <ArrowRight className="h-4 w-4 text-[var(--gold)] transition-transform group-open:rotate-90 shrink-0 ml-4" />
                </summary>
                <p className="pt-3 text-sm text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-card border-t border-[var(--gold-line)]">
        <div className="container px-4 md:px-6 text-center">
          <p className="prestige-eyebrow text-[var(--gold)] mb-3">Votre intérieur vous attend</p>
          <h2 className="prestige-display text-2xl font-bold text-foreground mb-4">Prêt à trouver votre style ?</h2>
          <p className="prestige-body mb-6 text-muted-foreground">Testez n&apos;importe quel style sur votre propre pièce. 3 crédits offerts.</p>
          <Button size="lg" className="rounded-full bg-[var(--gold)] text-[#0c0a09] border border-[var(--gold)] hover:bg-transparent hover:text-[var(--gold)]" asChild>
            <Link href="/generate">
              Essayer maintenant <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
