/**
 * Page Blog - Liste des articles
 * 
 * Affiche les articles du blog avec pagination et filtrage par tag.
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { Newspaper } from 'lucide-react';
import { ArticleCard, ArticleCardSkeleton, BlogSidebar, Pagination } from '@/components/features/blog';
import { SupabaseBlogArticleRepository } from '@/src/infrastructure/repositories/SupabaseBlogArticleRepository';
import { ListBlogArticlesUseCase } from '@/src/application/use-cases/blog/ListBlogArticlesUseCase';
import { BlogArticleMapper } from '@/src/application/mappers/BlogArticleMapper';

// Métadonnées SEO
export const metadata: Metadata = {
  title: 'Blog Décoration Intérieure | Conseils & Tendances | InstaDeco AI',
  description: 'Découvrez nos articles sur la décoration intérieure, les tendances 2026, conseils de home staging et idées d\'aménagement pour votre maison en Suisse, France et Belgique.',
  keywords: [
    'blog décoration intérieure',
    'tendances décoration 2026',
    'conseils aménagement maison',
    'home staging',
    'rénovation intérieur',
    'décoration Suisse',
    'décoration France',
    'décoration Belgique',
  ],
  openGraph: {
    title: 'Blog Décoration Intérieure | InstaDeco AI',
    description: 'Conseils, tendances et inspirations pour transformer votre intérieur.',
    type: 'website',
    url: 'https://instadeco.app/blog',
  },
  alternates: {
    canonical: 'https://instadeco.app/blog',
  },
};

interface BlogPageProps {
  searchParams: Promise<{
    page?: string;
    tag?: string;
    search?: string;
  }>;
}

// Fonction pour récupérer les articles
async function getArticles(page: number, tag?: string, search?: string) {
  try {
    const repository = new SupabaseBlogArticleRepository();
    const useCase = new ListBlogArticlesUseCase(repository);

    const result = await useCase.execute({
      page,
      limit: 9,
      status: 'published',
      tags: tag ? [tag] : undefined,
      search,
    });

    return {
      data: result.articles.map(a => ({
        ...a,
        // Ensure dates are strings for serialization if needed, though DTO usually provides strings/dates.
        // BlogArticleDTO defines publishedAt as Date | string. Next.js server components handle Date objects fine usually,
        // but if we pass to Client Components we might need serialization.
        // ArticleCard expects string
        publishedAt: typeof a.publishedAt === 'string' ? a.publishedAt : new Date(a.publishedAt).toISOString()
      })),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    };
  } catch (error) {
    console.error('Error fetching articles:', error);
    return { data: [], pagination: { page: 1, limit: 9, total: 0, totalPages: 0 } };
  }
}

// Fonction pour récupérer les données du sidebar
async function getSidebarData() {
  try {
    const repository = new SupabaseBlogArticleRepository();
    const useCase = new ListBlogArticlesUseCase(repository);

    // Récupérer les 5 derniers articles pour la sidebar
    const result = await useCase.execute({
      limit: 5,
      status: 'published',
      sortBy: 'publishedAt',
      sortOrder: 'desc'
    });

    const recentArticles = result.articles.map(article => ({
      slug: article.slug,
      title: article.title,
      publishedAt: typeof article.publishedAt === 'string' ? article.publishedAt : new Date(article.publishedAt).toISOString(),
    }));

    // Extraire les tags populaires (comptage sur les articles récents)
    const tagCounts: Record<string, number> = {};
    result.articles.forEach(article => {
      article.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const popularTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag]) => tag);

    return { recentArticles, popularTags };
  } catch (error) {
    console.error('Error fetching sidebar data:', error);
    return { recentArticles: [], popularTags: [] };
  }
}

// Composant de liste d'articles
function ArticleGrid({ articles }: { articles: Array<{
  id: string;
  title: string;
  slug: string;
  metaDescription: string;
  tags: string[];
  wordCount: number;
  readingTimeMinutes: number;
  publishedAt: string;
}> }) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-12">
        <Newspaper className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Aucun article trouvé</h2>
        <p className="text-muted-foreground">
          Revenez bientôt pour découvrir nos prochains articles !
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article, index) => (
        <ArticleCard
          key={article.id}
          {...article}
          featured={index === 0}
        />
      ))}
    </div>
  );
}

// Composant de chargement
function ArticleGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <ArticleCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Page principale
export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  const tag = params.tag;
  const search = params.search;

  // Récupérer les données en parallèle
  const [articlesData, sidebarData] = await Promise.all([
    getArticles(currentPage, tag, search),
    getSidebarData(),
  ]);

  const articles = articlesData.data || [];
  const pagination = articlesData.pagination;
  const { recentArticles, popularTags } = sidebarData;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Blog Décoration Intérieure
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Conseils d&apos;experts, tendances 2026 et inspirations pour transformer 
          votre intérieur en Suisse, France et Belgique.
        </p>
      </header>

      {/* Filtre actif */}
      {tag && (
        <div className="mb-6 flex items-center gap-2">
          <span className="text-muted-foreground">Filtré par :</span>
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            {tag}
            <a
              href="/blog"
              className="ml-2 text-primary/70 hover:text-primary"
              aria-label="Supprimer le filtre"
            >
              ×
            </a>
          </span>
        </div>
      )}

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Articles */}
        <main className="lg:col-span-3">
          <Suspense fallback={<ArticleGridSkeleton />}>
            <ArticleGrid articles={articles} />
          </Suspense>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-8">
              <Suspense fallback={null}>
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  basePath="/blog"
                />
              </Suspense>
            </div>
          )}
        </main>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <BlogSidebar
            popularTags={popularTags}
            recentArticles={recentArticles}
          />
        </div>
      </div>

      {/* Schema.org - Blog */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: 'Blog InstaDeco AI',
            description: 'Conseils et tendances en décoration intérieure',
            url: 'https://instadeco.app/blog',
            publisher: {
              '@type': 'Organization',
              name: 'InstaDeco AI',
              url: 'https://instadeco.app',
            },
            blogPost: articles.slice(0, 10).map((article: {
              title: string;
              slug: string;
              metaDescription: string;
              publishedAt: string;
            }) => ({
              '@type': 'BlogPosting',
              headline: article.title,
              url: `https://instadeco.app/blog/${article.slug}`,
              description: article.metaDescription,
              datePublished: article.publishedAt,
            })),
          }),
        }}
      />
    </div>
  );
}
