import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getLocalizedCanonicalUrl } from '@/lib/seo/config';
import { RoiCalculatorInteractive } from './roi-calculator-interactive';

export const revalidate = 86400;

const PATH = '/outils/calculateur-home-staging';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  // Outil au contenu français (cible agents immo FR/BE/CH). Canonical fr,
  // les variantes en/de ne sont pas indexées (contenu non traduit).
  return {
    title: 'Calculateur ROI home staging virtuel pour agents immobiliers | InstaDeco',
    description:
      "Calculez en 10 secondes ce que le home staging virtuel vous fait économiser par rapport au home staging physique. Outil gratuit pour agents immobiliers, home stagers et promoteurs.",
    keywords: ['calculateur home staging', 'coût home staging', 'roi home staging virtuel', 'home staging prix agent immobilier', 'économie home staging'],
    alternates: {
      canonical: getLocalizedCanonicalUrl('fr', PATH),
    },
    robots: locale === 'fr' ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title: 'Calculateur ROI du home staging virtuel',
      description: 'Comparez le coût du home staging physique à un abonnement illimité. Résultat immédiat, sur vos propres chiffres.',
      type: 'website',
      url: getLocalizedCanonicalUrl('fr', PATH),
    },
  };
}

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: 'Combien coûte un home staging physique ?',
    a: "En France, un home staging physique se situe le plus souvent entre 500 € et 5 000 € par bien, selon la surface, le mobilier loué et la durée. À ce budget s'ajoutent des délais de plusieurs jours à quelques semaines. Le home staging virtuel met en scène la même pièce en photo, en une trentaine de secondes.",
  },
  {
    q: 'Le home staging virtuel est-il rentable pour un agent immobilier ?',
    a: "Oui, dès la première annonce dans la plupart des cas. Un abonnement illimité à 49 €/mois remplace des centaines à des milliers d'euros de mise en scène physique par bien. Le calculateur ci-dessus compare vos propres chiffres : nombre d'annonces et coût d'un staging physique.",
  },
  {
    q: 'Le home staging virtuel est-il autorisé dans une annonce immobilière ?',
    a: "Oui, à condition d'être transparent. La bonne pratique consiste à indiquer que les photos sont des projections décoratives (mention « home staging virtuel ») et à conserver aussi des photos réelles du bien. La mise en scène montre le potentiel de la pièce, elle ne masque pas son état.",
  },
  {
    q: 'Quelle différence avec le home staging physique ?',
    a: "Le home staging physique meuble réellement le bien : c'est efficace mais long et coûteux. Le home staging virtuel meuble la photo par IA : instantané, illimité, à coût fixe. Les deux servent le même but, aider l'acquéreur à se projeter. Le virtuel est idéal pour les annonces en ligne, où la décision de visite se joue sur les photos.",
  },
];

export default async function RoiCalculatorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Calculateur ROI home staging virtuel',
    url: getLocalizedCanonicalUrl('fr', PATH),
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    description: "Outil gratuit qui compare le coût du home staging physique à un abonnement illimité, sur les chiffres de l'utilisateur.",
    inLanguage: 'fr',
  };

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: "Calculer le ROI du home staging virtuel",
    step: [
      { '@type': 'HowToStep', position: 1, name: 'Nombre d’annonces', text: 'Indiquez le nombre d’annonces mises en scène par mois.' },
      { '@type': 'HowToStep', position: 2, name: 'Coût du staging physique', text: 'Renseignez le coût moyen d’un home staging physique par bien.' },
      { '@type': 'HowToStep', position: 3, name: 'Lisez votre économie', text: 'L’outil affiche l’économie mensuelle et annuelle face à un abonnement illimité.' },
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: getLocalizedCanonicalUrl(locale, '/') },
      { '@type': 'ListItem', position: 2, name: 'Calculateur ROI home staging', item: getLocalizedCanonicalUrl('fr', PATH) },
    ],
  };

  return (
    <>
      <section className="bg-background px-4 pt-16 pb-10 sm:px-6 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="prestige-eyebrow text-[11px] text-[var(--gold)]">Outil gratuit · Immobilier</span>
          <h1 className="prestige-display mt-4 text-[32px] font-semibold leading-[1.08] tracking-[-0.025em] text-foreground sm:text-[46px]">
            Combien vous fait gagner le{' '}
            <span className="italic text-[var(--gold)]">home staging virtuel</span> ?
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-muted-foreground sm:text-[18px]">
            Glissez vos chiffres, voyez l&apos;écart avec le home staging physique. Pensé pour les agents
            immobiliers, home stagers et promoteurs.
          </p>
        </div>
      </section>

      <section className="bg-background px-4 pb-16 sm:px-6 sm:pb-20">
        <RoiCalculatorInteractive />
      </section>

      {/* Coquille SEO/GEO crawlable */}
      <section className="border-t border-[var(--gold-line)] bg-background px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="prestige-display text-center text-[24px] font-semibold tracking-[-0.02em] text-foreground sm:text-[30px]">
            Questions fréquentes
          </h2>
          <div className="mt-8 divide-y divide-[var(--gold-line)]">
            {FAQ.map((f) => (
              <div key={f.q} className="py-5">
                <h3 className="text-[16px] font-semibold text-foreground sm:text-[17px]">{f.q}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px]">
            <Link href="/pro" className="text-[var(--gold)] underline-offset-4 hover:underline">Offre Pro immobilier</Link>
            <Link href="/solution/home-staging-virtuel-agents-immobiliers" className="text-[var(--gold)] underline-offset-4 hover:underline">Home staging virtuel pour agents</Link>
            <Link href="/exemples" className="text-[var(--gold)] underline-offset-4 hover:underline">Exemples avant/après</Link>
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </>
  );
}
