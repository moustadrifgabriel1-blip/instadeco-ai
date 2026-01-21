/**
 * Service: GeminiAIContentService
 * 
 * Implémentation du port IAIContentService avec Google Gemini.
 * Génère du contenu SEO optimisé pour le blog.
 */

import {
  IAIContentService,
  GeneratedArticleContent,
  ArticleGenerationOptions,
} from '../../domain/ports/services/IAIContentService';
import { ArticleGenerationError } from '../../domain/errors/ArticleGenerationError';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

export class GeminiAIContentService implements IAIContentService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('GEMINI_API_KEY non configurée - le service ne fonctionnera pas');
    }
  }

  async generateArticle(options: ArticleGenerationOptions): Promise<GeneratedArticleContent> {
    if (!this.apiKey) {
      throw new ArticleGenerationError('Clé API Gemini non configurée', 'GEMINI_API_MISSING');
    }

    const prompt = this.buildPrompt(options);

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: options.temperature ?? 0.7,
            maxOutputTokens: 8192,
            topP: 0.95,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ArticleGenerationError(
          `Erreur API Gemini: ${response.status} - ${errorText}`,
          'GEMINI_API_ERROR'
        );
      }

      const data: GeminiResponse = await response.json();
      const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawContent) {
        throw new ArticleGenerationError(
          'Réponse Gemini vide ou invalide',
          'GEMINI_EMPTY_RESPONSE'
        );
      }

      return this.parseGeneratedContent(rawContent, options);
    } catch (error) {
      if (error instanceof ArticleGenerationError) {
        throw error;
      }
      throw new ArticleGenerationError(
        `Erreur lors de la génération: ${(error as Error).message}`,
        'GEMINI_GENERATION_FAILED'
      );
    }
  }

  async improveContent(content: string, instructions?: string): Promise<string> {
    if (!this.apiKey) {
      throw new ArticleGenerationError('Clé API Gemini non configurée', 'GEMINI_API_MISSING');
    }

    const prompt = `Tu es un expert en rédaction web et SEO.
Améliore le contenu suivant en le rendant plus engageant et mieux structuré.
${instructions ? `Instructions supplémentaires: ${instructions}` : ''}

Contenu à améliorer:
${content}

Retourne UNIQUEMENT le contenu amélioré, sans commentaires.`;

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 8192 },
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: GeminiResponse = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || content;
    } catch {
      return content; // Retourner le contenu original en cas d'erreur
    }
  }

  async generateMetaDescription(content: string): Promise<string> {
    if (!this.apiKey) {
      // Fallback: extraire les 160 premiers caractères
      const plainText = content.replace(/[#*\[\]]/g, '').trim();
      return plainText.slice(0, 157) + '...';
    }

    const prompt = `Génère une meta description SEO (150-160 caractères) pour ce contenu. 
Retourne UNIQUEMENT la meta description, sans guillemets ni commentaires.

Contenu:
${content.slice(0, 2000)}`;

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 256 },
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: GeminiResponse = await response.json();
      const result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return result.trim().slice(0, 160);
    } catch {
      const plainText = content.replace(/[#*\[\]]/g, '').trim();
      return plainText.slice(0, 157) + '...';
    }
  }

  async extractTags(content: string, maxTags: number = 5): Promise<string[]> {
    if (!this.apiKey) {
      // Fallback: extraire les mots fréquents
      const words = content.toLowerCase().match(/\b[a-zàâäéèêëïîôùûüç]{5,}\b/g) || [];
      const wordCounts: Record<string, number> = {};
      words.forEach((word) => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
      return Object.entries(wordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxTags)
        .map(([word]) => word);
    }

    const prompt = `Extrait ${maxTags} tags/mots-clés pertinents pour le SEO de ce contenu.
Retourne UNIQUEMENT les tags séparés par des virgules, en minuscules, sans autres commentaires.

Contenu:
${content.slice(0, 2000)}`;

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 128 },
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: GeminiResponse = await response.json();
      const result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return result
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0)
        .slice(0, maxTags);
    } catch {
      return [];
    }
  }

  private buildPrompt(options: ArticleGenerationOptions): string {
    const minWords = options.minWords ?? 1200;

    return `Tu es un expert en décoration d'intérieur et en rédaction SEO. 
Rédige un article de blog COMPLET et OPTIMISÉ pour le thème: "${options.theme}"

## CONTEXTE
- Site: InstaDeco AI - plateforme de décoration d'intérieur par IA
- Cible: Particuliers francophones (Suisse, France, Belgique)
- Langue: Français
- Type de session associé: ${options.sessionType}
${options.additionalInstructions ? `- Instructions: ${options.additionalInstructions}` : ''}

## CONSIGNES DE RÉDACTION

### Structure obligatoire:
1. **Titre H1** accrocheur avec le mot-clé principal (max 60 caractères)
2. **Introduction** engageante (100-150 mots)
3. **4-6 sections H2** avec sous-titres H3 si nécessaire
4. **Conclusion** avec appel à l'action vers InstaDeco AI
5. **FAQ** avec 3-4 questions/réponses pertinentes

### Style et ton:
- Ton professionnel mais accessible, enthousiaste
- Phrases courtes et dynamiques (max 25 mots par phrase)
- Paragraphes de 3-4 lignes maximum
- Utilisez "vous" pour s'adresser au lecteur

### Optimisation SEO:
- Mot-clé principal dans: titre H1, intro, 2 H2, conclusion
- Densité mot-clé principal: 1-2%
- Utilisez des synonymes et variations naturelles

### Longueur:
- MINIMUM ${minWords} mots

## FORMAT DE SORTIE (JSON)

Réponds UNIQUEMENT avec un objet JSON valide (sans markdown, sans code blocks):

{
  "title": "Le titre H1 de l'article",
  "metaDescription": "Description meta SEO de 150-160 caractères",
  "slug": "le-slug-url-optimise",
  "content": "Le contenu complet en Markdown",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

IMPORTANT: Le contenu doit être en Markdown valide.`;
  }

  private parseGeneratedContent(
    rawContent: string,
    options: ArticleGenerationOptions
  ): GeneratedArticleContent {
    // Nettoyer la réponse des éventuels marqueurs markdown
    let cleanContent = rawContent
      .replace(/^```json\n?/i, '')
      .replace(/^```\n?/i, '')
      .replace(/\n?```$/i, '')
      .trim();

    try {
      const parsed = JSON.parse(cleanContent);

      // Valider les champs requis
      if (!parsed.title || !parsed.content || !parsed.metaDescription) {
        throw new Error('Champs requis manquants dans la réponse');
      }

      // Générer un slug si non fourni
      const slug = parsed.slug || this.generateSlug(parsed.title);

      return {
        title: parsed.title.trim(),
        content: parsed.content.trim(),
        metaDescription: parsed.metaDescription.trim().slice(0, 160),
        slug: slug,
        tags: Array.isArray(parsed.tags)
          ? parsed.tags.map((t: string) => t.trim().toLowerCase())
          : [options.theme.toLowerCase()],
      };
    } catch (parseError) {
      console.error('Erreur parsing JSON Gemini:', parseError);

      // Fallback: extraire les parties essentielles
      const titleMatch = cleanContent.match(/"title"\s*:\s*"([^"]+)"/);
      const contentMatch = cleanContent.match(/"content"\s*:\s*"([\s\S]+?)(?:",\s*"|"\s*})/);
      const metaMatch = cleanContent.match(/"metaDescription"\s*:\s*"([^"]+)"/);

      if (titleMatch && contentMatch) {
        const content = contentMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');

        return {
          title: titleMatch[1],
          content: content,
          metaDescription: metaMatch?.[1] || `Article sur ${options.theme}`,
          slug: this.generateSlug(titleMatch[1]),
          tags: [options.theme.toLowerCase()],
        };
      }

      throw new ArticleGenerationError(
        'Impossible de parser la réponse Gemini',
        'GEMINI_PARSE_ERROR'
      );
    }
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60)
      .replace(/^-|-$/g, '');
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Test. Réponds "OK".' }] }],
          generationConfig: { maxOutputTokens: 10 },
        }),
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}
