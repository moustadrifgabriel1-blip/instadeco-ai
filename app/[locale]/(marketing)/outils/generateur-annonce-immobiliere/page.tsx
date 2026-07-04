import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getLocalizedCanonicalUrl } from '@/lib/seo/config';
import { AnnonceGeneratorInteractive } from './annonce-generator-interactive';

export const revalidate = 86400;

const PATH = '/outils/generateur-annonce-immobiliere';
const URL = getLocalizedCanonicalUrl('fr', PATH);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Générateur d'annonce immobilière gratuit | InstaDeco",
    description:
      "Rédigez une description d'annonce immobilière percutante en 10 secondes. Outil gratuit pour agents et particuliers : type de bien, atouts, ton, texte copiable prêt à publier.",
    keywords: ["générateur annonce immobilière", "rédiger annonce immobilière", "description bien immobilier", "texte annonce appartement", "modèle annonce immobilière"],
    alternates: { canonical: URL },
    robots: locale === 'fr' ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title: "Générateur d'annonce immobilière gratuit",
      description: "Une description d'annonce prête à publier en 10 secondes, à partir des atouts de votre bien.",
      type: 'website',
      url: URL,
    },
  };
}

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: 'Comment rédiger une bonne annonce immobilière ?',
    a: "Une bonne annonce commence par une accroche qui donne envie, décrit ensuite les faits clés (surface, nombre de pièces, atouts concrets) puis se termine par un appel à la visite. Elle reste honnête et précise, sans exagération. Notre outil assemble ce brouillon à partir des atouts que vous cochez, à personnaliser ensuite.",
  },
  {
    q: "Le générateur d'annonce est-il gratuit ?",
    a: "Oui, l'outil est entièrement gratuit et sans inscription obligatoire. Vous choisissez le type de bien, la surface, les atouts et le ton, puis vous copiez le texte généré. Vous pouvez le réutiliser autant de fois que nécessaire.",
  },
  {
    q: "Faut-il modifier le texte généré ?",
    a: "Oui, il s'agit d'un brouillon à personnaliser. Ajoutez les détails réels et vérifiables du bien (étage, exposition, charges, DPE) et adaptez le ton à votre clientèle. Un texte sur mesure, complété de belles photos, convertit toujours mieux qu'un modèle brut.",
  },
  {
    q: "Comment rendre une annonce plus attractive ?",
    a: "Au-delà du texte, ce sont les photos qui déclenchent la visite. Une pièce vide se projette mal : le home staging virtuel meuble la photo par IA en une trentaine de secondes, pour montrer le potentiel du bien. C'est le complément idéal d'une annonce bien écrite.",
  },
];

export default async function AnnonceGeneratorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: "Générateur d'annonce immobilière",
    url: URL,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    description: "Outil gratuit qui rédige une description d'annonce immobilière à partir du type de bien, de la surface et des atouts.",
    inLanguage: 'fr',
  };

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: "Rédiger une annonce immobilière en 3 étapes",
    step: [
      { '@type': 'HowToStep', position: 1, name: 'Décrivez le bien', text: 'Choisissez le type de bien, la surface et le nombre de pièces.' },
      { '@type': 'HowToStep', position: 2, name: 'Cochez les atouts et le ton', text: 'Sélectionnez les points forts (lumineux, rénové, terrasse) et le ton souhaité.' },
      { '@type': 'HowToStep', position: 3, name: 'Copiez et personnalisez', text: "Copiez le texte généré, ajustez les détails réels et illustrez avec de belles photos." },
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: getLocalizedCanonicalUrl(locale, '/') },
      { '@type': 'ListItem', position: 2, name: 'Outils', item: getLocalizedCanonicalUrl('fr', '/outils') },
      { '@type': 'ListItem', position: 3, name: "Générateur d'annonce immobilière", item: URL },
    ],
  };

  return (
    <>
      <section className="bg-background px-4 pt-16 pb-10 sm:px-6 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="prestige-eyebrow text-[11px] text-[var(--gold)]">Outil gratuit · Immobilier</span>
          <h1 className="prestige-display mt-4 text-[32px] font-semibold leading-[1.08] tracking-[-0.025em] text-foreground sm:text-[46px]">
            Générateur d&apos;<span className="italic text-[var(--gold)]">annonce immobilière</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-muted-foreground sm:text-[18px]">
            Un brouillon d&apos;annonce percutant en 10 secondes, à partir des atouts de votre bien.
            À personnaliser, puis à illustrer avec de belles photos.
          </p>
        </div>
      </section>

      <section className="bg-background px-4 pb-16 sm:px-6 sm:pb-20">
        <AnnonceGeneratorInteractive />
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
            <Link href="/outils" className="text-[var(--gold)] underline-offset-4 hover:underline">Tous les outils gratuits</Link>
            <Link href="/outils/calculateur-home-staging" className="text-[var(--gold)] underline-offset-4 hover:underline">Calculateur ROI home staging</Link>
            <Link href="/pro" className="text-[var(--gold)] underline-offset-4 hover:underline">Offre Pro immobilier</Link>
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
