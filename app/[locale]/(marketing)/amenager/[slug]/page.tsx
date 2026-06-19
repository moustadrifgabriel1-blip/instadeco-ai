import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Wand2, Sparkles, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JsonLd } from '@/lib/seo/json-ld';
import { generateBreadcrumbList } from '@/lib/seo/schemas';
import { getLocalizedCanonicalUrl, withLocalePath, frOnlyProgrammaticMeta } from '@/lib/seo/config';
import { getSupabaseAdmin } from '@/lib/supabase/admin-client';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

// ISR : rendu à la demande puis cache 1h (les pages publiées au compte-gouttes
// apparaissent sans rebuild). Les brouillons ne sont jamais servis (notFound).
export const revalidate = 3600;

type PseoPage = {
  slug: string;
  room: string;
  style: string;
  constraint: string;
  h1_title: string;
  meta_description: string | null;
  unique_seo_text: string;
};

async function getPage(slug: string): Promise<PseoPage | null> {
  const { data } = await getSupabaseAdmin()
    .from('pseo_pages')
    .select('slug, room, style, constraint, h1_title, meta_description, unique_seo_text')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  return (data as PseoPage) ?? null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = await getPage(slug);
  if (!page) return { title: 'Page non trouvée', robots: { index: false, follow: false } };

  const path = `/amenager/${page.slug}`;
  const title = `${page.h1_title} | InstaDeco`;
  const description = page.meta_description ?? page.unique_seo_text.slice(0, 155);

  return {
    title,
    description,
    openGraph: { title, description, type: 'article', url: getLocalizedCanonicalUrl(locale, path) },
    ...frOnlyProgrammaticMeta(locale, path),
  };
}

export default async function AmenagerPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();

  const roomLabel = page.room.replace(/-/g, ' ');
  const styleLabel = page.style;

  return (
    <div className="prestige-app flex flex-col min-h-[100dvh] bg-background">
      <JsonLd data={[
        generateBreadcrumbList([
          { label: 'Aménager', path: withLocalePath(locale, '/amenager') },
          { label: page.h1_title, path: withLocalePath(locale, `/amenager/${page.slug}`) },
        ], { home: { name: 'Accueil', url: withLocalePath(locale, '/') } }),
      ]} />

      {/* --- HERO interactif (conversion vers l'outil) --- */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[var(--stone-900)] to-background -z-10" />
        <div className="container px-4 md:px-6 max-w-4xl">
          <div className="prestige-eyebrow mb-4 inline-flex items-center gap-2 text-[var(--gold)]">
            <Sparkles className="w-3.5 h-3.5" /> Décoration par IA
          </div>
          <h1 className="prestige-display text-4xl lg:text-5xl font-extrabold tracking-tight text-balance leading-tight">
            {page.h1_title}
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
            Testez le style {styleLabel} sur votre propre {roomLabel} dès maintenant. Importez une photo,
            recevez un rendu photoréaliste en quelques secondes.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Button size="xl" className="h-14 px-8 text-lg rounded-full bg-[var(--gold)] text-[#0c0a09] border border-[var(--gold)] hover:bg-transparent hover:text-[var(--gold)]" asChild>
              <Link href="/generate">
                <Camera className="mr-2 w-5 h-5" /> Importer ma photo
              </Link>
            </Button>
            <Button size="xl" variant="secondary" className="h-14 px-8 text-lg rounded-full border border-[var(--gold-line)] bg-card/50 text-foreground" asChild>
              <Link href="/essai">Essai gratuit</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* --- CONTENU UNIQUE --- */}
      <section className="py-12">
        <div className="container px-4 md:px-6 max-w-3xl space-y-6">
          <div className="prestige-rule w-24" />
          <p className="text-lg leading-relaxed text-foreground/90">{page.unique_seo_text}</p>
        </div>
      </section>

      {/* --- CTA final --- */}
      <section className="py-16 bg-[var(--stone-900)] border-t border-[var(--gold-line)]">
        <div className="container px-4 md:px-6 max-w-3xl text-center space-y-6">
          <h2 className="prestige-display text-2xl font-bold">Votre {roomLabel} {styleLabel}, en image</h2>
          <p className="text-muted-foreground">
            Ne devinez plus. Visualisez le résultat sur votre vraie pièce avant le moindre achat.
          </p>
          <Button size="lg" className="rounded-full px-8 bg-[var(--gold)] text-[#0c0a09] border border-[var(--gold)] hover:bg-transparent hover:text-[var(--gold)]" asChild>
            <Link href="/generate">Décorer ma pièce <Wand2 className="ml-2 w-4 h-4" /></Link>
          </Button>
          <div className="pt-4">
            <Link href="/generate" className="inline-flex items-center text-sm text-[var(--gold)] hover:underline">
              Voir comment ça marche <ArrowRight className="ml-1 w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
