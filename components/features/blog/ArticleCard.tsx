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

// Liste d'images de décoration intérieure fiables
const BLOG_IMAGES = [
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop', // Salon moderne
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&h=600&fit=crop', // Chambre design
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&h=600&fit=crop', // Cuisine contemporaine
  'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&h=600&fit=crop', // Salle de bain luxe
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop', // Architecture intérieure
  'https://images.unsplash.com/photo-1615529328331-f8917597711f?w=800&h=600&fit=crop', // Bureau moderne
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop', // Décoration scandinave
  'https://images.unsplash.com/photo-1615873968403-89e068629265?w=800&h=600&fit=crop', // Minimalisme
  'https://images.unsplash.com/photo-1616137466211-f939a420be84?w=800&h=600&fit=crop', // Art déco
  'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=800&h=600&fit=crop', // Home staging
];

// Mapping des mots-clés vers des images spécifiques
const KEYWORD_IMAGES: Record<string, string> = {
  'salon': 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop',
  'chambre': 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&h=600&fit=crop',
  'cuisine': 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
  'salle de bain': 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&h=600&fit=crop',
  'bureau': 'https://images.unsplash.com/photo-1615529328331-f8917597711f?w=800&h=600&fit=crop',
  'minimaliste': 'https://images.unsplash.com/photo-1615873968403-89e068629265?w=800&h=600&fit=crop',
  'scandinave': 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop',
  'home staging': 'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=800&h=600&fit=crop',
  'rénovation': 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
  'murs': 'https://images.unsplash.com/photo-1615873968403-89e068629265?w=800&h=600&fit=crop',
  'sol': 'https://images.unsplash.com/photo-1600566753376-12c8ab7a06fd?w=800&h=600&fit=crop',
  'tableaux': 'https://images.unsplash.com/photo-1616137466211-f939a420be84?w=800&h=600&fit=crop',
  'décoration': 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop',
};

// Fonction pour obtenir une image appropriée
function getBlogImageUrl(tag: string, slug: string): string {
  const normalizedTag = tag.toLowerCase();
  
  // Chercher un match dans les mots-clés
  for (const [keyword, imageUrl] of Object.entries(KEYWORD_IMAGES)) {
    if (normalizedTag.includes(keyword)) {
      return imageUrl;
    }
  }
  
  // Si pas de match, utiliser le hash du slug pour sélectionner une image constante
  const hash = slug.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return BLOG_IMAGES[Math.abs(hash) % BLOG_IMAGES.length];
}

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
  // Images de déco intérieur fiables (URLs directes Unsplash)
  const imageUrl = getBlogImageUrl(mainTag, slug);

  return (
    <Card className={`group flex flex-col h-full overflow-hidden hover:shadow-xl transition-all duration-300 ${featured ? 'border-primary/50 bg-primary/5' : ''}`}>
      <Link href={`/blog/${slug}`} className="flex-1 flex flex-col">
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
      <div className="aspect-video w-full bg-muted rounded-t-lg" />
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
