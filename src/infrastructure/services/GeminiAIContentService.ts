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
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    console.log('[GeminiAIContentService] API Key présente:', !!this.apiKey, 'Longueur:', this.apiKey.length);
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
    const minWords = options.minWords ?? 1800;

    return `Tu es un expert en décoration d'intérieur et en rédaction SEO professionnelle. 
Rédige un article de blog UNIQUE, COMPLET et PARFAITEMENT OPTIMISÉ pour: "${options.theme}"

## CONTEXTE & OBJECTIF
- Site: InstaDeco AI - Plateforme IA de décoration (Suisse, France, Belgique)
- But: Article SEO unique, naturel, non-détectable comme généré par IA
- Session: ${options.sessionType}
${options.additionalInstructions ? `- Instructions: ${options.additionalInstructions}` : ''}

## ⚠️ RÈGLES D'UNICITÉ ABSOLUES
1. JAMAIS utiliser de titres génériques type "Guide complet", "Tout savoir sur"
2. TOUJOURS créer un angle UNIQUE et ORIGINAL
3. VARIER systématiquement le vocabulaire (bannir répétitions)
4. Créer un titre ACCROCHEUR et SPÉCIFIQUE (max 60 car, incluant mot-clé)

## 📐 STRUCTURE OBLIGATOIRE (Format HTML)

### 1. TITRE H1 (unique, accrocheur, 50-60 caractères)
Exemple: "5 Secrets pour Transformer Votre Salon en Havre Scandinave"

### 2. INTRODUCTION CAPTIVANTE (120-150 mots)
- Accrocher le lecteur dès la 1ère phrase
- Introduire naturellement le mot-clé
- Poser une question ou problème concret
- Annoncer la valeur ajoutée de l'article

### 3. SOMMAIRE INTERACTIF (HTML)
\`\`\`html
<div class="sommaire">
<h2>Sommaire</h2>
<ol>
<li><a href="#section1">Titre Section 1</a></li>
<li><a href="#section2">Titre Section 2</a></li>
[...]
</ol>
</div>
\`\`\`

### 4. CORPS DE L'ARTICLE (4-7 sections)
- **Chaque H2** avec id (ex: id="section1")
- **Sous-titres H3** pour structurer
- **Paragraphes courts** (3-4 lignes max)
- **Listes à puces** pour la lisibilité
- **Gras** sur mots-clés importants
- **Exemples concrets** (prix, marques, dimensions)
- **Emojis subtils** pour dynamiser (🏠 ✨ 💡)

### 5. IMAGES SUGGESTIONS (balises)
Insérer 4-5 emplacements images avec:
\`\`\`html
<img src="placeholder" alt="Description SEO détaillée incluant mot-clé" title="Titre image">
<figcaption>Légende descriptive</figcaption>
\`\`\`

### 6. FAQ OPTIMISÉE (4-5 Q/R, Schema.org)
\`\`\`html
<div class="faq" itemscope itemtype="https://schema.org/FAQPage">
<h2>Questions Fréquentes</h2>
<div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
<h3 itemprop="name">Question précise et naturelle ?</h3>
<div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
<p itemprop="text">Réponse détaillée et utile (50-100 mots)</p>
</div>
</div>
[répéter 4-5 fois]
</div>
\`\`\`

### 7. CONCLUSION + CTA (100-120 mots)
- Résumer les points clés
- Appel action naturel vers InstaDeco AI
- Encourager à essayer la plateforme
- Lien: "Essayez InstaDeco AI gratuitement"

### 8. SUGGESTIONS MAILLAGE INTERNE (3-5 liens)
\`\`\`html
<div class="articles-lies">
<h3>Articles complémentaires</h3>
<ul>
<li><a href="/blog/[slug-suggeré]">Titre article lié pertinent</a></li>
[répéter 3-5 fois avec vrais thèmes décoration]
</ul>
</div>
\`\`\`

## ✍️ STYLE ANTI-DÉTECTION IA

### À FAIRE:
✅ Varier longueur phrases (courtes/moyennes/longues)
✅ Utiliser tournures personnelles ("je recommande", "d'expérience")
✅ Inclure anecdotes, chiffres précis, exemples concrets
✅ Poser questions rhétoriques au lecteur
✅ Utiliser connecteurs naturels ("cependant", "par ailleurs", "en outre")
✅ Insérer expressions idiomatiques françaises
✅ Citer sources crédibles (sites déco reconnus)

### À ÉVITER:
❌ Répétitions de mots/structures
❌ Transitions robotiques
❌ Listes à puces systématiques sans prose
❌ Ton trop formel ou académique
❌ Formules génériques ("il est important de", "n'hésitez pas")

## 🎯 OPTIMISATION SEO AVANCÉE

### Mot-clé principal: "${options.theme}"
- **Densité cible**: 1.5-2% (naturelle, pas forcée)
- **Placements**: H1, intro (1ère phrase), 2 H2, conclusion, meta
- **LSI keywords**: intégrer 8-10 synonymes/variantes
- **Questions longue traîne**: répondre à 3-4 "comment", "pourquoi", "quel"

### Balises sémantiques:
- <strong> pour mots-clés importants
- <em> pour nuances/emphases
- <mark> pour points essentiels (à retenir)

## 📏 CONTRAINTES TECHNIQUES

- **Longueur minimale**: ${minWords} mots (sans HTML)
- **Phrases**: 15-25 mots en moyenne (varier !)
- **Paragraphes**: 50-80 mots max
- **Lisibilité**: Score Flesch > 60 (accessible)

## 📤 FORMAT SORTIE (JSON STRICT)

Réponds UNIQUEMENT avec JSON valide (PAS de markdown, PAS de \`\`\`):

{
  "title": "Titre H1 unique et accrocheur",
  "content": "<p>Introduction...</p><div class='sommaire'>...</div><h2 id='section1'>...</h2><p>...</p>...<div class='faq'>...</div><p>Conclusion avec CTA...</p><div class='articles-lies'>...</div>",
  "metaDescription": "Meta SEO 150-160 caractères incluant mot-clé",
  "slug": "url-slug-optimise-seo",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

## ⚡ EXEMPLES DE TITRES UNIQUES (inspiration)

❌ Mauvais: "Guide Complet de la Décoration Scandinave"
✅ Bon: "7 Secrets Nordiques pour un Salon Hygge Inoubliable"

❌ Mauvais: "Comment Décorer sa Chambre"  
✅ Bon: "Transformez Votre Chambre en Sanctuaire : 5 Astuces de Pro"

Maintenant, rédige l'article COMPLET, UNIQUE et PARFAITEMENT OPTIMISÉ !`;
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
      console.error('Contenu brut (premiers 500 chars):', cleanContent.slice(0, 500));

      // Fallback: utiliser une regex plus robuste pour extraire le JSON
      // Chercher le premier objet JSON valide dans la réponse
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          // Essayer de parser ce qu'on a trouvé
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.title && parsed.content) {
            const slug = parsed.slug || this.generateSlug(parsed.title);
            return {
              title: parsed.title.trim(),
              content: parsed.content.trim(),
              metaDescription: (parsed.metaDescription || parsed.title).trim().slice(0, 160),
              slug: slug,
              tags: Array.isArray(parsed.tags)
                ? parsed.tags.map((t: string) => t.trim().toLowerCase())
                : [options.theme.toLowerCase()],
            };
          }
        } catch {
          // Si ça échoue encore, continuer au fallback manuel
        }
      }

      // Fallback manuel: extraire les parties essentielles avec regex
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
