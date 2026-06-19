import type { Metadata } from 'next';
import { ArrowRight, Palette, Home, Lightbulb } from 'lucide-react';
import { VisiteExperience } from '../(prestige)/_components/visite-experience';
import { JsonLd } from '@/lib/seo/json-ld';
import { generateFAQSchema, generateHowToSchema } from '@/lib/seo/schemas';
import { getLocalizedCanonicalUrl } from '@/lib/seo/config';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';

const POPULAR_STYLE_SLUGS = ['moderne', 'scandinave', 'industriel', 'boheme', 'japandi', 'minimaliste'] as const;

const POPULAR_ROOM_SLUGS = ['salon', 'chambre', 'cuisine', 'salle-de-bain', 'bureau', 'entree'] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Home' });

  const languages: Record<string, string> = {
    'fr-FR': getLocalizedCanonicalUrl('fr', '/'),
    en: getLocalizedCanonicalUrl('en', '/'),
    de: getLocalizedCanonicalUrl('de', '/'),
    'x-default': getLocalizedCanonicalUrl('fr', '/'),
  };

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: {
      canonical: getLocalizedCanonicalUrl(locale, '/'),
      languages,
    },
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Home' });
  const faqData = t.raw('faq') as { question: string; answer: string }[];

  return (
    <main className="prestige-app min-h-[100dvh]">
      <JsonLd data={[generateFAQSchema(faqData), generateHowToSchema()]} />

      {/* Expérience cinématique de prestige (ex page /visite), désormais en tête
          de la home. Le contenu SEO (maillage interne, FAQ, blog) suit dessous. */}
      <VisiteExperience />

      <section className="py-16 bg-muted/20 border-t">
        <div className="container px-4 md:px-6">
          <h2 className="prestige-display text-2xl font-bold text-center mb-2">{t('stylesSectionTitle')}</h2>
          <p className="text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
            {t('stylesSectionSubtitle')}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {POPULAR_STYLE_SLUGS.map((slug) => (
              <Link
                key={slug}
                href={`/style/${slug}`}
                className="group p-4 rounded-xl border bg-background hover:border-primary/30 hover:shadow-md transition-all text-center"
              >
                <Palette className="w-6 h-6 mx-auto mb-2 text-primary group-hover:scale-110 transition-transform" />
                <div className="font-semibold text-sm">{t(`styleNames.${slug}`)}</div>
                <div className="text-xs text-muted-foreground mt-1">{t(`styleDesc.${slug}`)}</div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/styles" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
              {t('viewAllStyles')} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 border-t">
        <div className="container px-4 md:px-6">
          <h2 className="prestige-display text-2xl font-bold text-center mb-2">{t('roomsSectionTitle')}</h2>
          <p className="text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
            {t('roomsSectionSubtitle')}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {POPULAR_ROOM_SLUGS.map((slug) => (
              <Link
                key={slug}
                href={`/piece/${slug}`}
                className="group p-4 rounded-xl border bg-background hover:border-primary/30 hover:shadow-md transition-all text-center"
              >
                <Home className="w-6 h-6 mx-auto mb-2 text-primary group-hover:scale-110 transition-transform" />
                <div className="font-semibold text-sm">{t(`roomNames.${slug}`)}</div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/pieces" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
              {t('allRooms')} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/20 border-t">
        <div className="container px-4 md:px-6">
          <h2 className="prestige-display text-2xl font-bold text-center mb-2">{t('solutionsSectionTitle')}</h2>
          <p className="text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
            {t('solutionsSectionSubtitle')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { slug: 'home-staging-virtuel', titleKey: 'solStagingTitle' as const, descKey: 'solStagingDesc' as const },
              {
                slug: 'simulateur-decoration-interieur',
                titleKey: 'solSimTitle' as const,
                descKey: 'solSimDesc' as const,
              },
              { slug: 'avant-apres-decoration', titleKey: 'solAvantTitle' as const, descKey: 'solAvantDesc' as const },
              { slug: 'decoration-salon', titleKey: 'solSalonTitle' as const, descKey: 'solSalonDesc' as const },
            ].map((sol) => (
              <Link
                key={sol.slug}
                href={`/solution/${sol.slug}`}
                className="group p-5 rounded-xl border bg-background hover:border-primary/30 hover:shadow-md transition-all"
              >
                <Lightbulb className="w-5 h-5 text-primary mb-2" />
                <div className="font-semibold text-sm mb-1">{t(sol.titleKey)}</div>
                <div className="text-xs text-muted-foreground">{t(sol.descKey)}</div>
                <div className="text-xs text-primary mt-2 opacity-70 group-hover:opacity-100 group-active:opacity-100 transition-opacity inline-flex items-center gap-1">
                  {t('learnMore')} <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/solutions" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
              {t('allSolutions')} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 border-t">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto">
          <h2 className="prestige-display text-2xl font-bold text-center mb-10">{t('faqSectionTitle')}</h2>
          <div className="space-y-4">
            {faqData.map((item, i) => (
              <details key={i} className="group border rounded-xl bg-background p-5">
                <summary className="flex min-h-[44px] cursor-pointer items-center justify-between font-medium text-sm">
                  {item.question}
                  <ArrowRight className="h-4 w-4 transition-transform group-open:rotate-90 shrink-0 ml-4" />
                </summary>
                <p className="pt-3 text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 border-t bg-muted/10">
        <div className="container px-4 md:px-6 text-center">
          <h2 className="prestige-display text-xl font-bold mb-3">{t('blogSectionTitle')}</h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-xl mx-auto">{t('blogSectionSubtitle')}</p>
          <Link href="/blog" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
            {t('readArticles')} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </section>
    </main>
  );
}
