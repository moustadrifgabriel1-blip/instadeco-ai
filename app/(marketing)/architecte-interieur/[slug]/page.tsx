import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { CITIES, City, CountryCode } from '@/src/shared/constants/cities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Check, MapPin, Star, ArrowRight, Home, Zap, Palette, 
  Building, Quote, Camera, Wand2, Download
} from 'lucide-react';
import { JsonLd } from '@/lib/seo/json-ld';
import { generateLocalBusinessSchema, generateBreadcrumbList, generateFAQSchema } from '@/lib/seo/schemas';
import { getCanonicalUrl } from '@/lib/seo/config';

const LeadCaptureLazy = dynamic(() => import('@/components/features/lead-capture').then(mod => ({ default: mod.LeadCapture })), { ssr: false });

interface PageProps {
  params: {
    slug: string;
  };
}

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

// Avis clients fictifs localisés pour la preuve sociale
const getTestimonials = (city: City, terms: any) => [
  {
    initial: "C",
    name: "Camille D.",
    role: "Propriétaire",
    location: `${city.name} Centre`,
    text: `J'hésitais à casser une cloison dans mon ${terms.apartment}. En une photo, j'ai vu le potentiel. C'est bluffant de réalisme.`
  },
  {
    initial: "T",
    name: "Thomas L.",
    role: "Investisseur",
    location: `${city.region}`,
    text: `Pour mes annonces de location, c'est indispensable. Mes biens à ${city.name} partent 2x plus vite avec du home staging virtuel.`
  },
  {
    initial: "S",
    name: "Sarah B.",
    role: "Architecte",
    location: `${city.name}`,
    text: `Je l'utilise pour mes planches d'ambiance préliminaires. Ça me fait gagner des heures de modélisation 3D.`
  }
];

// Métadonnées SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = CITIES.find((c) => c.slug === params.slug);
  if (!city) return { title: 'Page non trouvée' };

  const title = `Architecte d'intérieur IA à ${city.name} (${city.zip}) - Rénovation & Déco`;
  const description = `Habitant de ${city.name} ? Redécorez votre intérieur en 10s avec l'IA. Home Staging virtuel et simulation travaux pour ${city.zip}. Essai gratuit.`;

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
      url: getCanonicalUrl(`/architecte-interieur/${city.slug}`),
      images: [getCanonicalUrl('/og-image.png')],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: getCanonicalUrl(`/architecte-interieur/${city.slug}`),
    },
  };
}

export default function CityPage({ params }: PageProps) {
  const city = CITIES.find((c) => c.slug === params.slug);
  if (!city) notFound();

  const terms = getLocalTerms(city);
  const archContent = getArchitectureContent(city);
  const testimonials = getTestimonials(city, terms);

  // FAQ items for schema
  const faqItems = [
    {
      question: `Est-ce vraiment moins cher qu'un architecte à ${city.name} ?`,
      answer: `Oui, incomparablement. Une consultation à domicile à ${city.name} coûte entre 150€ et 300€. Notre IA réalise le même travail de visualisation pour quelques euros, instantanément.`,
    },
    {
      question: `Puis-je l'utiliser pour vendre mon bien immobilier ?`,
      answer: `C'est même recommandé ! Le Home Staging Virtuel permet de déclencher plus de visites en montrant le potentiel de votre bien, surtout si la déco actuelle est datée.`,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <JsonLd data={[
        generateLocalBusinessSchema({
          name: city.name,
          region: city.region,
          zip: city.zip,
          country: city.country,
          currency: terms.currency,
        }),
        generateBreadcrumbList([
          { label: 'Architecte intérieur', path: '/architecte-interieur' },
          { label: city.name, path: `/architecte-interieur/${city.slug}` },
        ]),
        generateFAQSchema(faqItems),
      ]} />

      {/* --- HERO SECTION --- */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-50/50 to-background dark:from-blue-950/20 dark:to-background -z-10" />
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 blur-[120px] rounded-full -z-10" />
        
        <div className="container px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Text Content */}
            <div className="space-y-8 animate-in slide-in-from-left duration-700">
              <Badge variant="outline" className="px-4 py-1.5 border-primary/20 bg-primary/5 text-primary">
                <MapPin className="w-3 h-3 mr-2" />
                Disponible à {city.name} & {city.region}
              </Badge>
              
              <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight text-balance leading-tight">
                Réinventez votre intérieur à <span className="text-primary">{city.name}</span>
              </h1>
              
              <p className="text-xl text-muted-foreground text-balance">
                L&apos;alternative intelligente aux architectes d&apos;intérieur. 
                Obtenez des visuels photoréalistes de votre <strong>{terms.apartment}</strong> ou <strong>{terms.housing}</strong> en quelques secondes.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="xl" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/20 hover:scale-105 transition-transform" asChild>
                  <Link href="/generate">
                    <Wand2 className="mr-2 w-5 h-5" />
                    Décorer ma pièce
                  </Link>
                </Button>
                <Button size="xl" variant="secondary" className="h-14 px-8 text-lg rounded-full border bg-background/50 backdrop-blur" asChild>
                  <Link href="#exemples">
                    Voir des exemples
                  </Link>
                </Button>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-muted overflow-hidden relative">
                       <Image src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}-${city.slug}`} alt="User" fill />
                    </div>
                  ))}
                </div>
                <div>
                  <div className="font-semibold text-foreground">Adopté par 300+ voisins</div>
                  <div>à {city.name} ce mois-ci</div>
                </div>
              </div>
            </div>

            {/* Visual Content */}
            <div className="relative animate-in slide-in-from-right duration-1000 delay-200 lg:h-[600px] hidden lg:block">
              {/* Floating Cards Effect */}
              <div className="absolute top-10 right-10 w-64 h-80 rounded-2xl overflow-hidden shadow-2xl border-4 border-white rotate-6 hover:rotate-0 transition-transform duration-500 z-10">
                <Image 
                  src={`https://source.unsplash.com/600x800/?luxury,interior,${city.archStyle}`} 
                  alt={`Intérieur ${city.name} après`}
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur text-white p-3 rounded-lg text-xs">
                  <div className="font-bold flex items-center gap-2"><Check className="w-3 h-3 text-green-400"/> Après</div>
                  Style Japandi
                </div>
              </div>

              <div className="absolute top-20 right-40 w-64 h-80 rounded-2xl overflow-hidden shadow-xl border-4 border-white -rotate-6 grayscale hover:grayscale-0 transition-all duration-500 z-0 opacity-80">
                <Image 
                  src={`https://source.unsplash.com/600x800/?messy,room,renovation`} 
                  alt={`Intérieur ${city.name} avant`}
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur text-white p-3 rounded-lg text-xs">
                  <div className="font-bold flex items-center gap-2"><Camera className="w-3 h-3"/> Avant</div>
                  Photo originale
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- LOCAL VALUE PROP --- */}
      <section className="py-20 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-background border-none shadow-lg">
              <CardContent className="pt-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                  <Building className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">{archContent.title}</h3>
                <p className="text-muted-foreground">{archContent.description}</p>
              </CardContent>
            </Card>

            <Card className="bg-background border-none shadow-lg">
              <CardContent className="pt-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Instantané & Économique</h3>
                <p className="text-muted-foreground">
                  Oubliez les devis à 4 chiffres. Le design d&apos;intérieur devient accessible à tous les budgets de {city.name}. Résultat en 10 secondes chrono.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background border-none shadow-lg">
              <CardContent className="pt-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                  <Home className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Spécial Immobilier Local</h3>
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
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Inspirations pour votre intérieur à {city.name}</h2>
            <p className="text-muted-foreground">
              Ces styles sont particulièrement populaires dans la région {city.region}. 
              Cliquez pour les appliquer à VOTRE pièce.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Scandinave', 'Industriel', 'Bohème', 'Minimaliste'].map((style, i) => (
              <div key={style} className="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer">
                <Image 
                  src={`https://source.unsplash.com/400x600/?interior,${style},${city.archStyle}`}
                  alt={`Style ${style} idéal pour ${city.name}`}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                <div className="absolute bottom-4 left-4 text-white">
                  <div className="text-xs font-medium uppercase tracking-wider mb-1">Style</div>
                  <div className="text-xl font-bold">{style}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS STEP --- */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl font-bold">Comment ça marche ?</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-xl">1</div>
                  <div>
                    <h4 className="text-xl font-bold">Prenez une photo</h4>
                    <p className="text-primary-foreground/80">De votre pièce actuelle à {city.name}, même en désordre.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-xl">2</div>
                  <div>
                    <h4 className="text-xl font-bold">Choisissez un style</h4>
                    <p className="text-primary-foreground/80">Plus de 20 styles disponibles (Moderne, Vintage, Zen...).</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-xl text-primary">3</div>
                  <div>
                    <h4 className="text-xl font-bold">La magie opère</h4>
                    <p className="text-primary-foreground/80">En 10 secondes, recevez 4 propositions d&apos;aménagement photoréalistes.</p>
                  </div>
                </div>
              </div>
              <Button size="lg" variant="secondary" className="rounded-full px-8" asChild>
                <Link href="/generate">C&apos;est parti <ArrowRight className="ml-2 w-4 h-4"/></Link>
              </Button>
            </div>
            <div className="relative aspect-square rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 p-8 flex items-center justify-center">
               <div className="text-center space-y-4">
                 <Camera className="w-20 h-20 mx-auto opacity-50" />
                 <p className="text-xl font-medium">Zone de démonstration</p>
                 <p className="text-sm opacity-70">L&apos;interface est simple et intuitive.</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS LOCALES --- */}
      <section className="py-24 bg-background">
        <div className="container px-4 md:px-6 space-y-12">
          <h2 className="text-3xl font-bold text-center">Ils ont rénové à {city.name}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <Card key={i} className="bg-muted/50 border-none">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex gap-1 text-yellow-500">
                    {[1,2,3,4,5].map(star => <Star key={star} className="w-4 h-4 fill-current"/>)}
                  </div>
                  <p className="italic text-muted-foreground relative">
                    <Quote className="w-8 h-8 absolute -top-4 -left-2 opacity-10" />
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {t.initial}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role} • {t.location}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* --- FAQ SECTION --- */}
      <section className="py-20 bg-muted/20 border-t">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl font-bold text-center">Questions fréquentes</h2>
          <div className="space-y-4">
            <details className="group border rounded-xl bg-background p-6">
              <summary className="flex cursor-pointer items-center justify-between font-medium">
                Est-ce vraiment moins cher qu&apos;un architecte à {city.name} ?
                <ArrowRight className="h-4 w-4 transition-transform group-open:rotate-90" />
              </summary>
              <div className="pt-4 text-muted-foreground">
                Oui, incomparablement. Une consultation à domicile à {city.name} coûte entre 150€ et 300€. 
                Notre IA réalise le même travail de visualisation pour quelques euros, instantanément.
              </div>
            </details>
            <details className="group border rounded-xl bg-background p-6">
              <summary className="flex cursor-pointer items-center justify-between font-medium">
                Puis-je l&apos;utiliser pour vendre mon bien immobilier ?
                <ArrowRight className="h-4 w-4 transition-transform group-open:rotate-90" />
              </summary>
              <div className="pt-4 text-muted-foreground">
                C&apos;est même recommandé ! Le &quot;Home Staging Virtuel&quot; permet de déclencher plus de visites en montrant le potentiel de votre bien, surtout si la déco actuelle est datée.
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* --- FOOTER SEO LINKS --- */}
      <section className="py-12 border-t text-sm bg-muted/10">
        <div className="container px-4 md:px-6">
          <div className="text-muted-foreground mb-4">Villes à proximité :</div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {CITIES
               .filter(c => c.region === city.region && c.slug !== city.slug)
               .map(c => (
                 <Link key={c.slug} href={`/architecte-interieur/${c.slug}`} className="hover:underline hover:text-primary">
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
