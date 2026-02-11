import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Sparkles, Eye, Palette, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShareButtons } from '@/components/features/share-buttons';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getCanonicalUrl } from '@/lib/seo/config';
import { STYLE_SEO_DATA, ROOM_SEO_DATA } from '@/lib/seo/programmatic-data';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getGeneration(id: string) {
  const { data, error } = await supabaseAdmin
    .from('generations')
    .select('id, style_slug, room_type_slug, output_image_url, created_at, status')
    .eq('id', id)
    .eq('status', 'completed')
    .not('output_image_url', 'is', null)
    .single();

  if (error || !data) return null;
  return data;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const generation = await getGeneration(id);

  if (!generation) {
    return { title: 'Génération introuvable — InstaDeco AI' };
  }

  const style = STYLE_SEO_DATA.find(s => s.slug === generation.style_slug);
  const room = ROOM_SEO_DATA.find(r => r.slug === generation.room_type_slug);
  
  const styleName = style?.name || generation.style_slug;
  const roomName = room?.name || generation.room_type_slug;
  
  const title = `${roomName} style ${styleName} — Transformation IA | InstaDeco`;
  const description = `Découvrez cette transformation d'un${roomName === 'Entrée' || roomName === 'Terrasse' ? 'e' : ''} ${roomName.toLowerCase()} en style ${styleName} réalisée par l'IA InstaDeco. Créez le vôtre en 30 secondes.`;

  const ogImageUrl = `${getCanonicalUrl('/api/og')}?id=${id}&style=${encodeURIComponent(styleName)}&room=${encodeURIComponent(roomName)}&img=${encodeURIComponent(generation.output_image_url)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(`/g/${id}`),
      type: 'article',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${roomName} style ${styleName} — InstaDeco AI`,
        },
      ],
      siteName: 'InstaDeco AI',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
    alternates: {
      canonical: getCanonicalUrl(`/g/${id}`),
    },
    robots: {
      index: false,
      follow: true,
      'max-image-preview': 'large',
    },
  };
}

export default async function PublicGenerationPage({ params }: PageProps) {
  const { id } = await params;
  const generation = await getGeneration(id);

  if (!generation) {
    notFound();
  }

  const style = STYLE_SEO_DATA.find(s => s.slug === generation.style_slug);
  const room = ROOM_SEO_DATA.find(r => r.slug === generation.room_type_slug);
  
  const styleName = style?.name || generation.style_slug;
  const roomName = room?.name || generation.room_type_slug;
  const formattedDate = new Date(generation.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const shareUrl = getCanonicalUrl(`/g/${id}`);
  const shareTitle = `${roomName} style ${styleName} — Transformation IA`;

  // Styles recommandés pour ce type de pièce
  const recommendedStyles = STYLE_SEO_DATA
    .filter(s => s.slug !== generation.style_slug)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative">
        <div className="container mx-auto px-4 py-12 md:py-20">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link href="/" className="hover:text-primary transition-colors">Accueil</Link>
            <span>/</span>
            <Link href="/galerie" className="hover:text-primary transition-colors">Galerie</Link>
            <span>/</span>
            <span className="text-foreground">{roomName} {styleName}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Image */}
            <div className="relative aspect-[4/3] rounded-[20px] overflow-hidden shadow-2xl group">
              <Image
                src={generation.output_image_url}
                alt={`${roomName} transformé en style ${styleName} par InstaDeco AI`}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {/* Watermark subtil */}
              <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                InstaDeco AI
              </div>
            </div>

            {/* Infos */}
            <div className="space-y-8">
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    <Palette className="h-3 w-3 mr-1" />
                    {styleName}
                  </Badge>
                  <Badge variant="outline">
                    <Home className="h-3 w-3 mr-1" />
                    {roomName}
                  </Badge>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
                  {roomName} style {styleName}
                </h1>
                <p className="text-muted-foreground text-lg">
                  Transformation réalisée par intelligence artificielle le {formattedDate}
                </p>
              </div>

              {/* Style details */}
              {style && (
                <div className="bg-muted/30 rounded-2xl p-6 space-y-4">
                  <h2 className="font-semibold text-lg">À propos du style {styleName}</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {style.hero}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {style.colors.slice(0, 4).map(color => (
                      <span key={color} className="text-xs bg-background px-3 py-1 rounded-full border">
                        {color}
                      </span>
                    ))}
                  </div>
                  <Link 
                    href={`/style/${style.slug}`}
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    En savoir plus sur le style {styleName}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}

              {/* Share */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Partager cette transformation</p>
                <ShareButtons
                  url={shareUrl}
                  title={shareTitle}
                  variant="inline"
                />
              </div>

              {/* CTA */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-8 text-center space-y-4 border border-primary/10">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full">
                  <Sparkles className="h-4 w-4" />
                  Essayez gratuitement
                </div>
                <h3 className="text-xl font-bold">
                  Envie du même résultat chez vous ?
                </h3>
                <p className="text-muted-foreground">
                  Uploadez une photo de votre pièce et découvrez-la transformée en 30 secondes.
                </p>
                <Link href="/essai">
                  <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/25 hover:scale-105 transition-transform">
                    Transformer ma pièce gratuitement
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Autres styles pour cette pièce */}
      <section className="py-16 border-t bg-muted/20">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-2">
            Autres styles pour votre {roomName.toLowerCase()}
          </h2>
          <p className="text-muted-foreground mb-8">
            Explorez d&apos;autres ambiances pour transformer votre espace
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recommendedStyles.map(s => (
              <Link
                key={s.slug}
                href={`/style/${s.slug}`}
                className="group block p-5 border rounded-2xl hover:border-primary/40 transition-all bg-background hover:shadow-md"
              >
                <p className="font-semibold group-hover:text-primary transition-colors">{s.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.difficulty} • {s.priceRange}</p>
                <div className="flex gap-1 mt-3">
                  {s.colors.slice(0, 3).map(c => (
                    <span key={c} className="text-[10px] bg-muted px-2 py-0.5 rounded-full">{c}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Galerie CTA */}
      <section className="py-12 border-t">
        <div className="container mx-auto px-4 text-center">
          <Link href="/galerie" className="inline-flex items-center gap-2 text-primary hover:underline font-medium">
            <Eye className="h-4 w-4" />
            Voir toutes les transformations dans la galerie
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ImageObject',
            name: `${roomName} style ${styleName} — InstaDeco AI`,
            description: `Transformation d'un${roomName === 'Entrée' || roomName === 'Terrasse' ? 'e' : ''} ${roomName.toLowerCase()} en style ${styleName} par intelligence artificielle`,
            contentUrl: generation.output_image_url,
            url: shareUrl,
            datePublished: generation.created_at,
            creator: {
              '@type': 'Organization',
              name: 'InstaDeco AI',
              url: 'https://instadeco.app',
            },
            keywords: `décoration ${styleName}, ${roomName.toLowerCase()} ${styleName}, transformation IA, home staging virtuel`,
          }),
        }}
      />
    </div>
  );
}
