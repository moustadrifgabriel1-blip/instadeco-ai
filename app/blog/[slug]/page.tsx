/**
 * Page Article - Détail d'un article de blog
 * 
 * Affiche le contenu complet d'un article avec articles liés.
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CalendarDays, Clock, ChevronLeft, Tag, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArticleCard } from '@/components/features/blog';

interface ArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Type pour l'article
interface ArticleData {
  id: string;
  title: string;
  slug: string;
  content: string;
  metaDescription: string;
  tags: string[];
  wordCount: number;
  readingTimeMinutes: number;
  publishedAt: string;
  internalLinks: string[];
  relatedArticles?: Array<{
    id: string;
    title: string;
    slug: string;
    metaDescription: string;
    tags: string[];
    wordCount: number;
    readingTimeMinutes: number;
    publishedAt: string;
  }>;
}

// Fonction pour récupérer un article
async function getArticle(slug: string): Promise<ArticleData | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    const response = await fetch(`${baseUrl}/api/blog/${slug}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      console.error('Failed to fetch article:', response.status);
      return null;
    }

    const data = await response.json();
    return data.article;
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
}

// Génération des métadonnées dynamiques
export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return {
      title: 'Article non trouvé | InstaDeco AI',
    };
  }

  return {
    title: `${article.title} | InstaDeco AI`,
    description: article.metaDescription,
    keywords: article.tags,
    authors: [{ name: 'InstaDeco AI' }],
    openGraph: {
      title: article.title,
      description: article.metaDescription,
      type: 'article',
      url: `https://instadeco.app/blog/${article.slug}`,
      publishedTime: article.publishedAt,
      authors: ['InstaDeco AI'],
      tags: article.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.metaDescription,
    },
    alternates: {
      canonical: `https://instadeco.app/blog/${article.slug}`,
    },
  };
}

// Composant pour le contenu de l'article (rendu HTML sécurisé)
function ArticleContent({ content }: { content: string }) {
  return (
    <div
      className="prose prose-lg max-w-none
        prose-headings:font-bold prose-headings:text-foreground
        prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
        prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
        prose-p:text-muted-foreground prose-p:leading-relaxed
        prose-strong:text-foreground
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-ul:list-disc prose-ul:pl-6
        prose-ol:list-decimal prose-ol:pl-6
        prose-li:text-muted-foreground prose-li:mb-2
        prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

// Page principale
export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  const formattedDate = new Date(article.publishedAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Navigation */}
      <nav className="mb-8">
        <Link
          href="/blog"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Retour au blog
        </Link>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Article principal */}
        <article className="lg:col-span-3">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              <div className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                <time dateTime={article.publishedAt}>{formattedDate}</time>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{article.readingTimeMinutes} min de lecture</span>
              </div>
              <div className="flex items-center gap-1">
                <span>{article.wordCount.toLocaleString('fr-FR')} mots</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`}>
                  <Badge variant="secondary" className="hover:bg-primary hover:text-primary-foreground transition-colors">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                </Link>
              ))}
            </div>
          </header>

          <Separator className="my-6" />

          {/* Contenu */}
          <div className="mb-8">
            <ArticleContent content={article.content} />
          </div>

          <Separator className="my-6" />

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <Link href="/blog">
              <Button variant="outline">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Tous les articles
              </Button>
            </Link>

            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Partager
            </Button>
          </div>

          {/* CTA */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold mb-2">
                Prêt à transformer votre intérieur ?
              </h2>
              <p className="text-muted-foreground mb-4">
                Utilisez notre IA pour visualiser votre décoration idéale en quelques clics.
              </p>
              <Link href="/generate">
                <Button size="lg">
                  Essayer InstaDeco AI gratuitement
                </Button>
              </Link>
            </CardContent>
          </Card>
        </article>

        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          {/* Articles liés */}
          {article.relatedArticles && article.relatedArticles.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Articles similaires</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {article.relatedArticles.slice(0, 3).map((related) => (
                  <Link
                    key={related.slug}
                    href={`/blog/${related.slug}`}
                    className="block group"
                  >
                    <h3 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">
                      {related.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {related.metaDescription}
                    </p>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* CTA Sidebar */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                Transformez votre intérieur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Visualisez votre décoration idéale en quelques clics grâce à notre IA.
              </p>
              <Link
                href="/generate"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors w-full"
              >
                Essayer InstaDeco AI
              </Link>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Articles liés (version mobile/grand écran) */}
      {article.relatedArticles && article.relatedArticles.length > 0 && (
        <section className="mt-12 lg:hidden">
          <h2 className="text-2xl font-bold mb-6">Articles similaires</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {article.relatedArticles.slice(0, 4).map((related) => (
              <ArticleCard key={related.id} {...related} />
            ))}
          </div>
        </section>
      )}

      {/* Schema.org - Article */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: article.title,
            description: article.metaDescription,
            url: `https://instadeco.ai/blog/${article.slug}`,
            datePublished: article.publishedAt,
            dateModified: article.publishedAt,
            author: {
              '@type': 'Organization',
              name: 'InstaDeco AI',
              url: 'https://instadeco.ai',
            },
            publisher: {
              '@type': 'Organization',
              name: 'InstaDeco AI',
              url: 'https://instadeco.ai',
              logo: {
                '@type': 'ImageObject',
                url: 'https://instadeco.ai/logo.png',
              },
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `https://instadeco.ai/blog/${article.slug}`,
            },
            keywords: article.tags.join(', '),
            wordCount: article.wordCount,
            articleBody: article.content.replace(/<[^>]*>/g, '').slice(0, 500),
          }),
        }}
      />
    </div>
  );
}
