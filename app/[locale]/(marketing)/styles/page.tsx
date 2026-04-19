import { Metadata } from 'next';
import Link from 'next/link';
import { Palette, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { JsonLd } from '@/lib/seo/json-ld';
import { generateBreadcrumbList, generateFAQSchema } from '@/lib/seo/schemas';
import { getCanonicalUrl } from '@/lib/seo/config';

export const metadata: Metadata = {
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
    url: getCanonicalUrl('/styles'),
  },
  alternates: {
    canonical: getCanonicalUrl('/styles'),
  },
};

const STYLES = [
  {
    slug: 'moderne',
    name: 'Moderne',
    emoji: '🏢',
    description: 'Lignes épurées, matériaux nobles et palette de couleurs neutres. Le style moderne mise sur l\'élégance minimaliste avec des meubles aux formes géométriques et des espaces ouverts.',
    keywords: ['lignes épurées', 'matériaux nobles', 'palette neutre'],
    rooms: ['salon', 'cuisine', 'salle-de-bain'],
  },
  {
    slug: 'scandinave',
    name: 'Scandinave',
    emoji: '🌲',
    description: 'Bois clair, blanc dominant et textiles chaleureux. Le style scandinave ou nordique apporte luminosité et fonctionnalité, avec un mobilier simple et des touches de hygge.',
    keywords: ['bois clair', 'blanc', 'hygge', 'fonctionnel'],
    rooms: ['salon', 'chambre', 'bureau'],
  },
  {
    slug: 'industriel',
    name: 'Industriel',
    emoji: '🏭',
    description: 'Métal brut, brique apparente et esprit loft new-yorkais. Le style industriel célèbre les matériaux authentiques et les structures visibles pour un intérieur au caractère affirmé.',
    keywords: ['métal brut', 'brique', 'loft', 'caractère'],
    rooms: ['salon', 'cuisine', 'bureau'],
  },
  {
    slug: 'boheme',
    name: 'Bohème',
    emoji: '🌿',
    description: 'Mix de textures, couleurs terracotta et collections voyageuses. Le style bohème invite à l\'évasion avec des tapis berbères, du macramé et une profusion de plantes vertes.',
    keywords: ['textures', 'terracotta', 'plantes', 'évasion'],
    rooms: ['salon', 'chambre'],
  },
  {
    slug: 'japandi',
    name: 'Japandi',
    emoji: '🎋',
    description: 'Fusion parfaite entre minimalisme japonais et chaleur scandinave. Le Japandi privilégie les formes organiques, le bois et une palette de tons naturels apaisants.',
    keywords: ['japonais', 'scandinave', 'wabi-sabi', 'formes organiques'],
    rooms: ['chambre', 'salle-de-bain', 'salon'],
  },
  {
    slug: 'minimaliste',
    name: 'Minimaliste',
    emoji: '⬜',
    description: 'L\'essentiel, rien de plus. Le style minimaliste élimine le superflu pour ne garder que le nécessaire. Chaque objet a sa raison d\'être dans un espace épuré et serein.',
    keywords: ['épuré', 'essentiel', 'espace', 'serein'],
    rooms: ['chambre', 'bureau'],
  },
  {
    slug: 'art-deco',
    name: 'Art Déco',
    emoji: '✨',
    description: 'Glamour des années 20, dorures et motifs géométriques. L\'Art Déco mêle luxe et modernité avec des matières nobles comme le velours, le laiton et le marbre.',
    keywords: ['glamour', 'dorures', 'velours', 'années 20'],
    rooms: ['salon', 'chambre'],
  },
  {
    slug: 'contemporain',
    name: 'Contemporain',
    emoji: '🔲',
    description: 'Tendances actuelles et design d\'aujourd\'hui. Le style contemporain est en constante évolution, intégrant les dernières innovations en matière de design et de matériaux.',
    keywords: ['tendance', 'actuel', 'design', 'innovation'],
    rooms: ['salon', 'cuisine'],
  },
  {
    slug: 'rustique',
    name: 'Rustique',
    emoji: '🪵',
    description: 'Bois massif, pierre naturelle et charme campagnard. Le style rustique crée une atmosphère authentique et enveloppante, parfaite pour les maisons de caractère.',
    keywords: ['bois massif', 'pierre', 'campagne', 'authentique'],
    rooms: ['cuisine', 'salle-a-manger'],
  },
  {
    slug: 'coastal',
    name: 'Coastal',
    emoji: '🌊',
    description: 'Bleu océan, blanc immaculé et matériaux naturels. Le style Coastal apporte la fraîcheur du bord de mer dans votre intérieur avec du rotin, du lin et des coquillages.',
    keywords: ['bord de mer', 'bleu', 'blanc', 'naturel'],
    rooms: ['salon', 'chambre'],
  },
  {
    slug: 'mid-century',
    name: 'Mid-Century Modern',
    emoji: '🪑',
    description: 'Design iconique des années 50-60. Le Mid-Century Modern se caractérise par des pieds fuselés, des formes organiques et des couleurs vives ponctuelles sur fond bois.',
    keywords: ['années 50', 'pieds fuselés', 'formes organiques', 'iconique'],
    rooms: ['salon', 'bureau'],
  },
  {
    slug: 'luxe',
    name: 'Luxe',
    emoji: '💎',
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

export default function StylesIndexPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <JsonLd data={[
        generateBreadcrumbList([{ label: 'Styles', path: '/styles' }]),
        generateFAQSchema(FAQ),
      ]} />

      <Breadcrumbs items={[{ label: 'Styles de décoration', href: '/styles' }]} />

      {/* HERO */}
      <section className="pt-16 pb-12">
        <div className="container px-4 md:px-6 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            12 Styles de <span className="text-primary">Décoration Intérieure</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Explorez tous les styles disponibles sur InstaDeco AI. Chaque style peut être appliqué à n&apos;importe quelle pièce en 30 secondes. Trouvez le vôtre et testez-le sur votre photo.
          </p>
          <Button size="lg" className="rounded-full" asChild>
            <Link href="/quiz">
              <Palette className="w-4 h-4 mr-2" />
              Faire le quiz : mon style idéal
            </Link>
          </Button>
        </div>
      </section>

      {/* GRILLE DES STYLES */}
      <section className="pb-20">
        <div className="container px-4 md:px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {STYLES.map((style) => (
              <Card key={style.slug} className="group hover:shadow-lg transition-shadow border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">{style.emoji}</span>
                    <div className="flex-1">
                      <Link href={`/style/${style.slug}`} className="block">
                        <h2 className="text-xl font-bold group-hover:text-primary transition-colors mb-2">
                          Style {style.name}
                        </h2>
                      </Link>
                      <p className="text-sm text-muted-foreground mb-3">{style.description}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {style.keywords.map((kw) => (
                          <span key={kw} className="text-xs bg-muted px-2 py-0.5 rounded-full">{kw}</span>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground mb-3">
                        Idéal pour : {style.rooms.map((r, i) => (
                          <span key={r}>
                            <Link href={`/deco/${style.slug}/${r}`} className="hover:text-primary hover:underline">
                              {r.replace(/-/g, ' ')}
                            </Link>
                            {i < style.rooms.length - 1 && ', '}
                          </span>
                        ))}
                      </div>
                      <Link
                        href={`/style/${style.slug}`}
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1"
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
      <section className="py-16 bg-muted/20 border-t">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto prose prose-sm">
          <h2 className="text-2xl font-bold">Comment choisir son style de décoration intérieure ?</h2>
          <p>
            Choisir un style de décoration, c&apos;est donner une identité à votre intérieur. Chaque style reflète une personnalité, un mode de vie et des valeurs esthétiques. Que vous soyez attiré par le <Link href="/style/minimaliste" className="text-primary hover:underline">minimalisme</Link> épuré ou l&apos;exubérance du <Link href="/style/boheme" className="text-primary hover:underline">style bohème</Link>, il existe un style fait pour vous.
          </p>
          <p>
            Avec InstaDeco AI, vous n&apos;avez plus besoin de vous en remettre à votre imagination. Prenez une photo de votre pièce, sélectionnez un style, et visualisez le résultat en 30 secondes. C&apos;est la meilleure façon de comparer les styles avant de se lancer dans des achats ou des travaux.
          </p>
          <h3 className="text-lg font-semibold">Les tendances déco en France</h3>
          <p>
            En France, le <Link href="/style/scandinave" className="text-primary hover:underline">style Scandinave</Link> reste indétrônable pour les petits espaces grâce à sa luminosité. Le <Link href="/style/japandi" className="text-primary hover:underline">Japandi</Link> monte en puissance avec son approche zen et durable. Pour les grands volumes, le <Link href="/style/industriel" className="text-primary hover:underline">style Industriel</Link> et le <Link href="/style/contemporain" className="text-primary hover:underline">Contemporain</Link> continuent de séduire.
          </p>
          <p>
            Et pour ceux qui veulent aller plus loin, nos <Link href="/solutions" className="text-primary hover:underline">solutions de décoration par IA</Link> couvrent tous les cas d&apos;usage : du <Link href="/solution/home-staging-virtuel" className="text-primary hover:underline">home staging virtuel</Link> à la <Link href="/solution/simulateur-decoration-interieur" className="text-primary hover:underline">simulation de décoration</Link>.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 border-t">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Questions fréquentes</h2>
          <div className="space-y-4">
            {FAQ.map((item, i) => (
              <details key={i} className="group border rounded-xl bg-background p-5">
                <summary className="flex cursor-pointer items-center justify-between font-medium text-sm">
                  {item.question}
                  <ArrowRight className="h-4 w-4 transition-transform group-open:rotate-90 shrink-0 ml-4" />
                </summary>
                <p className="pt-3 text-sm text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Prêt à trouver votre style ?</h2>
          <p className="mb-6 text-primary-foreground/80">Testez n&apos;importe quel style sur votre propre pièce. 3 crédits offerts.</p>
          <Button size="lg" variant="secondary" className="rounded-full" asChild>
            <Link href="/generate">
              Essayer maintenant <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
