/**
 * Service: InternalLinksService
 * 
 * Ajoute automatiquement des liens internes pertinents dans le contenu.
 * Améliore le maillage interne pour le SEO.
 */

import { IBlogArticleRepository } from '../../domain/ports/repositories/IBlogArticleRepository';

export interface InternalLink {
  keyword: string;
  url: string;
  anchor: string;
}

export interface LinkingResult {
  content: string;
  linksAdded: number;
  links: InternalLink[];
}

export class InternalLinksService {
  // Pages principales du site à lier
  private readonly staticPages: InternalLink[] = [
    {
      keyword: 'décoration par ia',
      url: '/generate',
      anchor: 'notre outil de décoration par IA',
    },
    {
      keyword: 'instadeco',
      url: '/',
      anchor: 'InstaDeco AI',
    },
    {
      keyword: 'transformer votre intérieur',
      url: '/generate',
      anchor: 'transformer votre intérieur avec l\'IA',
    },
    {
      keyword: 'visualiser votre décoration',
      url: '/generate',
      anchor: 'visualiser votre décoration',
    },
    {
      keyword: 'galerie de réalisations',
      url: '/exemples',
      anchor: 'notre galerie de réalisations',
    },
    {
      keyword: 'crédits de génération',
      url: '/pricing',
      anchor: 'nos offres de crédits',
    },
    {
      keyword: 'tarifs',
      url: '/pricing',
      anchor: 'nos tarifs',
    },
  ];

  // Mots-clés liés aux types de sessions
  private readonly sessionTypeKeywords: Record<string, InternalLink[]> = {
    renovation: [
      { keyword: 'rénovation intérieure', url: '/generate?type=renovation', anchor: 'projets de rénovation' },
      { keyword: 'rénover son appartement', url: '/generate?type=renovation', anchor: 'rénover votre appartement' },
      { keyword: 'travaux de rénovation', url: '/generate?type=renovation', anchor: 'visualiser vos travaux' },
    ],
    interior_design: [
      { keyword: 'design d\'intérieur', url: '/generate?type=interior_design', anchor: 'design d\'intérieur' },
      { keyword: 'décoration moderne', url: '/generate?type=interior_design', anchor: 'décoration moderne' },
      { keyword: 'aménagement intérieur', url: '/generate?type=interior_design', anchor: 'aménagement intérieur' },
    ],
    staging: [
      { keyword: 'home staging', url: '/generate?type=staging', anchor: 'home staging virtuel' },
      { keyword: 'mise en valeur', url: '/generate?type=staging', anchor: 'mise en valeur immobilière' },
      { keyword: 'vendre son bien', url: '/generate?type=staging', anchor: 'valoriser votre bien' },
    ],
    garden: [
      { keyword: 'aménagement jardin', url: '/generate?type=garden', anchor: 'aménagement de jardin' },
      { keyword: 'terrasse', url: '/generate?type=garden', anchor: 'aménagement de terrasse' },
      { keyword: 'extérieur', url: '/generate?type=garden', anchor: 'espaces extérieurs' },
    ],
    color_change: [
      { keyword: 'changer les couleurs', url: '/generate?type=color_change', anchor: 'changement de couleurs' },
      { keyword: 'palette de couleurs', url: '/generate?type=color_change', anchor: 'palettes de couleurs' },
      { keyword: 'repeindre', url: '/generate?type=color_change', anchor: 'visualiser avant de peindre' },
    ],
  };

  private repository: IBlogArticleRepository | null = null;

  constructor(repository?: IBlogArticleRepository) {
    this.repository = repository || null;
  }

  /**
   * Ajoute des liens internes au contenu
   */
  async addInternalLinks(
    content: string,
    currentArticleId?: string,
    sessionType?: string,
    maxLinks: number = 5
  ): Promise<LinkingResult> {
    const linksToAdd: InternalLink[] = [];
    let processedContent = content;
    let linksAdded = 0;

    // 1. Récupérer les articles existants pour les lier
    const blogLinks = await this.getBlogArticleLinks(currentArticleId);

    // 2. Collecter tous les liens possibles
    const allPossibleLinks: InternalLink[] = [
      ...this.staticPages,
      ...blogLinks,
    ];

    // Ajouter les liens spécifiques au type de session
    if (sessionType && this.sessionTypeKeywords[sessionType]) {
      allPossibleLinks.push(...this.sessionTypeKeywords[sessionType]);
    }

    // 3. Parcourir le contenu et ajouter les liens
    for (const link of allPossibleLinks) {
      if (linksAdded >= maxLinks) break;

      // Créer une regex pour trouver le mot-clé (insensible à la casse)
      const keywordRegex = new RegExp(
        `(?<![\\[/])\\b(${this.escapeRegex(link.keyword)})\\b(?![\\]\\(])`,
        'gi'
      );

      // Vérifier si le mot-clé existe dans le contenu
      if (keywordRegex.test(processedContent)) {
        // Ne remplacer que la première occurrence
        let replaced = false;
        processedContent = processedContent.replace(keywordRegex, (match) => {
          if (!replaced) {
            replaced = true;
            linksAdded++;
            linksToAdd.push({
              keyword: match,
              url: link.url,
              anchor: link.anchor,
            });
            return `[${link.anchor}](${link.url})`;
          }
          return match;
        });
      }
    }

    // 4. Ajouter le CTA final si pas déjà présent
    if (!processedContent.includes('/generate') && linksAdded < maxLinks) {
      processedContent = this.addCallToAction(processedContent);
      linksAdded++;
    }

    return {
      content: processedContent,
      linksAdded,
      links: linksToAdd,
    };
  }

  /**
   * Récupère les liens vers les articles de blog existants
   */
  private async getBlogArticleLinks(excludeId?: string): Promise<InternalLink[]> {
    if (!this.repository) {
      return [];
    }

    try {
      const { data: articles } = await this.repository.findMany(
        { status: 'published' },
        { limit: 20, sortBy: 'publishedAt', sortOrder: 'desc' }
      );

      return articles
        .filter((article) => article.id !== excludeId)
        .flatMap((article) => {
          // Utiliser les tags comme mots-clés potentiels
          return article.tags.map((tag) => ({
            keyword: tag,
            url: `/blog/${article.slug}`,
            anchor: article.title.length > 50 
              ? article.title.slice(0, 47) + '...'
              : article.title,
          }));
        })
        .slice(0, 10); // Limiter à 10 liens d'articles
    } catch (error) {
      console.warn('Erreur lors de la récupération des articles pour le maillage:', error);
      return [];
    }
  }

  /**
   * Ajoute un appel à l'action à la fin du contenu
   */
  private addCallToAction(content: string): string {
    const ctaOptions = [
      '\n\n---\n\n**Envie de voir à quoi ressemblerait votre intérieur avec ces idées ?** [Essayez InstaDeco AI](/generate) et transformez vos photos en quelques clics !',
      '\n\n---\n\n**Prêt à donner vie à vos projets déco ?** [Testez notre outil de décoration par IA](/generate) – c\'est simple et rapide !',
      '\n\n---\n\n**Visualisez votre futur intérieur dès maintenant !** [Découvrez InstaDeco AI](/generate) et laissez-vous surprendre par les possibilités.',
    ];

    // Choisir un CTA au hasard
    const cta = ctaOptions[Math.floor(Math.random() * ctaOptions.length)];

    // Insérer avant la dernière section (si FAQ) ou à la fin
    const faqIndex = content.lastIndexOf('## FAQ');
    if (faqIndex > 0) {
      return content.slice(0, faqIndex) + cta + '\n\n' + content.slice(faqIndex);
    }

    return content + cta;
  }

  /**
   * Échappe les caractères spéciaux pour la regex
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Analyse le maillage interne d'un article
   */
  analyzeInternalLinking(content: string): {
    internalLinks: number;
    externalLinks: number;
    missingOpportunities: string[];
  } {
    // Compter les liens internes (commencent par / ou contiennent le domaine)
    const internalLinkRegex = /\[([^\]]+)\]\((\/[^)]+|https?:\/\/instadeco\.ai[^)]*)\)/g;
    const externalLinkRegex = /\[([^\]]+)\]\((https?:\/\/(?!instadeco\.ai)[^)]+)\)/g;

    const internalMatches = content.match(internalLinkRegex) || [];
    const externalMatches = content.match(externalLinkRegex) || [];

    // Identifier les opportunités manquées
    const missingOpportunities: string[] = [];
    const contentLower = content.toLowerCase();

    for (const link of this.staticPages) {
      if (contentLower.includes(link.keyword.toLowerCase())) {
        // Vérifier si le mot-clé n'est pas déjà un lien
        const keywordRegex = new RegExp(
          `\\[([^\\]]*${this.escapeRegex(link.keyword)}[^\\]]*)\\]\\([^)]+\\)`,
          'gi'
        );
        if (!keywordRegex.test(content)) {
          missingOpportunities.push(`"${link.keyword}" pourrait pointer vers ${link.url}`);
        }
      }
    }

    return {
      internalLinks: internalMatches.length,
      externalLinks: externalMatches.length,
      missingOpportunities: missingOpportunities.slice(0, 5),
    };
  }

  /**
   * Suggère des articles à lier dans un nouveau contenu
   */
  async suggestRelatedArticles(
    content: string,
    tags: string[],
    limit: number = 3
  ): Promise<Array<{ title: string; slug: string; relevanceScore: number }>> {
    if (!this.repository) {
      return [];
    }

    try {
      // Chercher des articles avec des tags similaires
      const { data: articles } = await this.repository.findMany(
        { status: 'published', tags },
        { limit: 10, sortBy: 'publishedAt', sortOrder: 'desc' }
      );

      // Calculer un score de pertinence basé sur les tags communs
      const scored = articles.map((article) => {
        const commonTags = article.tags.filter((t) => tags.includes(t));
        return {
          title: article.title,
          slug: article.slug,
          relevanceScore: (commonTags.length / tags.length) * 100,
        };
      });

      // Trier par pertinence et limiter
      return scored
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);
    } catch (error) {
      console.warn('Erreur lors de la suggestion d\'articles:', error);
      return [];
    }
  }
}
