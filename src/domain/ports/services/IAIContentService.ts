/**
 * Port: IAIContentService
 * 
 * Interface définissant le contrat pour la génération de contenu via IA.
 * Permet de changer de fournisseur IA sans modifier le code métier.
 */

import { ArticleSessionType, ArticleLanguage } from '../../entities/BlogArticle';

export interface GeneratedArticleContent {
  /** Titre généré (SEO optimisé) */
  title: string;
  
  /** Contenu HTML de l'article */
  content: string;
  
  /** Meta description pour SEO */
  metaDescription: string;
  
  /** Slug suggéré */
  slug: string;
  
  /** Tags/mots-clés extraits */
  tags: string[];
}

export interface ArticleGenerationOptions {
  /** Thème de l'article */
  theme: string;

  /**
   * Langue dans laquelle l'article doit être rédigé (fr, en, de).
   * Défaut: 'fr'. Le contenu (titre, corps, meta, FAQ) est généré dans cette langue.
   */
  targetLanguage?: ArticleLanguage;

  /** Type de session (affecte le style) */
  sessionType: ArticleSessionType;
  
  /** Nombre minimum de mots */
  minWords?: number;
  
  /** Température de génération (créativité) */
  temperature?: number;
  
  /** Instructions supplémentaires */
  additionalInstructions?: string;
}

export interface IAIContentService {
  /**
   * Génère un article complet à partir d'un thème
   */
  generateArticle(options: ArticleGenerationOptions): Promise<GeneratedArticleContent>;

  /**
   * Améliore un contenu existant (réécriture)
   */
  improveContent(content: string, instructions?: string): Promise<string>;

  /**
   * Génère une meta description à partir d'un contenu
   */
  generateMetaDescription(content: string): Promise<string>;

  /**
   * Extrait les tags/mots-clés d'un contenu
   */
  extractTags(content: string, maxTags?: number): Promise<string[]>;

  /**
   * Vérifie si le service est disponible
   */
  isAvailable(): Promise<boolean>;
}
