import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getLocalizedCanonicalUrl } from '@/lib/seo/config';
import { BudgetEstimatorInteractive } from './budget-estimator-interactive';

export const revalidate = 86400;

const PATH = '/outils/estimateur-budget-deco';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'Estimateur de budget déco par pièce (gratuit) | InstaDeco',
    description:
      "Estimez en 10 secondes le budget pour redécorer une pièce : salon, chambre, cuisine. Fourchette indicative selon la surface et le niveau. Outil gratuit, puis visualisez le résultat par IA.",
    keywords: ['budget déco', 'combien coûte refaire sa déco', 'budget décoration salon', 'prix relooking pièce', 'estimation budget décoration'],
    alternates: {
      canonical: getLocalizedCanonicalUrl('fr', PATH),
    },
    robots: locale === 'fr' ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title: 'Estimateur de budget déco par pièce',
      description: 'Une fourchette de budget déco en 10 secondes, selon la pièce, la surface et votre ambition.',
      type: 'website',
      url: getLocalizedCanonicalUrl('fr', PATH),
    },
  };
}

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: 'Quel budget prévoir pour redécorer un salon ?',
    a: "Pour un rafraîchissement (peinture, textiles, quelques accessoires), comptez souvent 40 à 90 € par m². Pour un relooking complet avec mobilier et luminaires, plutôt 150 à 350 € par m². Une rénovation déco plus ambitieuse (sols, meubles sur mesure) monte à 400-800 € par m². L'estimateur applique ces fourchettes à votre surface.",
  },
  {
    q: 'Ces montants incluent-ils les travaux ?',
    a: "Non. Ce sont des fourchettes de décoration (mobilier, peinture, textiles, luminaires, accessoires), hors gros œuvre et hors travaux structurels. Elles servent à cadrer un projet déco, pas un chantier de rénovation lourde.",
  },
  {
    q: 'Comment réduire le budget déco d\'une pièce ?',
    a: "Priorisez ce qui change tout en photo : la couleur des murs, l'éclairage, un ou deux meubles forts et des textiles. Avant d'acheter, visualisez plusieurs styles sur une photo de votre pièce grâce au home staging virtuel : vous évitez les erreurs coûteuses et vous investissez à coup sûr.",
  },
  {
    q: 'Puis-je voir ma pièce avant d\'acheter ?',
    a: "Oui. Uploadez une photo de votre pièce, choisissez un style, et l'IA génère un aperçu photoréaliste avant/après en une trentaine de secondes. C'est gratuit à l'essai, sans inscription, et cela aide à décider quel budget mérite quel résultat.",
  },
];

export default async function BudgetEstimatorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

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
      { '@type': 'ListItem', position: 2, name: 'Estimateur de budget déco', item: getLocalizedCanonicalUrl('fr', PATH) },
    ],
  };

  return (
    <>
      <section className="bg-background px-4 pt-16 pb-10 sm:px-6 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="prestige-eyebrow text-[11px] text-[var(--gold)]">Outil gratuit · Décoration</span>
          <h1 className="prestige-display mt-4 text-[32px] font-semibold leading-[1.08] tracking-[-0.025em] text-foreground sm:text-[46px]">
            Quel budget pour{' '}
            <span className="italic text-[var(--gold)]">redécorer votre pièce</span> ?
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-muted-foreground sm:text-[18px]">
            Choisissez la pièce, la surface et le niveau. Vous obtenez une fourchette indicative,
            puis vous pouvez visualiser le résultat sur votre propre photo.
          </p>
        </div>
      </section>

      <section className="bg-background px-4 pb-16 sm:px-6 sm:pb-20">
        <BudgetEstimatorInteractive />
      </section>

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
            <Link href="/quiz" className="text-[var(--gold)] underline-offset-4 hover:underline">Quiz : votre style déco</Link>
            <Link href="/exemples" className="text-[var(--gold)] underline-offset-4 hover:underline">Exemples avant/après</Link>
            <Link href="/generate" className="text-[var(--gold)] underline-offset-4 hover:underline">Transformer ma pièce</Link>
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </>
  );
}
