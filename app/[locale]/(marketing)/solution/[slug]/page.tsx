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
import {
  ArrowRight, Clock, Euro, Palette, Camera, Zap, Upload, Download,
  Globe, Brain, Layers, TrendingUp, Maximize, Repeat, Eye,
  Sun, Shield, Share2, Heart, Moon, Sparkles, Check, Star, ChevronRight, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { JsonLd } from '@/lib/seo/json-ld';
import { generateFAQSchema, generateBreadcrumbList, generateWebPageSchema, generateHowToSchema } from '@/lib/seo/schemas';
import { getCanonicalUrl, getLocalizedCanonicalUrl, withLocalePath, programmaticMeta } from '@/lib/seo/config';
import { INTENT_PAGES, getIntentPageBySlug } from '@/lib/seo/intent-pages-data';
import { LeadCaptureLazy } from '@/components/features/lead-capture-lazy';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export function generateStaticParams() {
  return INTENT_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = getIntentPageBySlug(slug);
  if (!page) return { title: 'Page non trouvée' };

  const path = `/solution/${page.slug}`;
  const indexLocale = page.indexLocale ?? 'fr';

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    keywords: page.keywords,
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      type: 'website',
      url: getLocalizedCanonicalUrl(indexLocale, path),
      images: [getCanonicalUrl('/og-image.png')],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description: page.metaDescription,
    },
    ...programmaticMeta(indexLocale, locale, path),
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

/** Libellés de "chrome" du template (hors contenu éditorial, qui vit dans la data). */
const CHROME_LABELS = {
  fr: {
    home: 'Accueil', seePricing: 'Voir les tarifs', result30s: 'Résultat en 30 secondes',
    styles12: '12 styles disponibles', freeTrial: 'Essai gratuit', solution: 'Solution',
    price: 'Prix', delay: 'Délai', quality: 'Qualité', recommended: 'Recommandé',
    howItWorks: 'Comment ça marche ?', tryNow: 'Essayer maintenant',
    ctaTitle: 'Prêt à transformer votre intérieur ?', ctaSub: 'Essai gratuit. Aucune carte bancaire requise.',
    startFree: 'Commencer gratuitement', faq: 'Questions fréquentes',
    guides: 'Nos guides pour aller plus loin', discoverAlso: 'Découvrez aussi', learnMore: 'En savoir plus',
  },
  de: {
    home: 'Startseite', seePricing: 'Preise ansehen', result30s: 'Ergebnis in 30 Sekunden',
    styles12: '12 Stile verfügbar', freeTrial: 'Kostenlos testen', solution: 'Lösung',
    price: 'Preis', delay: 'Dauer', quality: 'Qualität', recommended: 'Empfohlen',
    howItWorks: 'So funktioniert es', tryNow: 'Jetzt ausprobieren',
    ctaTitle: 'Bereit, Ihre Immobilie ins beste Licht zu rücken?', ctaSub: 'Kostenlos testen. Keine Kreditkarte erforderlich.',
    startFree: 'Kostenlos starten', faq: 'Häufige Fragen',
    guides: 'Weiterführende Guides', discoverAlso: 'Ebenfalls entdecken', learnMore: 'Mehr erfahren',
  },
} as const;

export default async function IntentPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const page = getIntentPageBySlug(slug);
  if (!page) notFound();

  // Contenu éditorial en allemand (page CH alémanique) : on localise aussi le chrome.
  const L = CHROME_LABELS[page.indexLocale === 'de' ? 'de' : 'fr'];

  // Maillage interne par proximite de slug : on met en avant les pages du meme cluster
  // (ex home-staging-virtuel-*) plutot que les 3 premieres. A score egal, on departage par
  // distance circulaire pour distribuer les liens et garantir que chaque page (meme la
  // derniere ajoutee) recoive des liens internes, ce qui aide la decouverte par Google.
  // On ne maille qu'entre pages de la MÊME locale d'indexation (une page DE lie vers
  // des pages DE, pas vers du FR) : pas de lien cross-langue dans le cluster.
  const sameLocalePages = INTENT_PAGES.filter((p) => (p.indexLocale ?? 'fr') === (page.indexLocale ?? 'fr'));
  const pageTokens = page.slug.split('-');
  const selfIdx = sameLocalePages.findIndex((p) => p.slug === page.slug);
  const total = sameLocalePages.length;
  const relatedPages = sameLocalePages.map((p, i) => ({
    p,
    i,
    score: p.slug.split('-').filter((t) => pageTokens.includes(t)).length,
  }))
    .filter((x) => x.p.slug !== page.slug)
    .sort((a, b) => b.score - a.score || ((a.i - selfIdx + total) % total) - ((b.i - selfIdx + total) % total))
    .slice(0, 3)
    .map((s) => s.p);

  return (
    <div className="min-h-[100dvh] bg-background">
      <JsonLd data={[
        generateWebPageSchema({
          title: page.title,
          description: page.metaDescription,
          url: getLocalizedCanonicalUrl(locale, `/solution/${page.slug}`),
        }, locale),
        generateBreadcrumbList([
          { label: page.title, path: withLocalePath(locale, `/solution/${page.slug}`) },
        ], {
          home: { name: L.home, url: withLocalePath(locale, '/') },
        }),
        generateFAQSchema(page.faq),
        ...(page.howTo ? [generateHowToSchema()] : []),
      ]} />

      {/* ===== HERO ===== */}
      <section className="pt-20 pb-16 bg-[var(--ink)] text-[var(--ivory)]">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto text-center space-y-6">
          <Badge className="bg-[rgba(200,162,77,0.12)] text-[var(--gold)] border-[var(--gold-line)] px-4 py-1.5 prestige-eyebrow">
            <Sparkles className="w-3 h-3 mr-2" />
            InstaDeco AI
          </Badge>
          <h1 className="prestige-display text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
            {page.hero.headline}
          </h1>
          <p className="prestige-body text-xl text-muted-foreground max-w-2xl mx-auto">
            {page.hero.subheadline}
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button size="lg" className="rounded-full bg-[var(--gold)] text-[#0c0a09] border border-[var(--gold)] hover:bg-transparent hover:text-[var(--gold)] px-8" asChild>
              <Link href={page.hero.ctaLink}>
                {page.hero.cta}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full border-[var(--gold-line)] text-[var(--ivory)] hover:bg-[rgba(200,162,77,0.12)] hover:text-[var(--gold)] px-8" asChild>
              <Link href="/pricing">
                {L.seePricing}
              </Link>
            </Button>
          </div>
          {/* Trust signals */}
          <div className="flex items-center justify-center gap-6 pt-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-[var(--gold)]" />
              {L.result30s}
            </span>
            <span>{L.styles12}</span>
            <span>{L.freeTrial}</span>
          </div>
        </div>
      </section>

      {/* ===== PROBLÈME ===== */}
      <section className="py-16 prestige-reveal">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto">
          <h2 className="prestige-display text-3xl font-bold text-center mb-10">{page.problem.title}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {page.problem.points.map((point, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border">
                <X className="text-destructive w-5 h-5 mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SOLUTION ===== */}
      <section className="py-16 bg-muted/30 prestige-reveal">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-4">
            <h2 className="prestige-display text-3xl font-bold">{page.solution.title}</h2>
            <p className="prestige-body text-lg text-muted-foreground max-w-2xl mx-auto">
              {page.solution.description}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {page.solution.benefits.map((benefit, i) => (
              <Card key={i} className="bg-card border border-border shadow-md">
                <CardContent className="pt-6 text-center space-y-3">
                  <div className="w-12 h-12 bg-[rgba(200,162,77,0.12)] border border-[var(--gold-line)] rounded-xl flex items-center justify-center mx-auto text-[var(--gold)]">
                    {iconMap[benefit.icon] || <Sparkles className="w-6 h-6" />}
                  </div>
                  <h3 className="font-bold text-lg text-foreground">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== COMPARAISON ===== */}
      {page.comparison && (
        <section className="py-16 prestige-reveal">
          <div className="container px-4 md:px-6 max-w-4xl mx-auto space-y-8">
            <h2 className="prestige-display text-3xl font-bold text-center">{page.comparison.title}</h2>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-4 font-semibold text-foreground">{L.solution}</th>
                    <th className="text-center py-4 px-4 font-semibold text-foreground">{L.price}</th>
                    <th className="text-center py-4 px-4 font-semibold text-foreground">{L.delay}</th>
                    <th className="text-center py-4 px-4 font-semibold text-foreground">{L.quality}</th>
                  </tr>
                </thead>
                <tbody>
                  {page.comparison.alternatives.map((alt, i) => (
                    <tr
                      key={i}
                      className={`border-b border-border ${alt.isUs ? 'bg-[rgba(200,162,77,0.08)] font-semibold' : ''}`}
                    >
                      <td className="py-4 px-4 text-foreground">
                        {alt.isUs && <Badge className="bg-[var(--gold)] text-[#0c0a09] mr-2 text-xs">{L.recommended}</Badge>}
                        {alt.name}
                      </td>
                      <td className="text-center py-4 px-4 text-muted-foreground">{alt.price}</td>
                      <td className="text-center py-4 px-4 text-muted-foreground">{alt.time}</td>
                      <td className="text-center py-4 px-4 text-muted-foreground">{alt.quality}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-4">
              {page.comparison.alternatives.map((alt, i) => (
                <Card key={i} className={alt.isUs ? 'bg-card border-[var(--gold)] ring-1 ring-[var(--gold)]' : 'bg-card border border-border'}>
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      {alt.isUs && <Badge className="bg-[var(--gold)] text-[#0c0a09] text-xs">{L.recommended}</Badge>}
                      <h3 className="font-bold text-foreground">{alt.name}</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm text-foreground">
                      <div><span className="text-muted-foreground">{L.price}:</span> {alt.price}</div>
                      <div><span className="text-muted-foreground">{L.delay}:</span> {alt.time}</div>
                      <div><span className="text-muted-foreground">{L.quality}:</span> {alt.quality}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== ÉTAPES ===== */}
      <section className="py-16 bg-muted/20 prestige-reveal">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto space-y-10">
          <h2 className="prestige-display text-3xl font-bold text-center">{L.howItWorks}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {page.steps.map((step) => (
              <div key={step.step} className="text-center space-y-4">
                <div className="w-14 h-14 bg-[var(--gold)] text-[#0c0a09] rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                  {step.step}
                </div>
                <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center pt-4">
            <Button size="lg" className="rounded-full bg-[var(--gold)] text-[#0c0a09] border border-[var(--gold)] hover:bg-transparent hover:text-[var(--gold)] px-8" asChild>
              <Link href="/generate">
                {L.tryNow}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ===== CONTENU DE FOND (long-forme, E-E-A-T) ===== */}
      {page.sections && page.sections.length > 0 && (
        <section className="py-16 prestige-reveal">
          <div className="container px-4 md:px-6 max-w-3xl mx-auto space-y-10">
            {page.sections.map((sec, i) => (
              <div key={i} className="space-y-4">
                <h2 className="prestige-display text-2xl md:text-3xl font-bold text-foreground">{sec.title}</h2>
                {sec.body.map((para, j) => (
                  <p key={j} className="prestige-body text-muted-foreground leading-relaxed">{para}</p>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== CTA MILIEU ===== */}
      <section className="py-16 bg-[var(--stone-900)] border-y border-[var(--gold-line)] text-[var(--ivory)] prestige-reveal">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto text-center space-y-6">
          <h2 className="prestige-display text-3xl font-bold">{L.ctaTitle}</h2>
          <p className="prestige-body text-muted-foreground text-lg">
            {L.ctaSub}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="rounded-full px-8 bg-[var(--gold)] text-[#0c0a09] border border-[var(--gold)] hover:bg-transparent hover:text-[var(--gold)]" asChild>
              <Link href="/generate">
                {L.startFree}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 border-[var(--gold-line)] text-[var(--ivory)] hover:bg-[rgba(200,162,77,0.12)] hover:text-[var(--gold)]" asChild>
              <Link href="/pricing">
                {L.seePricing}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-16 bg-muted/20 prestige-reveal">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto space-y-8">
          <h2 className="prestige-display text-3xl font-bold text-center">{L.faq}</h2>
          <div className="space-y-4">
            {page.faq.map((item, i) => (
              <details key={i} className="group border border-border rounded-xl bg-card p-6">
                <summary className="flex cursor-pointer items-center justify-between font-medium text-foreground">
                  {item.question}
                  <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90 text-[var(--gold)]" />
                </summary>
                <div className="pt-4 text-muted-foreground">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===== GUIDES LIÉS (cluster hub-and-spoke : pillar -> spokes) ===== */}
      {page.relatedArticles && page.relatedArticles.length > 0 && (
        <section className="py-12 border-t border-border prestige-reveal">
          <div className="container px-4 md:px-6 max-w-3xl mx-auto">
            <h2 className="prestige-display text-2xl font-bold mb-6 text-foreground">{L.guides}</h2>
            <ul className="space-y-3">
              {page.relatedArticles.map((a) => (
                <li key={a.slug}>
                  <Link
                    href={`/blog/${a.slug}`}
                    className="flex items-center justify-between gap-4 p-4 border border-border rounded-xl bg-card hover:border-[var(--gold-line)] transition-colors group"
                  >
                    <span className="font-medium text-foreground group-hover:text-[var(--gold)] transition-colors">{a.title}</span>
                    <ChevronRight className="w-4 h-4 shrink-0 text-[var(--gold)]" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ===== PAGES LIÉES (même locale uniquement : cluster FR->FR ou DE->DE) ===== */}
      {relatedPages.length > 0 && (
        <section className="py-12 border-t border-border prestige-reveal">
          <div className="container px-4 md:px-6 max-w-4xl mx-auto">
            <h3 className="prestige-display text-xl font-bold mb-6 text-foreground">{L.discoverAlso}</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {relatedPages.map((rp) => (
                <Link
                  key={rp.slug}
                  href={`/solution/${rp.slug}`}
                  className="block p-5 border border-border rounded-xl hover:border-[var(--gold-line)] transition-colors bg-card group"
                >
                  <h4 className="font-semibold text-foreground group-hover:text-[var(--gold)] transition-colors">{rp.title}</h4>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{rp.metaDescription}</p>
                  <span className="text-xs text-[var(--gold)] mt-3 inline-flex items-center gap-1">
                    {L.learnMore} <ChevronRight className="w-3 h-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Lead Capture */}
      <LeadCaptureLazy variant="banner" delay={8000} />
    </div>
  );
}
