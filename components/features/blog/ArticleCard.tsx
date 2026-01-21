/**
 * Composant: ArticleCard
 * 
 * Carte d'aperçu pour un article de blog.
 */

import Link from 'next/link';
import { CalendarDays, Clock, Tag } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface ArticleCardProps {
  id: string;
  title: string;
  slug: string;
  metaDescription: string;
  tags: string[];
  wordCount: number;
  readingTimeMinutes: number;
  publishedAt: string;
  featured?: boolean;
}

export function ArticleCard({
  title,
  slug,
  metaDescription,
  tags,
  readingTimeMinutes,
  publishedAt,
  featured = false,
}: ArticleCardProps) {
  const formattedDate = new Date(publishedAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 ${featured ? 'border-primary/50 bg-primary/5' : ''}`}>
      <Link href={`/blog/${slug}`} className="block">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <CalendarDays className="h-4 w-4" />
            <time dateTime={publishedAt}>{formattedDate}</time>
            <span className="text-muted-foreground/50">•</span>
            <Clock className="h-4 w-4" />
            <span>{readingTimeMinutes} min de lecture</span>
          </div>
          <h2 className="text-xl font-semibold group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h2>
        </CardHeader>
        
        <CardContent className="pb-4">
          <p className="text-muted-foreground line-clamp-3">
            {metaDescription}
          </p>
        </CardContent>

        <CardFooter className="pt-0 flex flex-wrap gap-2">
          {tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              <Tag className="h-3 w-3 mr-1" />
              {tag}
            </Badge>
          ))}
          {tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{tags.length - 3}
            </Badge>
          )}
        </CardFooter>
      </Link>
    </Card>
  );
}

/**
 * Version squelette pour le chargement
 */
export function ArticleCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-4 w-20 bg-muted rounded" />
        </div>
        <div className="h-6 w-full bg-muted rounded" />
        <div className="h-6 w-3/4 bg-muted rounded mt-1" />
      </CardHeader>
      <CardContent className="pb-4">
        <div className="space-y-2">
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-2/3 bg-muted rounded" />
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex gap-2">
        <div className="h-5 w-16 bg-muted rounded" />
        <div className="h-5 w-20 bg-muted rounded" />
      </CardFooter>
    </Card>
  );
}
