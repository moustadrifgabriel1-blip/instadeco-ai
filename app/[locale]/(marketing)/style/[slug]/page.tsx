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
import { ArrowRight, Palette, Check, Star, Sparkles } from 'lucide-react';
import { LeadCaptureLazy } from '@/components/features/lead-capture-lazy';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { JsonLd } from '@/lib/seo/json-ld';
import { generateFAQSchema, generateBreadcrumbList, generateWebPageSchema } from '@/lib/seo/schemas';
import { getCanonicalUrl, getLocalizedCanonicalUrl, withLocalePath, frOnlyProgrammaticMeta } from '@/lib/seo/config';
import { STYLE_SEO_DATA, getStyleSEOBySlug } from '@/lib/seo/programmatic-data';
import { CITIES } from '@/src/shared/constants/cities';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

// Pre-render toutes les pages de style au build
export function generateStaticParams() {
  return STYLE_SEO_DATA.map((style) => ({
    slug: style.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const style = getStyleSEOBySlug(slug);
  if (!style) return { title: 'Style non trouvé' };

  const path = `/style/${style.slug}`;

  return {
    title: style.metaTitle,
    description: style.metaDescription,
    keywords: style.keywords,
    openGraph: {
      title: style.metaTitle,
      description: style.metaDescription,
      type: 'article',
      url: getLocalizedCanonicalUrl(locale, path),
      images: [getCanonicalUrl('/og-image.png')],
    },
    twitter: {
      card: 'summary_large_image',
      title: style.title,
      description: style.metaDescription,
    },
    ...frOnlyProgrammaticMeta(locale, path),
  };
}

export default async function StylePage({ params }: PageProps) {
  const { locale, slug } = await params;
  const style = getStyleSEOBySlug(slug);
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
    <div className="min-h-[100dvh] bg-background">
      <JsonLd data={[
        generateWebPageSchema({
          title: style.title,
          description: style.metaDescription,
          url: getLocalizedCanonicalUrl(locale, `/style/${style.slug}`),
        }, locale),
        generateBreadcrumbList([
          { label: 'Styles', path: withLocalePath(locale, '/exemples') },
          { label: style.name, path: withLocalePath(locale, `/style/${style.slug}`) },
        ], {
          home: { name: 'Accueil', url: withLocalePath(locale, '/') },
        }),
        generateFAQSchema(style.faq),
      ]} />

      {/* Hero */}
      <section className="pt-20 pb-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto text-center space-y-6">
          <Badge variant="outline" className="px-4 py-1.5 border-[var(--gold-line)]">
            <Palette className="w-3 h-3 mr-2 text-[var(--gold)]" />
            <span className="prestige-eyebrow">Style de décoration</span>
          </Badge>
          <h1 className="prestige-display text-3xl xs:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight break-words">
            {style.title}
          </h1>
          <div className="prestige-rule mx-auto w-24" />
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {style.hero}
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button
              size="lg"
              className="rounded-full bg-[var(--gold)] text-[#0c0a09] border border-[var(--gold)] hover:bg-transparent hover:text-[var(--gold)] transition duration-300 ease"
              asChild
            >
              <Link href="/generate">
                <Sparkles className="mr-2 w-4 h-4" />
                Essayer le style {style.name}
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-[var(--gold)] text-[var(--gold)] bg-transparent hover:bg-[var(--gold)] hover:text-[#0c0a09] transition duration-300 ease"
              asChild
            >
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
          <div className="prestige-reveal prose prose-lg max-w-none">
            <h2 className="prestige-display text-3xl font-bold mb-6">
              Qu&apos;est-ce que le style <span className="text-[var(--gold)] italic">{style.name}</span> ?
            </h2>
            <div className="prestige-rule w-24 mb-6 not-prose" />
            <p className="text-muted-foreground text-lg leading-relaxed">
              {style.longDescription}
            </p>
          </div>

          {/* Caractéristiques */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card className="prestige-reveal bg-card border border-[var(--gold-line)] transition duration-300 ease" style={{ ['--reveal-d' as string]: '120ms' }}>
              <CardContent className="pt-6 space-y-3">
                <h3 className="prestige-display font-bold text-lg">Couleurs clés</h3>
                <div className="flex flex-wrap gap-2">
                  {style.colors.map((color) => (
                    <Badge key={color} variant="secondary">{color}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="prestige-reveal bg-card border border-[var(--gold-line)] transition duration-300 ease" style={{ ['--reveal-d' as string]: '240ms' }}>
              <CardContent className="pt-6 space-y-3">
                <h3 className="prestige-display font-bold text-lg">Matériaux</h3>
                <div className="flex flex-wrap gap-2">
                  {style.materials.map((mat) => (
                    <Badge key={mat} variant="secondary">{mat}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="prestige-reveal bg-card border border-[var(--gold-line)] transition duration-300 ease" style={{ ['--reveal-d' as string]: '360ms' }}>
              <CardContent className="pt-6 space-y-3">
                <h3 className="prestige-display font-bold text-lg">Idéal pour</h3>
                <ul className="space-y-2">
                  {style.idealFor.map((use) => (
                    <li key={use} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-[var(--gold)]" />
                      {use}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Budget & Difficulté */}
          <div className="prestige-reveal flex flex-wrap gap-6 mt-8 justify-center">
            <div className="text-center">
              <p className="prestige-eyebrow">Budget estimé</p>
              <p className="prestige-display text-2xl font-bold mt-2">{style.priceRange}</p>
            </div>
            <div className="text-center">
              <p className="prestige-eyebrow">Difficulté</p>
              <p className="prestige-display text-2xl font-bold mt-2">{style.difficulty}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="prestige-reveal container px-4 md:px-6 max-w-3xl mx-auto text-center space-y-6">
          <h2 className="prestige-display text-3xl font-bold">
            Visualisez le style {style.name} dans <span className="text-[var(--gold)] italic">VOTRE</span> pièce
          </h2>
          <p className="text-primary-foreground/80 text-lg">
            Uploadez une photo de votre pièce actuelle et obtenez un rendu en style {style.name} en 30 secondes.
          </p>
          <Button
            size="lg"
            className="rounded-full px-8 bg-[var(--gold)] text-[#0c0a09] border border-[var(--gold)] hover:bg-transparent hover:text-[var(--gold)] transition duration-300 ease"
            asChild
          >
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
          <div className="prestige-reveal text-center space-y-4">
            <h2 className="prestige-display text-3xl font-bold">Questions fréquentes sur le style {style.name}</h2>
            <div className="prestige-rule mx-auto w-24" />
          </div>
          <div className="space-y-4">
            {style.faq.map((item, i) => (
              <details
                key={i}
                className="prestige-reveal group border border-[var(--gold-line)] rounded-xl bg-card p-6 transition duration-300 ease"
                style={{ ['--reveal-d' as string]: `${Math.min(i, 4) * 80}ms` }}
              >
                <summary className="flex cursor-pointer items-center justify-between font-medium">
                  {item.question}
                  <ArrowRight className="h-4 w-4 text-[var(--gold)] transition-transform group-open:rotate-90" />
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
      <section className="py-12 border-t border-[var(--gold-line)]">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto">
          <h3 className="prestige-reveal prestige-display text-xl font-bold mb-6">Découvrez aussi ces styles</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedStyles.map((rs, i) => (
              <Link
                key={rs.slug}
                href={`/style/${rs.slug}`}
                className="prestige-reveal block p-4 border border-[var(--gold-line)] rounded-lg hover:border-[var(--gold)] transition duration-300 ease bg-card"
                style={{ ['--reveal-d' as string]: `${i * 100}ms` }}
              >
                <p className="prestige-display font-medium">{rs.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{rs.difficulty} • {rs.priceRange}</p>
              </Link>
            ))}
          </div>

          {/* Maillage villes */}
          <div className="prestige-reveal mt-8">
            <h3 className="prestige-display text-xl font-bold mb-4">
              Décoration {style.name} par ville
            </h3>
            <div className="flex flex-wrap gap-3">
              {popularCities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/architecte-interieur/${city.slug}`}
                  className="text-sm text-muted-foreground hover:text-[var(--gold)] transition duration-300 ease"
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
