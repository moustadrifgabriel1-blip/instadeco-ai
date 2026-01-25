/**
 * Composant: ArticleCard
 * 
 * Carte d'aperçu pour un article de blog.
 */

import Link from 'next/link';
import Image from 'next/image';
import { CalendarDays, Clock, Tag } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatBlogTitle } from '@/lib/utils';

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

  const mainTag = tags[0] || 'decoration';
  // Utilisation de source.unsplash.com pour des images thématiques dynamiques
  const imageUrl = `https://source.unsplash.com/800x600/?interior,${encodeURIComponent(mainTag)},renovation`;

  return (
    <Card className={`group flex flex-col h-full overflow-hidden hover:shadow-xl transition-all duration-300 ${featured ? 'border-primary/50 bg-primary/5' : ''}`}>
      <Link href={`/blog/${slug}`} className="block flex-1 flex flex-col">
        {/* Image de couverture */}
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
           <Image
             src={imageUrl}
             alt={title}
             fill
             className="object-cover group-hover:scale-105 transition-transform duration-700"
             sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
             priority={featured}
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
           {tags.length > 0 && (
             <Badge className="absolute top-4 left-4 bg-background/90 text-foreground hover:bg-background/100 backdrop-blur shadow-sm">
               {tags[0]}
             </Badge>
           )}
        </div>

        <CardHeader className="pb-3 pt-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">
            <time dateTime={publishedAt}>{formattedDate}</time>
            <span>•</span>
            <span>{readingTimeMinutes} min</span>
          </div>
          <h2 className="text-xl font-bold font-serif leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {formatBlogTitle(title)}
          </h2>
        </CardHeader>
        
        <CardContent className="pb-4 flex-1">
          <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
            {metaDescription}
          </p>
        </CardContent>
      </Link>
    </Card>
  );
}

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
