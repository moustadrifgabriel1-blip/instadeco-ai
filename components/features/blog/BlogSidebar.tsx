/**
 * Composant: BlogSidebar
 * 
 * Sidebar avec tags populaires et articles récents.
 */

import Link from 'next/link';
import { Tag, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RecentArticle {
  slug: string;
  title: string;
  publishedAt: string;
}

interface BlogSidebarProps {
  popularTags?: string[];
  recentArticles?: RecentArticle[];
}

export function BlogSidebar({ popularTags = [], recentArticles = [] }: BlogSidebarProps) {
  return (
    <aside className="space-y-6">
      {/* Tags populaires */}
      {popularTags.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Tags populaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`}>
                  <Badge
                    variant="secondary"
                    className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Articles récents */}
      {recentArticles.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Articles récents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentArticles.map((article) => {
              const formattedDate = new Date(article.publishedAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
              });

              return (
                <Link
                  key={article.slug}
                  href={`/blog/${article.slug}`}
                  className="block group"
                >
                  <article>
                    <h3 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <time
                      dateTime={article.publishedAt}
                      className="text-xs text-muted-foreground"
                    >
                      {formattedDate}
                    </time>
                  </article>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* CTA InstaDeco */}
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
  );
}
