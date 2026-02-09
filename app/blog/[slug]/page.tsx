/**
 * Page Article - Détail d'un article de blog
 * 
 * Affiche le contenu complet d'un article avec articles liés.
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { marked } from 'marked';
import { CalendarDays, Clock, ChevronLeft, Tag, Share2, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArticleCard } from '@/components/features/blog';
import { ShareButton } from '@/components/features/blog/ShareButton';
import { formatBlogTitle, cn } from '@/lib/utils';
import { sanitizeHtml, sanitizeJsonLd } from '@/lib/security/sanitize';

import { SupabaseBlogArticleRepository } from '@/src/infrastructure/repositories/SupabaseBlogArticleRepository';
import { GetBlogArticleBySlugUseCase } from '@/src/application/use-cases/blog/GetBlogArticleBySlugUseCase';
import { BlogArticleMapper } from '@/src/application/mappers/BlogArticleMapper';

export const dynamic = 'force-dynamic';

// Images de décoration intérieure fiables (URLs directes Unsplash)
const BLOG_IMAGES = [
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1615529328331-f8917597711f?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1615873968403-89e068629265?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1616137466211-f939a420be84?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=1200&h=600&fit=crop',
];

const KEYWORD_IMAGES: Record<string, string> = {
  'salon': 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace',
  'chambre': 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6',
  'cuisine': 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c',
  'salle de bain': 'https://images.unsplash.com/photo-1617806118233-18e1de247200',
  'bureau': 'https://images.unsplash.com/photo-1615529328331-f8917597711f',
  'minimaliste': 'https://images.unsplash.com/photo-1615873968403-89e068629265',
  'scandinave': 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3',
  'home staging': 'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e',
  'rénovation': 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c',
  'murs': 'https://images.unsplash.com/photo-1615873968403-89e068629265',
  'sol': 'https://images.unsplash.com/photo-1600566753376-12c8ab7a06fd',
  'tableaux': 'https://images.unsplash.com/photo-1616137466211-f939a420be84',
  'décoration': 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace',
};

function getBlogImageUrl(tag: string, slug: string, w = 1200, h = 600): string {
  const normalizedTag = tag.toLowerCase();
  
  for (const [keyword, baseUrl] of Object.entries(KEYWORD_IMAGES)) {
    if (normalizedTag.includes(keyword)) {
      return `${baseUrl}?w=${w}&h=${h}&fit=crop`;
    }
  }
  
  const hash = slug.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return BLOG_IMAGES[Math.abs(hash) % BLOG_IMAGES.length];
}

interface ArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Type pour l'article (adapté du DTO)
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
  try {
    const repository = new SupabaseBlogArticleRepository();
    const useCase = new GetBlogArticleBySlugUseCase(repository);

    const result = await useCase.execute({
      slug,
      includeRelated: true,
      relatedLimit: 3
    });

    if (!result.article) {
      console.log(`[getArticle] Article not found for slug: ${slug}`);
      return null;
    }

    // result.article est déjà un DTO, pas besoin de Mapper
    const articleDTO = result.article;
    
    // Convertir les dates en string pour l'interface locale
    const articleData: ArticleData = {
      ...articleDTO,
      publishedAt: articleDTO.publishedAt,
      internalLinks: [],
      // Mapper les articles liés
      relatedArticles: result.relatedArticles?.map(related => {
        // related est déjà un DTO compatible
        return {
          ...related,
          publishedAt: related.publishedAt
        };
      })
    };

    return articleData;
  } catch (error) {
    console.error('Error fetching article:', error);
    if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
    }
    return null;
  }
}

// Génération des métadonnées dynamiques
export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = decodeURIComponent(resolvedParams.slug);
  const article = await getArticle(slug);

  if (!article) {
    return {
      title: 'Article non trouvé | InstaDeco AI',
    };
  }

  const mainTag = article.tags[0] || 'deco';
  const imageUrl = getBlogImageUrl(mainTag, article.slug, 1200, 630);

  return {
    title: `${formatBlogTitle(article.title)} | Blog InstaDeco`,
    description: article.metaDescription,
    keywords: article.tags,
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.metaDescription,
      publishedTime: article.publishedAt,
      tags: article.tags,
      images: [imageUrl],
      url: `https://instadeco.app/blog/${article.slug}`,
      authors: ['InstaDeco AI'],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.metaDescription,
      images: [imageUrl],
    },
    alternates: {
      canonical: `https://instadeco.app/blog/${article.slug}`,
    },
  };
}

// Composant pour le contenu de l'article (rendu HTML sécurisé avec styles enrichis)
function ArticleContent({ content, slug }: { content: string, slug: string }) {
  // Configuration du renderer Markdown
  const renderer = new marked.Renderer();
  
  // Gestion personnalisée des images
  renderer.image = ({ href, title, text }: { href: string; title: string | null; text: string }) => {
    let src = href;
    
    // Remplacement des placeholders IMAGE:keyword
    if (src.startsWith('IMAGE:')) {
      const keyword = src.replace('IMAGE:', '').trim().toLowerCase();
      src = getBlogImageUrl(keyword, slug, 800, 500);
    }
    
    // Vérifier que l'URL est valide (éviter les URLs cassées)
    if (!src || src === '#' || (!src.startsWith('http') && !src.startsWith('/'))) {
      src = getBlogImageUrl('décoration', slug, 800, 500);
    }
    
    // Sécuriser alt text
    const safeAlt = (text || 'Image de décoration intérieure').replace(/"/g, '&quot;');

    return `
      <figure class="my-8 rounded-xl overflow-hidden shadow-lg border border-border bg-muted/20">
        <img 
          src="${src}" 
          alt="${safeAlt}" 
          class="w-full h-auto object-cover min-h-[200px] bg-gradient-to-br from-orange-50 to-amber-50" 
          loading="lazy"
        />
        ${title ? `<figcaption class="text-center text-sm text-muted-foreground mt-2 py-2 italic">${title}</figcaption>` : ''}
      </figure>
    `;
  };

  // Configuration des liens externes (ouverture dans un nouvel onglet)
  renderer.link = ({ href, title, tokens }) => {
    const text = tokens?.map(t => 'text' in t ? t.text : '').join('') || '';
    // Protection XSS: valider l'URL
    const safeHref = href.startsWith('javascript:') || href.startsWith('data:') ? '#' : href;
    const isExternal = safeHref.startsWith('http') && !safeHref.includes('instadeco.app');
    const escapedText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const escapedTitle = (title || '').replace(/"/g, '&quot;');
    return `<a href="${safeHref}" title="${escapedTitle}" ${isExternal ? 'target="_blank" rel="noopener noreferrer"' : ''}>${escapedText}</a>`;
  };

  // Parsing synchrone puis sanitization
  const rawHtml = marked.parse(content, { renderer, async: false });
  const htmlContent = sanitizeHtml(rawHtml as string);

  return (
    <div
      className="prose prose-lg max-w-none
        prose-headings:font-bold prose-headings:text-foreground prose-headings:scroll-mt-20
        prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-6 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border
        prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
        prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-6
        prose-strong:text-foreground prose-strong:font-semibold
        prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline
        prose-ul:list-disc prose-ul:pl-6 prose-ul:my-6
        prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-6
        prose-li:text-muted-foreground prose-li:mb-2 prose-li:leading-relaxed
        prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-6 prose-blockquote:py-4 prose-blockquote:my-8 prose-blockquote:italic prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-lg
        prose-figure:my-8
        prose-figcaption:text-center prose-figcaption:text-sm prose-figcaption:text-muted-foreground prose-figcaption:mt-2
        
        [&_.intro-hook]:text-xl [&_.intro-hook]:font-medium [&_.intro-hook]:text-foreground [&_.intro-hook]:leading-relaxed
        
        [&_.article-toc]:bg-muted/50 [&_.article-toc]:rounded-xl [&_.article-toc]:p-6 [&_.article-toc]:my-8 [&_.article-toc]:border [&_.article-toc]:border-border
        [&_.article-toc_h2]:text-lg [&_.article-toc_h2]:font-semibold [&_.article-toc_h2]:mb-4 [&_.article-toc_h2]:mt-0 [&_.article-toc_h2]:border-0 [&_.article-toc_h2]:pb-0
        [&_.article-toc_ol]:space-y-2 [&_.article-toc_ol]:mb-0
        [&_.article-toc_li]:text-sm
        [&_.article-toc_a]:text-primary [&_.article-toc_a]:hover:underline
        
        [&_.key-takeaway]:bg-amber-50 [&_.key-takeaway]:dark:bg-amber-950/30 [&_.key-takeaway]:border-l-4 [&_.key-takeaway]:border-amber-500 [&_.key-takeaway]:rounded-r-lg [&_.key-takeaway]:p-4 [&_.key-takeaway]:my-8
        [&_.key-takeaway_strong]:text-amber-700 [&_.key-takeaway_strong]:dark:text-amber-400
        [&_.key-takeaway_p]:text-amber-900 [&_.key-takeaway_p]:dark:text-amber-100 [&_.key-takeaway_p]:mb-0 [&_.key-takeaway_p]:mt-2
        
        [&_.pro-tip]:bg-blue-50 [&_.pro-tip]:dark:bg-blue-950/30 [&_.pro-tip]:border-l-4 [&_.pro-tip]:border-blue-500 [&_.pro-tip]:rounded-r-lg [&_.pro-tip]:p-4 [&_.pro-tip]:my-8
        [&_.pro-tip_strong]:text-blue-700 [&_.pro-tip_strong]:dark:text-blue-400
        [&_.pro-tip_p]:text-blue-900 [&_.pro-tip_p]:dark:text-blue-100 [&_.pro-tip_p]:mb-0 [&_.pro-tip_p]:mt-2
        
        [&_.expert-tip]:bg-purple-50 [&_.expert-tip]:dark:bg-purple-950/30 [&_.expert-tip]:border-l-4 [&_.expert-tip]:border-purple-500 [&_.expert-tip]:rounded-r-lg [&_.expert-tip]:p-4 [&_.expert-tip]:my-8 [&_.expert-tip]:italic
        [&_.expert-tip_p]:text-purple-900 [&_.expert-tip_p]:dark:text-purple-100 [&_.expert-tip_p]:mb-0
        
        [&_.cta-contextual]:bg-gradient-to-r [&_.cta-contextual]:from-primary/10 [&_.cta-contextual]:to-primary/5 [&_.cta-contextual]:rounded-xl [&_.cta-contextual]:p-6 [&_.cta-contextual]:my-8 [&_.cta-contextual]:text-center [&_.cta-contextual]:border [&_.cta-contextual]:border-primary/20
        [&_.cta-contextual_p]:text-foreground [&_.cta-contextual_p]:mb-0 [&_.cta-contextual_p]:text-lg
        [&_.cta-contextual_a]:text-primary [&_.cta-contextual_a]:font-semibold [&_.cta-contextual_a]:underline
        
        [&_.cta-final]:bg-gradient-to-r [&_.cta-final]:from-primary [&_.cta-final]:to-primary/80 [&_.cta-final]:rounded-xl [&_.cta-final]:p-8 [&_.cta-final]:my-8 [&_.cta-final]:text-center
        [&_.cta-final_h3]:text-primary-foreground [&_.cta-final_h3]:text-xl [&_.cta-final_h3]:mb-4 [&_.cta-final_h3]:mt-0 [&_.cta-final_h3]:border-0
        [&_.cta-final_p]:text-primary-foreground/90 [&_.cta-final_p]:mb-2
        [&_.cta-final_.cta-button]:inline-block [&_.cta-final_.cta-button]:bg-white [&_.cta-final_.cta-button]:text-primary [&_.cta-final_.cta-button]:font-bold [&_.cta-final_.cta-button]:px-6 [&_.cta-final_.cta-button]:py-3 [&_.cta-final_.cta-button]:rounded-lg [&_.cta-final_.cta-button]:no-underline [&_.cta-final_.cta-button]:hover:bg-white/90 [&_.cta-final_.cta-button]:transition-colors
        [&_.cta-final_em]:text-primary-foreground/70 [&_.cta-final_em]:text-sm
        
        [&_.faq-section]:bg-muted/30 [&_.faq-section]:rounded-xl [&_.faq-section]:p-6 [&_.faq-section]:my-10 [&_.faq-section]:border [&_.faq-section]:border-border
        [&_.faq-section>h2]:text-xl [&_.faq-section>h2]:mb-6 [&_.faq-section>h2]:mt-0 [&_.faq-section>h2]:border-0 [&_.faq-section>h2]:pb-0
        [&_.faq-item]:bg-background [&_.faq-item]:rounded-lg [&_.faq-item]:p-4 [&_.faq-item]:mb-4 [&_.faq-item]:last:mb-0 [&_.faq-item]:border [&_.faq-item]:border-border
        [&_.faq-item_h3]:text-base [&_.faq-item_h3]:font-semibold [&_.faq-item_h3]:text-foreground [&_.faq-item_h3]:mb-2 [&_.faq-item_h3]:mt-0
        [&_.faq-item_p]:text-muted-foreground [&_.faq-item_p]:mb-0 [&_.faq-item_p]:text-sm [&_.faq-item_p]:leading-relaxed
        
        [&_.related-articles]:bg-muted/50 [&_.related-articles]:rounded-xl [&_.related-articles]:p-6 [&_.related-articles]:my-8 [&_.related-articles]:border [&_.related-articles]:border-border
        [&_.related-articles_h3]:text-lg [&_.related-articles_h3]:font-semibold [&_.related-articles_h3]:mb-4 [&_.related-articles_h3]:mt-0
        [&_.related-articles_ul]:space-y-2 [&_.related-articles_ul]:mb-0 [&_.related-articles_ul]:list-none [&_.related-articles_ul]:pl-0
        [&_.related-articles_li]:pl-0 [&_.related-articles_li]:before:content-['→'] [&_.related-articles_li]:before:mr-2 [&_.related-articles_li]:before:text-primary
        [&_.related-articles_a]:text-primary [&_.related-articles_a]:hover:underline
        
        [&_.conclusion]:mt-10 [&_.conclusion]:pt-6 [&_.conclusion]:border-t [&_.conclusion]:border-border
        [&_.conclusion>h2]:text-2xl
        
        [&_.article-image]:rounded-lg [&_.article-image]:overflow-hidden [&_.article-image]:my-6
        [&_.article-image_img]:w-full [&_.article-image_img]:h-auto [&_.article-image_img]:rounded-lg
        prose-img:rounded-xl prose-img:shadow-lg prose-img:w-full prose-img:object-cover"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

// Page principale
export default async function ArticlePage({ params }: ArticlePageProps) {
  const resolvedParams = await params;
  const slug = decodeURIComponent(resolvedParams.slug);
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  const formattedDate = new Date(article.publishedAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const mainTag = article.tags[0] || 'decoration';
  const heroImageUrl = getBlogImageUrl(mainTag, article.slug, 1200, 600);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Header avec Image */}
      <div className="relative h-[400px] md:h-[500px] w-full overflow-hidden">
        <Image 
          src={heroImageUrl} 
          alt={article.title}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-black/50" />
        
        <div className="absolute bottom-0 left-0 w-full z-10">
          <div className="container mx-auto px-4 pb-12">
            <Link
              href="/blog"
              className="inline-flex items-center text-sm font-medium text-white/90 hover:text-white mb-6 bg-black/30 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10 transition-colors hover:bg-black/40"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Retour au blog
            </Link>

            <div className="flex flex-wrap gap-2 mb-6">
              {article.tags.map((tag) => (
                <Badge key={tag} className="bg-primary/90 hover:bg-primary text-white border-none text-sm px-3 py-1 backdrop-blur-sm shadow-sm">
                  {tag}
                </Badge>
              ))}
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight max-w-4xl tracking-tight [text-shadow:_0_2px_12px_rgb(0_0_0_/_40%),_0_1px_3px_rgb(0_0_0_/_60%)]">
              {formatBlogTitle(article.title)}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-sm md:text-base font-medium text-white/90">
               <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white border border-white/20">
                    <User className="w-4 h-4" />
                 </div>
                 <span>InstaDeco Team</span>
               </div>
               <div className="w-px h-4 bg-white/30 hidden sm:block"></div>
               <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <time dateTime={article.publishedAt}>{formattedDate}</time>
              </div>
              <div className="w-px h-4 bg-white/30 hidden sm:block"></div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{article.readingTimeMinutes} min de lecture</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Sidebar Left (Share) - Visible Desktop */}
          <div className="hidden lg:flex lg:col-span-1 flex-col gap-4 mt-20 sticky top-24 h-fit items-center">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest py-4 writing-mode-vertical">Partager</div>
            <ShareButton 
              title={formatBlogTitle(article.title)} 
              url={`https://instadeco.app/blog/${article.slug}`}
              variant="sidebar"
            />
          </div>

          {/* Article principal */}
          <article className="lg:col-span-8 bg-background rounded-t-3xl shadow-xl lg:shadow-none lg:rounded-none p-6 lg:p-0">
            
            {/* Contenu */}
            <div className="py-2">
              <ArticleContent content={article.content} slug={article.slug} />
            </div>

            <Separator className="my-12" />

            {/* CTA Contextuel */}
            <Card className="bg-primary/5 border-primary/20 overflow-hidden relative isolate">
              <div className="absolute -right-16 -top-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10"></div>
              <CardContent className="p-8 sm:p-10 text-center">
                <h2 className="text-2xl font-bold mb-3 font-serif">
                  Cet article vous a inspiré ?
                </h2>
                <p className="text-muted-foreground mb-8 max-w-xl mx-auto text-lg">
                  Passez de la théorie à la pratique. Testez ces idées de décoration sur vos propres photos avec notre IA.
                </p>
                <Link href="/generate">
                   <Button size="lg" className="rounded-full px-8 text-lg h-12 shadow-lg shadow-primary/25 hover:scale-105 transition-transform">
                     Créer ma décoration maintenant
                   </Button>
                </Link>
              </CardContent>
            </Card>
          </article>

          {/* Sidebar Right (Related) */}
          <aside className="lg:col-span-3 space-y-8 mt-8 lg:mt-20">
             {/* Articles liés */}
             {article.relatedArticles && article.relatedArticles.length > 0 && (
               <div className="space-y-6 sticky top-24">
                 <h3 className="font-bold text-xl font-serif border-b pb-2">
                   À lire aussi
                 </h3>
                 <div className="space-y-6">
                   {article.relatedArticles.slice(0, 3).map(related => (
                     <Link key={related.slug} href={`/blog/${related.slug}`} className="group block space-y-3">
                       <div className="relative aspect-[3/2] rounded-xl overflow-hidden shadow-sm">
                         <Image 
                           src={getBlogImageUrl(related.tags[0] || 'design', related.slug, 400, 300)}
                           alt={related.title}
                           fill
                           className="object-cover group-hover:scale-110 transition-transform duration-700"
                         />
                         <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                       </div>
                       <div>
                         <div className="text-xs text-primary font-medium mb-1 uppercase tracking-wide">
                            {related.tags[0]}
                         </div>
                         <h4 className="font-bold leading-snug group-hover:text-primary transition-colors">
                           {formatBlogTitle(related.title)}
                         </h4>
                       </div>
                     </Link>
                   ))}
                 </div>
               </div>
             )}
          </aside>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: sanitizeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: formatBlogTitle(article.title),
            description: article.metaDescription,
            url: `https://instadeco.app/blog/${article.slug}`,
            datePublished: article.publishedAt,
            dateModified: article.publishedAt,
            author: {
              '@type': 'Organization',
              name: 'InstaDeco AI',
              url: 'https://instadeco.app',
            },
            publisher: {
              '@type': 'Organization',
              name: 'InstaDeco AI',
              url: 'https://instadeco.app',
              logo: {
                '@type': 'ImageObject',
                url: 'https://instadeco.app/logo.png',
              },
            },
            image: heroImageUrl,
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `https://instadeco.app/blog/${article.slug}`,
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
