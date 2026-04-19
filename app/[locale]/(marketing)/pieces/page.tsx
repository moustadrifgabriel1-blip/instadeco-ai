import { Metadata } from 'next';
import Link from 'next/link';
import { Home, ArrowRight, Sofa, Bed, CookingPot, Bath, Monitor, DoorOpen, TreePine, UtensilsCrossed } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { JsonLd } from '@/lib/seo/json-ld';
import { generateBreadcrumbList, generateFAQSchema } from '@/lib/seo/schemas';
import { getCanonicalUrl } from '@/lib/seo/config';

export const metadata: Metadata = {
  title: 'Décoration par Pièce - Salon, Chambre, Cuisine, Bureau | InstaDeco AI',
  description: 'Trouvez l\'inspiration déco pour chaque pièce de votre maison. Salon, chambre, cuisine, salle de bain, bureau, entrée : visualisez la transformation par IA en 30 secondes.',
  keywords: [
    'décoration salon',
    'décoration chambre',
    'décoration cuisine',
    'décoration salle de bain',
    'décoration bureau',
    'idée déco par pièce',
    'aménagement intérieur',
  ],
  openGraph: {
    title: 'Décoration par Pièce - Tous les Types | InstaDeco AI',
    description: 'Inspiration déco pour salon, chambre, cuisine, bureau et plus. Visualisez avec l\'IA.',
    type: 'website',
    url: getCanonicalUrl('/pieces'),
  },
  alternates: {
    canonical: getCanonicalUrl('/pieces'),
  },
};

const ROOMS = [
  {
    slug: 'salon',
    name: 'Salon',
    icon: Sofa,
    description: 'Le cœur de la maison. Trouvez le style parfait pour votre pièce à vivre : du confort scandinave au loft industriel.',
    popularStyles: ['moderne', 'scandinave', 'boheme', 'japandi'],
    tips: 'Un canapé bien choisi définit 80% de l\'ambiance de votre salon.',
  },
  {
    slug: 'chambre',
    name: 'Chambre',
    icon: Bed,
    description: 'Votre sanctuaire de repos. Créez une atmosphère apaisante avec des styles doux et des palettes reposantes.',
    popularStyles: ['scandinave', 'japandi', 'minimaliste', 'boheme'],
    tips: 'Les couleurs froides (bleu, vert) favorisent l\'endormissement.',
  },
  {
    slug: 'cuisine',
    name: 'Cuisine',
    icon: CookingPot,
    description: 'Où fonctionnalité rencontre esthétique. Modernisez votre cuisine sans travaux grâce à la visualisation IA.',
    popularStyles: ['moderne', 'industriel', 'contemporain', 'scandinave'],
    tips: 'L\'éclairage sous les meubles hauts transforme l\'ambiance d\'une cuisine.',
  },
  {
    slug: 'salle-de-bain',
    name: 'Salle de bain',
    icon: Bath,
    description: 'Votre spa personnel. Du zen japandi au luxe contemporain, transformez votre salle de bain en oasis de bien-être.',
    popularStyles: ['japandi', 'moderne', 'luxe', 'minimaliste'],
    tips: 'Les matériaux naturels (bois, pierre) résistent bien à l\'humidité et créent une ambiance spa.',
  },
  {
    slug: 'bureau',
    name: 'Bureau',
    icon: Monitor,
    description: 'Productivité et inspiration. Aménagez un espace de travail qui stimule votre créativité et votre concentration.',
    popularStyles: ['scandinave', 'industriel', 'minimaliste', 'mid-century'],
    tips: 'Un bureau face à la lumière naturelle réduit la fatigue oculaire de 40%.',
  },
  {
    slug: 'entree',
    name: 'Entrée',
    icon: DoorOpen,
    description: 'La première impression compte. Optimisez cet espace souvent négligé pour un accueil chaleureux et pratique.',
    popularStyles: ['moderne', 'scandinave', 'contemporain'],
    tips: 'Un miroir agrandit visuellement l\'entrée et apporte de la lumière.',
  },
  {
    slug: 'terrasse',
    name: 'Terrasse',
    icon: TreePine,
    description: 'Extension de votre intérieur. Créez un espace extérieur confortable et esthétique pour profiter des beaux jours.',
    popularStyles: ['coastal', 'boheme', 'moderne'],
    tips: 'Privilégiez des matériaux résistants aux intempéries comme le teck ou l\'aluminium.',
  },
  {
    slug: 'salle-a-manger',
    name: 'Salle à manger',
    icon: UtensilsCrossed,
    description: 'Le lieu de convivialité. Trouvez le style idéal pour vos repas en famille et entre amis.',
    popularStyles: ['scandinave', 'rustique', 'contemporain', 'mid-century'],
    tips: 'Un luminaire suspendu centré au-dessus de la table crée un point focal élégant.',
  },
];

const FAQ = [
  {
    question: 'Quelle pièce décorer en premier ?',
    answer: 'Le salon est généralement la pièce prioritaire car c\'est le cœur de la maison et la pièce la plus visible. Cependant, la chambre est tout aussi importante pour votre bien-être quotidien. Avec InstaDeco, vous pouvez tester toutes les pièces rapidement pour prioriser vos envies.',
  },
  {
    question: 'L\'IA fonctionne-t-elle avec toutes les tailles de pièces ?',
    answer: 'Oui, InstaDeco s\'adapte à toutes les tailles : du studio de 20m² au salon de 60m². L\'IA analyse la structure de votre espace (murs, fenêtres, volumes) pour proposer un résultat qui respecte les proportions de votre pièce.',
  },
  {
    question: 'Puis-je appliquer le même style à plusieurs pièces ?',
    answer: 'Absolument ! C\'est même recommandé pour créer une cohérence dans votre intérieur. Beaucoup de nos utilisateurs importent les photos de chaque pièce et appliquent le même style pour visualiser un intérieur harmonieux.',
  },
];

export default function PiecesIndexPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <JsonLd data={[
        generateBreadcrumbList([{ label: 'Pièces', path: '/pieces' }]),
        generateFAQSchema(FAQ),
      ]} />

      <Breadcrumbs items={[{ label: 'Décoration par pièce', href: '/pieces' }]} />

      {/* HERO */}
      <section className="pt-16 pb-12">
        <div className="container px-4 md:px-6 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Décorez chaque <span className="text-primary">pièce</span> de votre intérieur
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Salon, chambre, cuisine, bureau : notre IA s&apos;adapte à chaque espace. Cliquez sur une pièce pour découvrir les styles recommandés et visualiser votre transformation.
          </p>
          <Button size="lg" className="rounded-full" asChild>
            <Link href="/generate">
              <Home className="w-4 h-4 mr-2" />
              Décorer ma pièce maintenant
            </Link>
          </Button>
        </div>
      </section>

      {/* GRILLE DES PIÈCES */}
      <section className="pb-20">
        <div className="container px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-6">
            {ROOMS.map((room) => {
              const Icon = room.icon;
              return (
                <Card key={room.slug} className="group hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <Link href={`/piece/${room.slug}`}>
                          <h2 className="text-xl font-bold group-hover:text-primary transition-colors mb-2">
                            {room.name}
                          </h2>
                        </Link>
                        <p className="text-sm text-muted-foreground mb-3">{room.description}</p>
                        <p className="text-xs text-muted-foreground italic mb-3">💡 {room.tips}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="text-xs text-muted-foreground">Styles populaires :</span>
                          {room.popularStyles.map((style) => (
                            <Link
                              key={style}
                              href={`/deco/${style}/${room.slug}`}
                              className="text-xs bg-primary/5 text-primary hover:bg-primary/10 px-2 py-0.5 rounded-full transition-colors capitalize"
                            >
                              {style.replace(/-/g, ' ')}
                            </Link>
                          ))}
                        </div>
                        <Link
                          href={`/piece/${room.slug}`}
                          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Voir les idées {room.name.toLowerCase()} <ArrowRight className="w-3 h-3" />
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
      <section className="py-16 bg-muted/20 border-t">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto prose prose-sm">
          <h2 className="text-2xl font-bold">Comment bien décorer chaque pièce de sa maison ?</h2>
          <p>
            Chaque pièce a ses contraintes et ses opportunités. Le <Link href="/piece/salon" className="text-primary hover:underline">salon</Link> doit être accueillant et fonctionnel, la <Link href="/piece/chambre" className="text-primary hover:underline">chambre</Link> reposante, la <Link href="/piece/cuisine" className="text-primary hover:underline">cuisine</Link> pratique et esthétique.
          </p>
          <p>
            Avec InstaDeco AI, vous pouvez tester tous les <Link href="/styles" className="text-primary hover:underline">styles de décoration</Link> sur n&apos;importe quelle de vos pièces. Prenez une photo avec votre smartphone, choisissez un style, et découvrez le résultat en 30 secondes. C&apos;est la façon la plus rapide de trouver la bonne direction déco avant de dépenser le moindre euro.
          </p>
          <p>
            Pour les professionnels de l&apos;immobilier, notre <Link href="/solution/home-staging-virtuel" className="text-primary hover:underline">solution de home staging virtuel</Link> permet de meubler virtuellement chaque pièce pour déclencher plus de visites.
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
          <h2 className="text-2xl font-bold mb-4">Quelle pièce allez-vous transformer ?</h2>
          <p className="mb-6 text-primary-foreground/80">Prenez votre smartphone, choisissez votre pièce, et admirez le résultat.</p>
          <Button size="lg" variant="secondary" className="rounded-full" asChild>
            <Link href="/generate">
              Commencer maintenant <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
