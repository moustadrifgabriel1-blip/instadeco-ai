import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CITIES, City, CountryCode } from '@/src/shared/constants/cities';
import { getTitleOverride } from '@/lib/seo/title-overrides';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MapPin, ArrowRight, Home, Zap, Palette, 
  Building, Wand2, Camera
} from 'lucide-react';
import { JsonLd } from '@/lib/seo/json-ld';
import { generateServiceSchema, generateBreadcrumbList, generateFAQSchema } from '@/lib/seo/schemas';
import { getCanonicalUrl, getLocalizedCanonicalUrl, withLocalePath, frOnlyProgrammaticMeta } from '@/lib/seo/config';
import { isCityIndexable, programmaticRobots } from '@/lib/seo/pseo-quality';
import { LeadCaptureLazy } from '@/components/features/lead-capture-lazy';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

// ISR : régénère chaque page une fois par jour pour relire les overrides de title
// produits par la boucle CTR (table seo_title_overrides) sans attendre un redéploiement.
export const revalidate = 86400;

// Génération des routes statiques
export function generateStaticParams() {
  return CITIES.map((city) => ({
    slug: city.slug,
  }));
}

// --- HELPERS DE CONTENU LOCALISÉ ---

const getCountryName = (code: CountryCode) => {
  switch (code) {
    case 'FR': return 'France';
    case 'BE': return 'Belgique';
    case 'CH': return 'Suisse';
  }
};

const getLocalTerms = (city: City) => {
  if (city.country === 'BE') {
    return {
      apartment: 'kot ou appartement',
      price: 'prix architecte Belgique',
      housing: 'maison de rangée',
      currency: '€'
    };
  }
  if (city.country === 'CH') {
    return {
      apartment: 'appartement PPE',
      price: 'tarif architecte Suisse',
      housing: 'attique ou villa',
      currency: 'CHF'
    };
  }
  return {
    apartment: 'appartement',
    price: 'tarif architecte France',
    housing: 'maison ou pavillon',
    currency: '€'
  };
};

// Architecture locale détaillée
const getArchitectureContent = (city: City) => {
  const base = {
    title: `L'ADN architectural de ${city.name}`,
    description: `Chaque rénovation à ${city.name} est unique.`
  };

  switch (city.archStyle) {
    case 'haussmann':
      return {
        title: "Sublimer le charme de l'ancien",
        description: `À ${city.name}, les volumes haussmanniens sont rois. Notre IA sait conserver les moulures, parquets et cheminées tout en modernisant le mobilier et la palette de couleurs.`
      };
    case 'brick':
      return {
        title: "L'esprit industriel et chaleureux",
        description: `La brique typique de la région donne une âme forte aux intérieurs. InstaDeco propose des styles Loft ou Industriel qui s'harmonisent parfaitement avec ces matériaux bruts.`
      };
    case 'timber':
      return {
        title: "Moderniser sans dénaturer",
        description: `Les structures à colombages ou bois apparents demandent de la douceur. Nous suggérons des styles Scandinaves ou Japandi pour illuminer ces intérieurs parfois sombres.`
      };
    case 'mediterranean':
      return {
        title: "La lumière comme matière première",
        description: `Avec l'ensoleillement de ${city.name}, osez les tons terracotta ou, au contraire, le blanc pur du style Coastal pour créer un havre de fraîcheur.`
      };
    case 'stone':
      return {
        title: "L'authenticité de la pierre",
        description: `La pierre apparente est le joyau de l'immobilier à ${city.name}. Notre technologie 'ControlNet' détecte ces textures pour ne jamais les effacer lors de la redécoration.`
      };
    default:
      return {
        title: `Optimiser chaque m² à ${city.name}`,
        description: `Dans un marché immobilier tendu comme celui de ${city.region}, chaque mètre carré compte. Nos rendus vous aident à projeter des agencements malins.`
      };
  }
};


// Métadonnées SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const city = CITIES.find((c) => c.slug === slug);
  if (!city) return { title: 'Page non trouvée' };

  const path = `/architecte-interieur/${city.slug}`;

  // Title aligné sur la requête réellement tapée (« architecte d'intérieur [ville] »)
  // pour que l'internaute reconnaisse sa recherche dans le résultat : c'est le levier
  // CTR n°1 sur ces pages (impressions en page 1 mais 0 clic = title hors requête).
  // La boucle d'auto-optimisation CTR (job VPS ctr_optimizer) peut écraser ces valeurs
  // via la table seo_title_overrides quand GSC montre un meilleur angle de requête.
  const override = await getTitleOverride(path);
  const title = override?.title ?? `Architecte d'intérieur à ${city.name} : visualisez votre déco par IA`;
  const description =
    override?.metaDescription ??
    `Architecte d'intérieur à ${city.name} (${city.region}) : visualisez votre futur intérieur en photo avant les travaux. Choisissez un style, l'IA habille la pièce en quelques secondes. Premier essai gratuit.`;

  // Barrière qualité : sur fr, on n'indexe que les villes qui passent le seuil
  // (traction réelle aujourd'hui, contenu enrichi à terme). Les autres restent
  // en noindex,follow pour ne jamais polluer le domaine avec du thin content.
  const programmatic = frOnlyProgrammaticMeta(locale, path);
  const robots = locale === 'fr'
    ? programmaticRobots(isCityIndexable(city.slug))
    : programmatic.robots;

  return {
    title,
    description,
    keywords: [
      `architecte intérieur ${city.name}`,
      `décoration ${city.name}`,
      `home staging ${city.name}`,
      `rénovation intérieur ${city.name}`,
      `design intérieur ${city.name} ${city.zip}`,
      `aménagement ${city.region}`,
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'fr_FR',
      url: getLocalizedCanonicalUrl(locale, path),
      images: [getCanonicalUrl('/og-image.png')],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    ...programmatic,
    robots,
  };
}

export default async function CityPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const city = CITIES.find((c) => c.slug === slug);
  if (!city) notFound();

  const terms = getLocalTerms(city);
  const archContent = getArchitectureContent(city);

  // FAQ items for schema
  const faqItems = [
    {
      question: `Est-ce vraiment moins cher qu'un architecte à ${city.name} ?`,
      answer: `Oui. Là où une prestation de conseil déco à domicile représente un vrai budget, notre IA vous donne un rendu photoréaliste de votre pièce pour quelques ${terms.currency}, en quelques secondes. Le premier essai est gratuit.`,
    },
    {
      question: `Puis-je l'utiliser pour vendre mon bien immobilier ?`,
      answer: `C'est même recommandé ! Le Home Staging Virtuel permet de déclencher plus de visites en montrant le potentiel de votre bien, surtout si la déco actuelle est datée.`,
    },
  ];

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      <JsonLd data={[
        generateServiceSchema({
          name: city.name,
          slug: city.slug,
          region: city.region,
          zip: city.zip,
          country: city.country,
          currency: terms.currency,
        }),
        generateBreadcrumbList([
          { label: 'Architecte intérieur', path: withLocalePath(locale, '/architecte-interieur') },
          { label: city.name, path: withLocalePath(locale, `/architecte-interieur/${city.slug}`) },
        ], {
          home: { name: 'Accueil', url: withLocalePath(locale, '/') },
        }),
        generateFAQSchema(faqItems),
      ]} />

      {/* --- HERO SECTION --- */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[var(--stone-900)] to-background -z-10" />
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-[var(--gold-soft)] opacity-10 blur-[120px] rounded-full -z-10" />

        <div className="container px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Text Content */}
            <div className="space-y-8 animate-in slide-in-from-left duration-700">
              <Badge variant="outline" className="prestige-eyebrow px-4 py-1.5 border-[var(--gold-line)] bg-[rgba(200,162,77,0.12)] text-[var(--gold)]">
                <MapPin className="w-3 h-3 mr-2" />
                Disponible à {city.name} & {city.region}
              </Badge>

              <h1 className="prestige-display text-4xl lg:text-6xl font-extrabold tracking-tight text-balance leading-tight">
                Réinventez votre intérieur à <span className="text-[var(--gold)]">{city.name}</span>
              </h1>

              <p className="text-xl text-muted-foreground text-balance">
                L&apos;alternative intelligente aux architectes d&apos;intérieur.
                Obtenez des visuels photoréalistes de votre <strong className="text-foreground">{terms.apartment}</strong> ou <strong className="text-foreground">{terms.housing}</strong> en quelques secondes.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="xl" className="h-14 px-8 text-lg rounded-full bg-[var(--gold)] text-[#0c0a09] border border-[var(--gold)] hover:bg-transparent hover:text-[var(--gold)] shadow-xl shadow-[var(--gold-soft)]/20 hover:scale-105 transition-all" asChild>
                  <Link href="/generate">
                    <Wand2 className="mr-2 w-5 h-5" />
                    Décorer ma pièce
                  </Link>
                </Button>
                <Button size="xl" variant="secondary" className="h-14 px-8 text-lg rounded-full border border-[var(--gold-line)] bg-card/50 text-foreground backdrop-blur" asChild>
                  <Link href="#exemples">
                    Voir des exemples
                  </Link>
                </Button>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[var(--gold)]" />
                  <span>Service 100% en ligne</span>
                </div>
                <span>·</span>
                <span>Résultat en 10 secondes</span>
                <span>·</span>
                <span>Essai gratuit</span>
              </div>
            </div>

            {/* Visual Content */}
            {/* Visual placeholder */}
            <div className="relative animate-in slide-in-from-right duration-1000 delay-200 lg:h-[600px] hidden lg:block">
              <div className="absolute inset-0 rounded-3xl bg-card border border-[var(--gold-line)] flex items-center justify-center">
                <div className="text-center space-y-6 p-8">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-[rgba(200,162,77,0.12)] flex items-center justify-center">
                    <Wand2 className="w-10 h-10 text-[var(--gold)]" />
                  </div>
                  <div>
                    <p className="prestige-display text-xl font-bold text-foreground">Avant → Après</p>
                    <p className="text-muted-foreground mt-2">Uploadez votre photo et voyez la transformation en 10 secondes</p>
                  </div>
                  <Button className="rounded-full bg-[var(--gold)] text-[#0c0a09] border border-[var(--gold)] hover:bg-transparent hover:text-[var(--gold)]" asChild>
                    <Link href="/essai">
                      Essayer maintenant
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- LOCAL VALUE PROP --- */}
      <section className="py-20 bg-[var(--stone-900)]">
        <div className="container px-4 md:px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="prestige-reveal bg-card border border-[var(--gold-line)] shadow-lg transition duration-300 ease" style={{ ['--reveal-d' as string]: '120ms' }}>
              <CardContent className="pt-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-[rgba(200,162,77,0.12)] flex items-center justify-center text-[var(--gold)]">
                  <Building className="w-6 h-6" />
                </div>
                <h3 className="prestige-display text-xl font-bold">{archContent.title}</h3>
                <p className="text-muted-foreground">{archContent.description}</p>
              </CardContent>
            </Card>

            <Card className="prestige-reveal bg-card border border-[var(--gold-line)] shadow-lg transition duration-300 ease" style={{ ['--reveal-d' as string]: '240ms' }}>
              <CardContent className="pt-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-[rgba(200,162,77,0.12)] flex items-center justify-center text-[var(--gold)]">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="prestige-display text-xl font-bold">Instantané & Économique</h3>
                <p className="text-muted-foreground">
                  Oubliez les devis à 4 chiffres. Le design d&apos;intérieur devient accessible à tous les budgets de {city.name}. Résultat en 10 secondes chrono.
                </p>
              </CardContent>
            </Card>

            <Card className="prestige-reveal bg-card border border-[var(--gold-line)] shadow-lg transition duration-300 ease" style={{ ['--reveal-d' as string]: '360ms' }}>
              <CardContent className="pt-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-[rgba(200,162,77,0.12)] flex items-center justify-center text-[var(--gold)]">
                  <Home className="w-6 h-6" />
                </div>
                <h3 className="prestige-display text-xl font-bold">Spécial Immobilier Local</h3>
                <p className="text-muted-foreground">
                  Vendeurs à {city.name}, révélez le potentiel de votre bien. Le Home Staging virtuel aide les acheteurs à se projeter immédiatement.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* --- INSPIRATION GALLERY --- */}
      <section id="exemples" className="py-24">
        <div className="container px-4 md:px-6 space-y-12">
          <div className="prestige-reveal text-center max-w-2xl mx-auto space-y-4">
            <div className="prestige-eyebrow">Galerie d&apos;inspirations</div>
            <h2 className="prestige-display text-3xl font-bold tracking-tight">Inspirations pour votre intérieur à {city.name}</h2>
            <div className="prestige-rule mx-auto w-24" />
            <p className="text-muted-foreground">
              Ces styles sont particulièrement populaires dans la région {city.region}.
              Cliquez pour les appliquer à VOTRE pièce.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Scandinave', slug: 'scandinave' },
              { name: 'Industriel', slug: 'industriel' },
              { name: 'Bohème', slug: 'boheme' },
              { name: 'Minimaliste', slug: 'minimaliste' },
            ].map((style, i) => (
              <Link key={style.slug} href={`/style/${style.slug}`} className="prestige-reveal group relative aspect-[3/4] rounded-xl overflow-hidden border border-[var(--gold-line)] hover:border-[var(--gold)] transition duration-300 ease" style={{ ['--reveal-d' as string]: `${i * 120}ms` }}>
                <div className="absolute inset-0 bg-card" />
                <div className="absolute inset-0 prestige-edito-veil" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                  <Palette className="w-8 h-8 text-[var(--gold)] mb-3 group-hover:scale-110 transition-transform duration-300 ease" />
                  <div className="prestige-eyebrow text-xs font-medium uppercase tracking-wider text-[var(--gold)] mb-1">Style</div>
                  <div className="prestige-display text-xl font-bold text-foreground">{style.name}</div>
                  <p className="text-sm text-muted-foreground mt-2">Découvrir ce style →</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS STEP --- */}
      <section className="py-24 bg-[var(--ink)] text-foreground border-y border-[var(--gold-line)]">
        <div className="container px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="prestige-reveal space-y-8">
              <div className="prestige-eyebrow">En trois gestes</div>
              <h2 className="prestige-display text-3xl font-bold">Comment ça <span className="text-[var(--gold)] italic">marche</span> ?</h2>
              <div className="prestige-rule w-24" />
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[rgba(200,162,77,0.12)] border border-[var(--gold-line)] text-[var(--gold)] flex items-center justify-center font-bold text-xl">1</div>
                  <div>
                    <h4 className="prestige-display text-xl font-bold">Prenez une photo</h4>
                    <p className="text-muted-foreground">De votre pièce actuelle à {city.name}, même en désordre.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[rgba(200,162,77,0.12)] border border-[var(--gold-line)] text-[var(--gold)] flex items-center justify-center font-bold text-xl">2</div>
                  <div>
                    <h4 className="prestige-display text-xl font-bold">Choisissez un style</h4>
                    <p className="text-muted-foreground">De nombreux styles au choix (Moderne, Scandinave, Industriel, Japandi...).</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--gold)] flex items-center justify-center font-bold text-xl text-[#0c0a09]">3</div>
                  <div>
                    <h4 className="prestige-display text-xl font-bold">La magie opère</h4>
                    <p className="text-muted-foreground">En 10 secondes, recevez 4 propositions d&apos;aménagement photoréalistes.</p>
                  </div>
                </div>
              </div>
              <Button size="lg" className="rounded-full px-8 bg-[var(--gold)] text-[#0c0a09] border border-[var(--gold)] hover:bg-transparent hover:text-[var(--gold)]" asChild>
                <Link href="/generate">C&apos;est parti <ArrowRight className="ml-2 w-4 h-4"/></Link>
              </Button>
            </div>
            <div className="prestige-reveal relative aspect-square rounded-3xl bg-card backdrop-blur-sm border border-[var(--gold-line)] p-8 flex items-center justify-center transition duration-300 ease" style={{ ['--reveal-d' as string]: '160ms' }}>
               <div className="text-center space-y-4">
                 <Camera className="w-20 h-20 mx-auto text-[var(--gold)] opacity-60" />
                 <p className="prestige-display text-xl font-medium text-foreground">Zone de démonstration</p>
                 <p className="text-sm text-muted-foreground">L&apos;interface est simple et intuitive.</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- CAS D'USAGE --- */}
      <section className="py-24 bg-background">
        <div className="container px-4 md:px-6 space-y-12">
          <div className="prestige-reveal text-center space-y-4">
            <div className="prestige-eyebrow">Pour qui</div>
            <h2 className="prestige-display text-3xl font-bold">Idéal pour vos <span className="text-[var(--gold)] italic">projets</span> à {city.name}</h2>
            <div className="prestige-rule mx-auto w-24" />
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="prestige-reveal bg-card border border-[var(--gold-line)] transition duration-300 ease" style={{ ['--reveal-d' as string]: '120ms' }}>
              <CardContent className="pt-6 space-y-4">
                <div className="w-10 h-10 rounded-full bg-[rgba(200,162,77,0.12)] flex items-center justify-center">
                  <Home className="w-5 h-5 text-[var(--gold)]" />
                </div>
                <h3 className="prestige-display font-bold">Propriétaires</h3>
                <p className="text-sm text-muted-foreground">
                  Visualisez votre {terms.apartment} redécoré avant d&apos;acheter le moindre meuble. Évitez les erreurs coûteuses.
                </p>
              </CardContent>
            </Card>
            <Card className="prestige-reveal bg-card border border-[var(--gold-line)] transition duration-300 ease" style={{ ['--reveal-d' as string]: '240ms' }}>
              <CardContent className="pt-6 space-y-4">
                <div className="w-10 h-10 rounded-full bg-[rgba(200,162,77,0.12)] flex items-center justify-center">
                  <Building className="w-5 h-5 text-[var(--gold)]" />
                </div>
                <h3 className="prestige-display font-bold">Agents immobiliers</h3>
                <p className="text-sm text-muted-foreground">
                  Le Home Staging virtuel aide vos acheteurs à se projeter. Vendez plus vite à {city.name}.
                </p>
                <Link href="/pro" className="inline-flex items-center text-sm font-medium text-[var(--gold)] hover:underline">
                  Offre Pro pour agences <ArrowRight className="ml-1 w-3.5 h-3.5" />
                </Link>
              </CardContent>
            </Card>
            <Card className="prestige-reveal bg-card border border-[var(--gold-line)] transition duration-300 ease" style={{ ['--reveal-d' as string]: '360ms' }}>
              <CardContent className="pt-6 space-y-4">
                <div className="w-10 h-10 rounded-full bg-[rgba(200,162,77,0.12)] flex items-center justify-center">
                  <Palette className="w-5 h-5 text-[var(--gold)]" />
                </div>
                <h3 className="prestige-display font-bold">Décorateurs & Architectes</h3>
                <p className="text-sm text-muted-foreground">
                  Présentez des planches d&apos;ambiance photoréalistes à vos clients en quelques secondes.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* --- FAQ SECTION --- */}
      <section className="py-20 bg-[var(--stone-900)] border-t border-[var(--gold-line)]">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto space-y-8">
          <div className="prestige-reveal text-center space-y-4">
            <div className="prestige-eyebrow">Bon à savoir</div>
            <h2 className="prestige-display text-3xl font-bold">Questions fréquentes</h2>
            <div className="prestige-rule mx-auto w-24" />
          </div>
          <div className="space-y-4">
            <details className="prestige-reveal group border border-[var(--gold-line)] rounded-xl bg-card p-6 transition duration-300 ease" style={{ ['--reveal-d' as string]: '120ms' }}>
              <summary className="flex cursor-pointer items-center justify-between font-medium text-foreground">
                Est-ce vraiment moins cher qu&apos;un architecte à {city.name} ?
                <ArrowRight className="h-4 w-4 text-[var(--gold)] transition-transform group-open:rotate-90" />
              </summary>
              <div className="pt-4 text-muted-foreground">
                Oui. Là où une prestation de conseil déco à domicile représente un vrai budget,
                notre IA vous donne un rendu photoréaliste de votre pièce pour quelques {terms.currency},
                en quelques secondes. Le premier essai est gratuit.
              </div>
            </details>
            <details className="prestige-reveal group border border-[var(--gold-line)] rounded-xl bg-card p-6 transition duration-300 ease" style={{ ['--reveal-d' as string]: '240ms' }}>
              <summary className="flex cursor-pointer items-center justify-between font-medium text-foreground">
                Puis-je l&apos;utiliser pour vendre mon bien immobilier ?
                <ArrowRight className="h-4 w-4 text-[var(--gold)] transition-transform group-open:rotate-90" />
              </summary>
              <div className="pt-4 text-muted-foreground">
                C&apos;est même recommandé ! Le &quot;Home Staging Virtuel&quot; permet de déclencher plus de visites en montrant le potentiel de votre bien, surtout si la déco actuelle est datée.
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* --- FOOTER SEO LINKS --- */}
      <section className="py-12 border-t border-[var(--gold-line)] text-sm bg-background">
        <div className="prestige-reveal container px-4 md:px-6">
          <div className="prestige-eyebrow mb-4">Villes à proximité</div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {CITIES
               .filter(c => c.region === city.region && c.slug !== city.slug)
               .map(c => (
                 <Link key={c.slug} href={`/architecte-interieur/${c.slug}`} className="text-muted-foreground hover:underline hover:text-[var(--gold)]">
                   Décoration {c.name}
                 </Link>
               ))
            }
          </div>
        </div>
      </section>

      {/* Lead Capture */}
      <LeadCaptureLazy variant="banner" delay={6000} />
    </div>
  );
}
