/**
 * Use Case: GenerateBlogArticleUseCase
 * 
 * Génère automatiquement un article de blog via IA.
 * Gère la déduplication, le post-processing anti-IA et les notifications SEO.
 */

import { IBlogArticleRepository } from '../../../domain/ports/repositories/IBlogArticleRepository';
import { IAIContentService } from '../../../domain/ports/services/IAIContentService';
import { ISEONotificationService } from '../../../domain/ports/services/ISEONotificationService';
import { createBlogArticle, generateSlug, ArticleSessionType } from '../../../domain/entities/BlogArticle';
import { ArticleGenerationError } from '../../../domain/errors/ArticleGenerationError';
import { DuplicateArticleError } from '../../../domain/errors/DuplicateArticleError';
import { BlogArticleDTO, GenerateArticleResponseDTO } from '../../dtos/BlogArticleDTO';
import { BlogArticleMapper } from '../../mappers/BlogArticleMapper';

// Génération d'UUID simple sans dépendance externe
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export interface GenerateBlogArticleInput {
  theme: string;
  sessionType: ArticleSessionType;
}

export interface IAntiAIPostProcessor {
  process(content: string): string;
  getScore(content: string): { score: number; issues: string[] };
}

export interface IInternalLinksService {
  addInternalLinks(content: string, currentArticleId?: string, sessionType?: string): Promise<{ content: string }>;
}

export class GenerateBlogArticleUseCase {
  constructor(
    private readonly articleRepository: IBlogArticleRepository,
    private readonly aiContentService: IAIContentService,
    private readonly seoNotificationService: ISEONotificationService,
    private readonly antiAIProcessor: IAntiAIPostProcessor,
    private readonly internalLinksService: IInternalLinksService,
    private readonly baseUrl: string
  ) {}

  async execute(input: GenerateBlogArticleInput): Promise<GenerateArticleResponseDTO> {
    const { theme, sessionType } = input;

    try {
      // 1. Vérifier que le mot-clé/thème n'a pas été utilisé récemment
      const keywordUsed = await this.articleRepository.keywordUsedRecently(theme, 30);
      if (keywordUsed) {
        return {
          success: false,
          error: `Le thème "${theme}" a déjà été utilisé récemment`,
        };
      }

      // 2. Vérifier que le service IA est disponible
      const aiAvailable = await this.aiContentService.isAvailable();
      if (!aiAvailable) {
        throw ArticleGenerationError.serviceUnavailable(theme);
      }

      // 3. Générer le contenu via IA
      const generatedContent = await this.aiContentService.generateArticle({
        theme,
        sessionType,
        minWords: 2000,
        temperature: 0.85,
      });

      if (!generatedContent.content || generatedContent.content.length < 500) {
        throw ArticleGenerationError.invalidContent(theme);
      }

      // 4. Vérifier que le titre n'est pas trop similaire
      const titleExists = await this.articleRepository.titleExistsSimilar(
        generatedContent.title,
        60
      );
      if (titleExists) {
        throw DuplicateArticleError.titleExists(generatedContent.title);
      }

      // 5. Générer et vérifier le slug
      const slug = generateSlug(generatedContent.title);
      const slugExists = await this.articleRepository.slugExists(slug);
      if (slugExists) {
        throw DuplicateArticleError.slugExists(slug);
      }

      // 6. Post-processing anti-IA
      const cleanedContent = this.antiAIProcessor.process(generatedContent.content);
      const antiAIResult = this.antiAIProcessor.getScore(cleanedContent);

      if (antiAIResult.score < 50) {
        console.warn(`Score anti-IA faible (${antiAIResult.score}/100):`, antiAIResult.issues);
      }

      // 7. Ajouter les liens internes
      // Note: On passe undefined pour l'ID car l'article n'est pas encore créé
      const linkResult = await this.internalLinksService.addInternalLinks(cleanedContent, undefined, sessionType);
      const contentWithLinks = linkResult.content;

      // 8. Créer l'entité article
      const article = createBlogArticle({
        id: generateUUID(),
        title: generatedContent.title,
        slug,
        content: contentWithLinks,
        metaDescription: generatedContent.metaDescription,
        tags: generatedContent.tags,
        status: 'published',
        sessionType,
        source: `${sessionType}-automation`,
        antiAIScore: antiAIResult.score,
      });

      // 9. Sauvegarder en base
      const savedArticle = await this.articleRepository.save(article);

      // 10. Notifier les moteurs de recherche
      const articleUrl = `${this.baseUrl}/blog/${slug}`;
      await this.seoNotificationService.notifyAll(articleUrl);

      // 11. Retourner le résultat
      const dto = BlogArticleMapper.toDTO(savedArticle);
      
      return {
        success: true,
        article: dto,
      };

    } catch (error) {
      console.error(`Erreur génération article pour "${theme}":`, error);
      
      if (error instanceof ArticleGenerationError || error instanceof DuplicateArticleError) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: false,
        error: `Erreur inattendue: ${error instanceof Error ? error.message : 'Inconnue'}`,
      };
    }
  }
}
