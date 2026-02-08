/**
 * Page programmatique: Style de décoration
 * 
 * Pages SEO générées automatiquement pour chaque style.
 * Cible les requêtes "décoration [style]", "intérieur [style]", etc.
 * 
 * ~12 pages × moyenne 1000 visites/mois = 12k visites/mois potentielles
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowRight, Palette, Check, Star, Sparkles } from 'lucide-react';

const LeadCaptureLazy = dynamic(() => import('@/components/features/lead-capture').then(mod => ({ default: mod.LeadCapture })), { ssr: false });
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { JsonLd } from '@/lib/seo/json-ld';
import { generateFAQSchema, generateBreadcrumbList, generateArticleSchema } from '@/lib/seo/schemas';
import { getCanonicalUrl } from '@/lib/seo/config';
import { STYLE_SEO_DATA, getStyleSEOBySlug } from '@/lib/seo/programmatic-data';
import { CITIES } from '@/src/shared/constants/cities';

interface PageProps {
  params: { slug: string };
}

// Pre-render toutes les pages de style au build
export function generateStaticParams() {
  return STYLE_SEO_DATA.map((style) => ({
    slug: style.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const style = getStyleSEOBySlug(params.slug);
  if (!style) return { title: 'Style non trouvé' };

  return {
    title: style.metaTitle,
    description: style.metaDescription,
    keywords: style.keywords,
    openGraph: {
      title: style.metaTitle,
      description: style.metaDescription,
      type: 'article',
      url: getCanonicalUrl(`/style/${style.slug}`),
      images: [getCanonicalUrl('/og-image.png')],
    },
    twitter: {
      card: 'summary_large_image',
      title: style.title,
      description: style.metaDescription,
    },
    alternates: {
      canonical: getCanonicalUrl(`/style/${style.slug}`),
    },
  };
}

export default function StylePage({ params }: PageProps) {
  const style = getStyleSEOBySlug(params.slug);
  if (!style) notFound();

  // Villes populaires pour le maillage
  const popularCities = CITIES.filter((c) => 
    ['paris', 'lyon', 'geneve', 'bruxelles', 'marseille', 'lausanne'].includes(c.slug)
  );

  // Styles connexes pour le maillage
  const relatedStyles = STYLE_SEO_DATA
    .filter((s) => s.slug !== style.slug)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={[
        generateArticleSchema({
          title: style.title,
          description: style.metaDescription,
          url: getCanonicalUrl(`/style/${style.slug}`),
        }),
        generateBreadcrumbList([
          { label: 'Styles', path: '/exemples' },
          { label: style.name, path: `/style/${style.slug}` },
        ]),
        generateFAQSchema(style.faq),
      ]} />

      {/* Hero */}
      <section className="pt-20 pb-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto text-center space-y-6">
          <Badge variant="outline" className="px-4 py-1.5">
            <Palette className="w-3 h-3 mr-2" />
            Style de décoration
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
            {style.title}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {style.hero}
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button size="lg" className="rounded-full" asChild>
              <Link href="/generate">
                <Sparkles className="mr-2 w-4 h-4" />
                Essayer le style {style.name}
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

      {/* Description détaillée */}
      <section className="py-16">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-3xl font-bold mb-6">Qu&apos;est-ce que le style {style.name} ?</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {style.longDescription}
            </p>
          </div>

          {/* Caractéristiques */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card>
              <CardContent className="pt-6 space-y-3">
                <h3 className="font-bold text-lg">Couleurs clés</h3>
                <div className="flex flex-wrap gap-2">
                  {style.colors.map((color) => (
                    <Badge key={color} variant="secondary">{color}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 space-y-3">
                <h3 className="font-bold text-lg">Matériaux</h3>
                <div className="flex flex-wrap gap-2">
                  {style.materials.map((mat) => (
                    <Badge key={mat} variant="secondary">{mat}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 space-y-3">
                <h3 className="font-bold text-lg">Idéal pour</h3>
                <ul className="space-y-2">
                  {style.idealFor.map((use) => (
                    <li key={use} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      {use}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Budget & Difficulté */}
          <div className="flex flex-wrap gap-6 mt-8 justify-center">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Budget estimé</p>
              <p className="text-2xl font-bold">{style.priceRange}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Difficulté</p>
              <p className="text-2xl font-bold">{style.difficulty}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">
            Visualisez le style {style.name} dans VOTRE pièce
          </h2>
          <p className="text-primary-foreground/80 text-lg">
            Uploadez une photo de votre pièce actuelle et obtenez un rendu en style {style.name} en 10 secondes.
          </p>
          <Button size="lg" variant="secondary" className="rounded-full px-8" asChild>
            <Link href="/generate">
              Commencer la transformation
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-muted/20">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl font-bold text-center">Questions fréquentes sur le style {style.name}</h2>
          <div className="space-y-4">
            {style.faq.map((item, i) => (
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

      {/* Maillage interne: Styles connexes */}
      <section className="py-12 border-t">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto">
          <h3 className="text-xl font-bold mb-6">Découvrez aussi ces styles</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedStyles.map((rs) => (
              <Link
                key={rs.slug}
                href={`/style/${rs.slug}`}
                className="block p-4 border rounded-lg hover:border-primary transition-colors bg-card"
              >
                <p className="font-medium">{rs.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{rs.difficulty} • {rs.priceRange}</p>
              </Link>
            ))}
          </div>

          {/* Maillage villes */}
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4">
              Décoration {style.name} par ville
            </h3>
            <div className="flex flex-wrap gap-3">
              {popularCities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/architecte-interieur/${city.slug}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {style.name} à {city.name}
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
