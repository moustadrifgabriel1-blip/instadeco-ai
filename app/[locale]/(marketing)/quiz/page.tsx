import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getLocalizedCanonicalUrl } from '@/lib/seo/config';
import { QuizInteractive } from './quiz-interactive';

// ISR : la coquille SEO (12 styles + FAQ + schema) est statique, le quiz reste
// interactif côté client. Rendu serveur pour que moteurs et LLM voient le contenu.
export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const path = '/quiz';
  return {
    title: 'Quiz : Quel est votre style de décoration ? | InstaDeco',
    description:
      'Découvrez votre style de décoration idéal en 8 questions visuelles. Quiz gratuit et personnalisé : moderne, scandinave, bohème, japandi et 8 autres styles. Résultat immédiat.',
    keywords: ['quiz déco', 'quel est mon style de décoration', 'test style déco', 'quiz décoration intérieur', 'trouver son style déco', 'styles de décoration'],
    alternates: {
      canonical: getLocalizedCanonicalUrl(locale, path),
      languages: {
        'fr-FR': getLocalizedCanonicalUrl('fr', path),
        en: getLocalizedCanonicalUrl('en', path),
        de: getLocalizedCanonicalUrl('de', path),
        'x-default': getLocalizedCanonicalUrl('fr', path),
      },
    },
    openGraph: {
      title: 'Quiz : Quel est votre style de décoration ?',
      description: 'Répondez à 8 questions visuelles et découvrez le style de décoration qui vous correspond le mieux.',
      type: 'website',
      url: getLocalizedCanonicalUrl(locale, path),
    },
  };
}

// Les 12 styles, contenu crawlable + maillage interne vers /style/[slug].
const STYLES_SEO: Array<{ slug: string; name: string; desc: string }> = [
  { slug: 'moderne', name: 'Moderne', desc: 'Lignes épurées, espaces lumineux et élégance fonctionnelle. La qualité prime sur la quantité.' },
  { slug: 'scandinave', name: 'Scandinave', desc: 'Le hygge en pratique : bois clair, lumière et textiles douillets pour un cocon serein.' },
  { slug: 'japandi', name: 'Japandi', desc: 'La fusion du zen japonais et du confort nordique, avec l\'imperfection apaisante du wabi-sabi.' },
  { slug: 'minimaliste', name: 'Minimaliste', desc: 'Less is more. Chaque objet a une raison d\'être, l\'ordre et la clarté apaisent l\'espace.' },
  { slug: 'boheme', name: 'Bohème', desc: 'Créatif et libre : on mélange cultures, textures et couleurs chaudes pour raconter une histoire.' },
  { slug: 'industriel', name: 'Industriel', desc: 'Le brut assumé : métal, brique et béton pour un intérieur urbain plein de caractère.' },
  { slug: 'mid-century', name: 'Mid-Century Modern', desc: 'Le design iconique des années 50-60 : lignes organiques, pieds compas et couleurs audacieuses.' },
  { slug: 'contemporain', name: 'Contemporain', desc: 'Frais et actuel, à l\'affût des tendances, sans peur de mixer les influences.' },
  { slug: 'art-deco', name: 'Art Déco', desc: 'Le glamour des années folles : matériaux nobles, géométrie audacieuse et opulence maîtrisée.' },
  { slug: 'rustique', name: 'Rustique', desc: 'L\'authenticité de la campagne : bois massif, matières naturelles et chaleur accueillante.' },
  { slug: 'coastal', name: 'Coastal', desc: 'L\'esprit bord de mer toute l\'année : bleus apaisants, blanc lumineux et matières naturelles.' },
  { slug: 'luxe', name: 'Luxe', desc: 'Le raffinement des matériaux nobles : marbre, soie, cristal pour une expérience sensorielle.' },
];

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: 'Comment connaître son style de décoration ?',
    a: 'Le plus simple est de partir de vos réactions visuelles plutôt que de définitions. Notre quiz vous montre 8 questions imagées (salons, palettes, matières, ambiances) et déduit votre style dominant parmi 12 grandes familles, du moderne au bohème. Le résultat est immédiat et gratuit.',
  },
  {
    q: 'Quels sont les grands styles de décoration intérieure ?',
    a: 'Les douze styles les plus répandus sont : moderne, scandinave, japandi, minimaliste, bohème, industriel, mid-century, contemporain, art déco, rustique, coastal et luxe. Chacun a sa palette, ses matériaux et son ambiance. Le quiz identifie celui qui vous correspond, ainsi que les styles compatibles.',
  },
  {
    q: 'Le quiz de style déco est-il vraiment gratuit ?',
    a: 'Oui, le quiz est 100% gratuit et sans inscription obligatoire. Vous répondez à 8 questions visuelles et obtenez votre profil déco complet : style dominant, palette de couleurs, traits caractéristiques, styles compatibles et un conseil de pro.',
  },
  {
    q: 'Combien de temps dure le quiz ?',
    a: 'Environ deux minutes. Il y a 8 questions visuelles et il suffit de choisir l\'image qui vous attire le plus à chaque étape. Aucune connaissance en décoration n\'est nécessaire.',
  },
  {
    q: 'Puis-je voir ma pièce dans le style trouvé ?',
    a: 'Oui. Après le quiz, vous pouvez uploader une photo de votre pièce et notre IA la transforme dans le style identifié en une trentaine de secondes. C\'est un aperçu photoréaliste avant/après, utile pour se projeter ou pour présenter un bien.',
  },
  {
    q: 'Quelle est la différence entre le style scandinave et le japandi ?',
    a: 'Le scandinave mise sur la chaleur du bois clair, les textiles douillets et la lumière (le hygge). Le japandi y ajoute la rigueur et l\'épure du design japonais : palette plus sobre, lignes basses, espaces vides assumés et matériaux naturels comme le bambou ou la céramique.',
  },
];

export default async function QuizPage({ params }: { params: Promise<{ locale: string }> }) {
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
      { '@type': 'ListItem', position: 2, name: 'Quiz style de décoration', item: getLocalizedCanonicalUrl(locale, '/quiz') },
    ],
  };

  const quizSchema = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: 'Quiz : Quel est votre style de décoration ?',
    about: { '@type': 'Thing', name: 'Styles de décoration intérieure' },
    educationalLevel: 'beginner',
    url: getLocalizedCanonicalUrl(locale, '/quiz'),
  };

  return (
    <>
      {/* Quiz interactif (client) */}
      <QuizInteractive />

      {/* Coquille SEO/GEO : contenu crawlable toujours présent dans le DOM, sous le
          quiz. Moteurs et LLM voient les 12 styles, le maillage interne et la FAQ. */}
      <section className="bg-background border-t border-[var(--gold-line)] px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-[920px]">
          <div className="text-center">
            <span className="prestige-eyebrow text-[11px] text-[var(--gold)]">Trouvez votre style</span>
            <h2 className="prestige-display mt-3 text-[26px] font-semibold tracking-[-0.02em] text-foreground sm:text-[34px]">
              Les 12 styles de décoration intérieure
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-[16px]">
              Du moderne au bohème, chaque style a sa palette, ses matières et son ambiance. Faites le quiz
              pour découvrir le vôtre, puis voyez votre pièce transformée dans ce style en une trentaine de
              secondes.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {STYLES_SEO.map((s) => (
              <Link
                key={s.slug}
                href={`/style/${s.slug}`}
                className="group rounded-2xl border border-[var(--gold-line)] bg-card p-5 transition-colors hover:border-[var(--gold)] hover:bg-[rgba(200,162,77,0.06)]"
              >
                <h3 className="prestige-display text-[18px] font-semibold text-foreground transition-colors group-hover:text-[var(--gold)]">
                  {s.name}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{s.desc}</p>
              </Link>
            ))}
          </div>

          {/* FAQ : passages Q -> réponse, citables par les moteurs IA */}
          <div className="mt-16">
            <h2 className="prestige-display text-center text-[24px] font-semibold tracking-[-0.02em] text-foreground sm:text-[30px]">
              Questions fréquentes
            </h2>
            <div className="mx-auto mt-8 max-w-2xl divide-y divide-[var(--gold-line)]">
              {FAQ.map((f) => (
                <div key={f.q} className="py-5">
                  <h3 className="text-[16px] font-semibold text-foreground sm:text-[17px]">{f.q}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{f.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Maillage interne complémentaire */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px]">
            <Link href="/styles" className="text-[var(--gold)] underline-offset-4 hover:underline">Tous les styles de déco</Link>
            <Link href="/exemples" className="text-[var(--gold)] underline-offset-4 hover:underline">Exemples avant/après</Link>
            <Link href="/galerie" className="text-[var(--gold)] underline-offset-4 hover:underline">Galerie de rendus</Link>
            <Link href="/outils/estimateur-budget-deco" className="text-[var(--gold)] underline-offset-4 hover:underline">Estimateur de budget déco</Link>
            <Link href="/outils/calculateur-home-staging" className="text-[var(--gold)] underline-offset-4 hover:underline">Calculateur ROI home staging</Link>
            <Link href="/generate" className="text-[var(--gold)] underline-offset-4 hover:underline">Transformer ma pièce</Link>
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(quizSchema) }} />
    </>
  );
}
