/**
 * Pages SEO Intent - Ciblage requêtes intentionnelles
 * 
 * /solution/home-staging-virtuel
 * /solution/simulateur-decoration-interieur
 * /solution/logiciel-home-staging
 * /solution/idee-amenagement-studio
 * /solution/simulateur-peinture
 * /solution/decoration-salon
 * /solution/decoration-chambre
 * /solution/avant-apres-decoration
 * 
 * 8 pages × 2000+ visites/mois potentielles = 16k visiteurs qualifiés
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ArrowRight, Clock, Euro, Palette, Camera, Zap, Upload, Download,
  Globe, Brain, Layers, TrendingUp, Maximize, Repeat, Eye,
  Sun, Shield, Share2, Heart, Moon, Sparkles, Check, Star, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { JsonLd } from '@/lib/seo/json-ld';
import { generateFAQSchema, generateBreadcrumbList, generateArticleSchema } from '@/lib/seo/schemas';
import { getCanonicalUrl } from '@/lib/seo/config';
import { INTENT_PAGES, getIntentPageBySlug } from '@/lib/seo/intent-pages-data';

const LeadCaptureLazy = dynamic(
  () => import('@/components/features/lead-capture').then(mod => ({ default: mod.LeadCapture })),
  { ssr: false }
);

interface PageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return INTENT_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = getIntentPageBySlug(params.slug);
  if (!page) return { title: 'Page non trouvée' };

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    keywords: page.keywords,
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      type: 'article',
      url: getCanonicalUrl(`/solution/${page.slug}`),
      images: [getCanonicalUrl('/og-image.png')],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description: page.metaDescription,
    },
    alternates: {
      canonical: getCanonicalUrl(`/solution/${page.slug}`),
    },
  };
}

/** Map d'icônes pour les benefits */
const iconMap: Record<string, React.ReactNode> = {
  clock: <Clock className="w-6 h-6" />,
  euro: <Euro className="w-6 h-6" />,
  palette: <Palette className="w-6 h-6" />,
  camera: <Camera className="w-6 h-6" />,
  zap: <Zap className="w-6 h-6" />,
  upload: <Upload className="w-6 h-6" />,
  download: <Download className="w-6 h-6" />,
  globe: <Globe className="w-6 h-6" />,
  brain: <Brain className="w-6 h-6" />,
  layers: <Layers className="w-6 h-6" />,
  'trending-up': <TrendingUp className="w-6 h-6" />,
  maximize: <Maximize className="w-6 h-6" />,
  repeat: <Repeat className="w-6 h-6" />,
  eye: <Eye className="w-6 h-6" />,
  sun: <Sun className="w-6 h-6" />,
  shield: <Shield className="w-6 h-6" />,
  share: <Share2 className="w-6 h-6" />,
  heart: <Heart className="w-6 h-6" />,
  moon: <Moon className="w-6 h-6" />,
  sparkles: <Sparkles className="w-6 h-6" />,
  // Fallback
  sofa: <Sparkles className="w-6 h-6" />,
  bed: <Moon className="w-6 h-6" />,
  split: <Layers className="w-6 h-6" />,
};

export default function IntentPage({ params }: PageProps) {
  const page = getIntentPageBySlug(params.slug);
  if (!page) notFound();

  const relatedPages = INTENT_PAGES.filter((p) => p.slug !== page.slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={[
        generateArticleSchema({
          title: page.title,
          description: page.metaDescription,
          url: getCanonicalUrl(`/solution/${page.slug}`),
        }),
        generateBreadcrumbList([
          { label: 'Accueil', path: '/' },
          { label: page.title, path: `/solution/${page.slug}` },
        ]),
        generateFAQSchema(page.faq),
      ]} />

      {/* ===== HERO ===== */}
      <section className="pt-20 pb-16 bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-white">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto text-center space-y-6">
          <Badge className="bg-[#E07B54]/20 text-[#E07B54] border-[#E07B54]/30 px-4 py-1.5">
            <Sparkles className="w-3 h-3 mr-2" />
            Propulsé par l&apos;IA
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
            {page.hero.headline}
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {page.hero.subheadline}
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button size="lg" className="rounded-full bg-[#E07B54] hover:bg-[#D4603C] text-white px-8" asChild>
              <Link href={page.hero.ctaLink}>
                {page.hero.cta}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10 px-8" asChild>
              <Link href="/pricing">
                Voir les tarifs
              </Link>
            </Button>
          </div>
          {/* Trust signals */}
          <div className="flex items-center justify-center gap-6 pt-6 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              4.8/5 (2 400+ avis)
            </span>
            <span>+12 000 utilisateurs</span>
            <span>Essai gratuit</span>
          </div>
        </div>
      </section>

      {/* ===== PROBLÈME ===== */}
      <section className="py-16">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">{page.problem.title}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {page.problem.points.map((point, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/30">
                <span className="text-red-500 text-lg mt-0.5">✗</span>
                <p className="text-sm text-gray-700 dark:text-gray-300">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SOLUTION ===== */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">{page.solution.title}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {page.solution.description}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {page.solution.benefits.map((benefit, i) => (
              <Card key={i} className="border-0 shadow-md">
                <CardContent className="pt-6 text-center space-y-3">
                  <div className="w-12 h-12 bg-[#E07B54]/10 rounded-xl flex items-center justify-center mx-auto text-[#E07B54]">
                    {iconMap[benefit.icon] || <Sparkles className="w-6 h-6" />}
                  </div>
                  <h3 className="font-bold text-lg">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== COMPARAISON ===== */}
      {page.comparison && (
        <section className="py-16">
          <div className="container px-4 md:px-6 max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold text-center">{page.comparison.title}</h2>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4 px-4 font-semibold">Solution</th>
                    <th className="text-center py-4 px-4 font-semibold">Prix</th>
                    <th className="text-center py-4 px-4 font-semibold">Délai</th>
                    <th className="text-center py-4 px-4 font-semibold">Qualité</th>
                  </tr>
                </thead>
                <tbody>
                  {page.comparison.alternatives.map((alt, i) => (
                    <tr
                      key={i}
                      className={`border-b ${alt.isUs ? 'bg-[#E07B54]/5 font-semibold' : ''}`}
                    >
                      <td className="py-4 px-4">
                        {alt.isUs && <Badge className="bg-[#E07B54] text-white mr-2 text-xs">Recommandé</Badge>}
                        {alt.name}
                      </td>
                      <td className="text-center py-4 px-4">{alt.price}</td>
                      <td className="text-center py-4 px-4">{alt.time}</td>
                      <td className="text-center py-4 px-4">{alt.quality}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-4">
              {page.comparison.alternatives.map((alt, i) => (
                <Card key={i} className={alt.isUs ? 'border-[#E07B54] ring-1 ring-[#E07B54]' : ''}>
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      {alt.isUs && <Badge className="bg-[#E07B54] text-white text-xs">Recommandé</Badge>}
                      <h3 className="font-bold">{alt.name}</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Prix:</span> {alt.price}</div>
                      <div><span className="text-muted-foreground">Délai:</span> {alt.time}</div>
                      <div><span className="text-muted-foreground">Qualité:</span> {alt.quality}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== ÉTAPES ===== */}
      <section className="py-16 bg-muted/20">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto space-y-10">
          <h2 className="text-3xl font-bold text-center">Comment ça marche ?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {page.steps.map((step) => (
              <div key={step.step} className="text-center space-y-4">
                <div className="w-14 h-14 bg-[#E07B54] text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                  {step.step}
                </div>
                <h3 className="text-lg font-bold">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center pt-4">
            <Button size="lg" className="rounded-full bg-[#E07B54] hover:bg-[#D4603C] text-white px-8" asChild>
              <Link href="/generate">
                Essayer maintenant
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ===== CTA MILIEU ===== */}
      <section className="py-16 bg-gradient-to-r from-[#E07B54] to-[#D4603C] text-white">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">Prêt à transformer votre intérieur ?</h2>
          <p className="text-white/80 text-lg">
            Essai gratuit — aucune carte bancaire requise.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" className="rounded-full px-8" asChild>
              <Link href="/generate">
                Commencer gratuitement
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 border-white/30 text-white hover:bg-white/10" asChild>
              <Link href="/pricing">
                Voir les tarifs
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-16 bg-muted/20">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl font-bold text-center">Questions fréquentes</h2>
          <div className="space-y-4">
            {page.faq.map((item, i) => (
              <details key={i} className="group border rounded-xl bg-background p-6">
                <summary className="flex cursor-pointer items-center justify-between font-medium">
                  {item.question}
                  <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90 text-muted-foreground" />
                </summary>
                <div className="pt-4 text-muted-foreground">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PAGES LIÉES ===== */}
      <section className="py-12 border-t">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto">
          <h3 className="text-xl font-bold mb-6">Découvrez aussi</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {relatedPages.map((rp) => (
              <Link
                key={rp.slug}
                href={`/solution/${rp.slug}`}
                className="block p-5 border rounded-xl hover:border-[#E07B54] transition-colors bg-card group"
              >
                <h4 className="font-semibold group-hover:text-[#E07B54] transition-colors">{rp.title}</h4>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{rp.metaDescription}</p>
                <span className="text-xs text-[#E07B54] mt-3 inline-flex items-center gap-1">
                  En savoir plus <ChevronRight className="w-3 h-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Lead Capture */}
      <LeadCaptureLazy variant="banner" delay={8000} />
    </div>
  );
}
