/**
 * Page programmatique: Type de pièce
 * 
 * Pages SEO générées automatiquement pour chaque type de pièce.
 * Cible les requêtes "décoration [pièce]", "aménagement [pièce]", etc.
 * 
 * ~8 pages × moyenne 2000 visites/mois = 16k visites/mois potentielles
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Home, Check, Sparkles, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { JsonLd } from '@/lib/seo/json-ld';
import { generateFAQSchema, generateBreadcrumbList, generateArticleSchema } from '@/lib/seo/schemas';
import { getCanonicalUrl } from '@/lib/seo/config';
import { ROOM_SEO_DATA, STYLE_SEO_DATA, getRoomSEOBySlug } from '@/lib/seo/programmatic-data';
import { LeadCaptureLazy } from '@/components/features/lead-capture-lazy';
import { CITIES } from '@/src/shared/constants/cities';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Pre-render toutes les pages de pièce au build
export function generateStaticParams() {
  return ROOM_SEO_DATA.map((room) => ({
    slug: room.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const room = getRoomSEOBySlug(slug);
  if (!room) return { title: 'Pièce non trouvée' };

  return {
    title: room.metaTitle,
    description: room.metaDescription,
    keywords: room.keywords,
    openGraph: {
      title: room.metaTitle,
      description: room.metaDescription,
      type: 'article',
      url: getCanonicalUrl(`/piece/${room.slug}`),
      images: [getCanonicalUrl('/og-image.png')],
    },
    twitter: {
      card: 'summary_large_image',
      title: room.name,
      description: room.metaDescription,
    },
    alternates: {
      canonical: getCanonicalUrl(`/piece/${room.slug}`),
    },
  };
}

export default async function RoomPage({ params }: PageProps) {
  const { slug } = await params;
  const room = getRoomSEOBySlug(slug);
  if (!room) notFound();

  // Styles recommandés avec leurs données complètes
  const recommendedStyles = room.stylesRecommended
    .map((slug) => STYLE_SEO_DATA.find((s) => s.slug === slug))
    .filter(Boolean);

  // Autres pièces pour le maillage
  const otherRooms = ROOM_SEO_DATA.filter((r) => r.slug !== room.slug).slice(0, 4);

  // Villes populaires
  const topCities = CITIES.filter((c) =>
    ['paris', 'lyon', 'geneve', 'bruxelles', 'lausanne', 'marseille'].includes(c.slug)
  );

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={[
        generateArticleSchema({
          title: `Décoration ${room.name}`,
          description: room.metaDescription,
          url: getCanonicalUrl(`/piece/${room.slug}`),
        }),
        generateBreadcrumbList([
          { label: 'Pièces', path: '/exemples' },
          { label: room.name, path: `/piece/${room.slug}` },
        ]),
        generateFAQSchema(room.faq),
      ]} />

      {/* Hero */}
      <section className="pt-20 pb-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto text-center space-y-6">
          <Badge variant="outline" className="px-4 py-1.5">
            <Home className="w-3 h-3 mr-2" />
            Décoration par pièce
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
            Décoration {room.name}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {room.hero}
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button size="lg" className="rounded-full" asChild>
              <Link href="/generate">
                <Sparkles className="mr-2 w-4 h-4" />
                Transformer mon {room.name.toLowerCase()}
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full" asChild>
              <Link href="/exemples">
                Voir des exemples
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Description & Tips */}
      <section className="py-16">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-6">Aménager votre {room.name.toLowerCase()}</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {room.longDescription}
              </p>
            </div>
            <Card className="bg-primary/5 border-none">
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  Conseils d&apos;expert
                </h3>
                <ul className="space-y-3">
                  {room.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Styles recommandés */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto space-y-8">
          <h2 className="text-3xl font-bold text-center">
            Meilleurs styles pour votre {room.name.toLowerCase()}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedStyles.map((style) => style && (
              <Link key={style.slug} href={`/style/${style.slug}`} className="group">
                <Card className="h-full hover:border-primary transition-colors">
                  <CardContent className="pt-6 space-y-3">
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                      {style.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{style.hero}</p>
                    <div className="flex flex-wrap gap-1">
                      {style.colors.slice(0, 3).map((c) => (
                        <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {style.difficulty} • {style.priceRange}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">
            Prêt à transformer votre {room.name.toLowerCase()} ?
          </h2>
          <p className="text-primary-foreground/80 text-lg">
            Uploadez une photo de votre {room.name.toLowerCase()} actuel(le) et obtenez un rendu professionnel en 10 secondes.
          </p>
          <Button size="lg" variant="secondary" className="rounded-full px-8" asChild>
            <Link href="/generate">
              Commencer maintenant
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-muted/20">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl font-bold text-center">
            Questions fréquentes sur la décoration {room.name.toLowerCase()}
          </h2>
          <div className="space-y-4">
            {room.faq.map((item, i) => (
              <details key={i} className="group border rounded-xl bg-background p-6">
                <summary className="flex cursor-pointer items-center justify-between font-medium">
                  {item.question}
                  <ArrowRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                </summary>
                <div className="pt-4 text-muted-foreground">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Maillage interne */}
      <section className="py-12 border-t">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto space-y-8">
          {/* Autres pièces */}
          <div>
            <h3 className="text-xl font-bold mb-4">Décorer d&apos;autres pièces</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {otherRooms.map((r) => (
                <Link
                  key={r.slug}
                  href={`/piece/${r.slug}`}
                  className="block p-4 border rounded-lg hover:border-primary transition-colors bg-card"
                >
                  <p className="font-medium">Décoration {r.name}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Villes */}
          <div>
            <h3 className="text-xl font-bold mb-4">
              Décoration {room.name.toLowerCase()} par ville
            </h3>
            <div className="flex flex-wrap gap-3">
              {topCities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/architecte-interieur/${city.slug}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {room.name} à {city.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Lead Capture */}
      <LeadCaptureLazy variant="banner" delay={6000} />
    </div>
  );
}
