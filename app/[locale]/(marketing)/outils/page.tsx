import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Building2, PiggyBank, FileText, Palette, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getLocalizedCanonicalUrl } from '@/lib/seo/config';

export const revalidate = 86400;

const PATH = '/outils';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'Outils gratuits pour la déco et l\'immobilier | InstaDeco',
    description:
      "Des outils gratuits pour agents immobiliers et particuliers : calculateur ROI home staging, estimateur de budget déco, générateur d'annonce et quiz de style. Sans inscription.",
    keywords: ['outils déco gratuits', 'outils immobilier gratuits', 'calculateur home staging', 'générateur annonce immobilière', 'estimateur budget déco'],
    alternates: { canonical: getLocalizedCanonicalUrl('fr', PATH) },
    robots: locale === 'fr' ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title: 'Outils gratuits déco & immobilier',
      description: 'Calculez, estimez, rédigez et découvrez votre style. Des outils gratuits et immédiats.',
      type: 'website',
      url: getLocalizedCanonicalUrl('fr', PATH),
    },
  };
}

const TOOLS: Array<{ href: string; title: string; desc: string; Icon: LucideIcon; tag: string }> = [
  {
    href: '/outils/calculateur-home-staging',
    title: 'Calculateur ROI home staging',
    desc: 'Combien le home staging virtuel vous fait économiser par rapport au physique, sur vos propres chiffres.',
    Icon: PiggyBank,
    tag: 'Immobilier',
  },
  {
    href: '/outils/generateur-annonce-immobiliere',
    title: "Générateur d'annonce immobilière",
    desc: 'Un brouillon de description percutant en 10 secondes, à partir des atouts du bien.',
    Icon: FileText,
    tag: 'Immobilier',
  },
  {
    href: '/outils/estimateur-budget-deco',
    title: 'Estimateur de budget déco',
    desc: 'Une fourchette de budget indicative par pièce, selon la surface et votre ambition.',
    Icon: Building2,
    tag: 'Décoration',
  },
  {
    href: '/quiz',
    title: 'Quiz : votre style de décoration',
    desc: 'Découvrez votre style dominant en 8 questions visuelles, avec palette et conseils.',
    Icon: Palette,
    tag: 'Décoration',
  },
];

export default async function OutilsHubPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Outils gratuits InstaDeco',
    itemListElement: TOOLS.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.title,
      url: getLocalizedCanonicalUrl('fr', t.href),
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: getLocalizedCanonicalUrl(locale, '/') },
      { '@type': 'ListItem', position: 2, name: 'Outils gratuits', item: getLocalizedCanonicalUrl('fr', PATH) },
    ],
  };

  return (
    <>
      <section className="bg-background px-4 pt-16 pb-10 sm:px-6 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="prestige-eyebrow text-[11px] text-[var(--gold)]">Gratuit · Sans inscription</span>
          <h1 className="prestige-display mt-4 text-[32px] font-semibold leading-[1.08] tracking-[-0.025em] text-foreground sm:text-[48px]">
            Nos outils <span className="italic text-[var(--gold)]">gratuits</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-muted-foreground sm:text-[18px]">
            Calculez, estimez, rédigez, découvrez votre style. Des outils pensés pour les agents immobiliers,
            home stagers et particuliers, utiles en quelques secondes.
          </p>
        </div>
      </section>

      <section className="bg-background px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
          {TOOLS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="group flex flex-col rounded-[20px] border border-[var(--gold-line)] bg-[var(--stone-900)] p-6 transition-colors hover:border-[var(--gold)] hover:bg-[rgba(200,162,77,0.05)]"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--gold-line)] bg-[rgba(200,162,77,0.1)]">
                  <t.Icon className="h-5 w-5 text-[var(--gold)]" aria-hidden="true" />
                </span>
                <span className="prestige-eyebrow !text-[10px] text-[var(--mist)]">{t.tag}</span>
              </div>
              <h2 className="prestige-display mt-5 text-[20px] font-semibold text-[var(--ivory)] transition-colors group-hover:text-[var(--gold)]">
                {t.title}
              </h2>
              <p className="mt-2 flex-1 text-[14px] leading-relaxed text-[var(--mist)]">{t.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--gold)]">
                Ouvrir l&apos;outil
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-4xl text-center">
          <Link
            href="/pro"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--gold)] px-8 py-4 text-[16px] font-semibold text-[#0c0a09] transition-colors hover:bg-[#d4b15f]"
          >
            Découvrir l&apos;offre Pro immobilier
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </>
  );
}
