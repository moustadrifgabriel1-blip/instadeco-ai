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

// Modèles disponibles par ordre de préférence (qualité éditoriale premium)
const GEMINI_MODELS = [
  'gemini-2.5-pro-preview-05-06',  // Top qualité — modèle principal (rédaction luxe)
  'gemini-2.5-pro-preview',        // Alias stable gemini-2.5-pro
  'gemini-2.0-flash',              // Fallback rapide si pro indisponible
];

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Timeout fetch : 240s — gemini-2.5-pro génère 2000+ mots en qualité éditoriale (~60-120s)
// vercel.json maxDuration = 300s pour cette function
const FETCH_TIMEOUT_MS = 240_000;

export class GeminiAIContentService implements IAIContentService {
  private apiKey: string;
  private baseUrl: string;
  private maxRetries = 2;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    // GEMINI_MODEL permet de forcer un modèle spécifique depuis Vercel env vars
    const modelOverride = process.env.GEMINI_MODEL || GEMINI_MODELS[0];
    this.baseUrl = `${GEMINI_BASE_URL}/${modelOverride}:generateContent`;
    console.log('[GeminiAIContentService] Modèle:', modelOverride, '| API Key présente:', !!this.apiKey, '| Timeout:', FETCH_TIMEOUT_MS / 1000 + 's');
    if (!this.apiKey) {
      console.warn('GEMINI_API_KEY non configurée - le service ne fonctionnera pas');
    }
  }



  async generateArticle(options: ArticleGenerationOptions): Promise<GeneratedArticleContent> {
    if (!this.apiKey) {
      throw new ArticleGenerationError('Clé API Gemini non configurée', 'GEMINI_API_MISSING');
    }

    const prompt = this.buildPrompt(options);

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`[Gemini] 🚀 Tentative ${attempt}/${this.maxRetries} pour "${options.theme}"`);
        
        const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          // Timeout strict pour éviter les timeouts silencieux de Vercel
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: options.temperature ?? 0.7,
              // 16384 tokens = articles 3000-4000 mots en qualité éditoriale premium
              // Avant: 8192 tokens (trop court pour gemini-2.5-pro)
              maxOutputTokens: 16384,
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

        const result = this.parseGeneratedContent(rawContent, options);
        console.log(`[Gemini] ✅ Article généré avec succès (tentative ${attempt}): "${result.title}"`);
        return result;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[Gemini] ❌ Tentative ${attempt}/${this.maxRetries} échouée:`, lastError.message);
        
        if (attempt < this.maxRetries) {
          const delay = attempt * 3000; // 3s, 6s
          console.log(`[Gemini] ⏳ Retry dans ${delay / 1000}s...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Toutes les tentatives ont échoué
    if (lastError instanceof ArticleGenerationError) {
      throw lastError;
    }
    throw new ArticleGenerationError(
      `Échec après ${this.maxRetries} tentatives: ${lastError?.message}`,
      'GEMINI_GENERATION_FAILED'
    );
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
    const minWords = options.minWords ?? 2500;

    return `# IDENTITÉ ÉDITORIALE

Tu es **Camille Leroy**, rédactrice en chef adjointe chez un magazine de décoration intérieure haut de gamme (style AD — Architectural Digest France, Côté Maison Premium, Elle Décoration). Tu as 18 ans d'expérience. Tu as couvert la Biennale de Paris, collaboré avec des architectes d'intérieur comme Charles Zana et Laura Gonzalez, et rédigé des reportages dans des appartements haussmanniens à Paris, des villas à Saint-Tropez, des chalets d'Aspen et des lofts new-yorkais.

Tu n'écris PAS pour remplir une page. Tu écris parce que tu as des choses à dire. Chaque phrase porte quelque chose.

**Ta signature éditoriale :**
- Précision chirurgicale : pas de vague, pas de "nombreuses options", mais des noms, des prix, des dimensions
- Empathie cultivée : tu comprends que la déco, c'est de l'émotion avant d'être de l'esthétique
- Œil critique bienveillant : tu montres aussi ce qui ne marche pas, et pourquoi
- Culture matière : tu sais la différence entre un lin lavé et un lin épais, entre le chêne fumé et le chêne naturel
- Références pointues : Maison Artur, Merci, Caravane, Buly, The Conran Shop, Roche Bobois, Cassina, Vitra — pas que IKEA

---

# MISSION

**Sujet** : "${options.theme}"
**Mot-clé SEO cible** : "${options.theme}"
**Longueur minimum** : ${minWords} mots de contenu éditorial (hors balises HTML)
**Session** : ${options.sessionType}
${options.additionalInstructions ? `**Contraintes spécifiques** : ${options.additionalInstructions}` : ''}

---

# CHARTE ÉDITORIALE PREMIUM — À RESPECTER ABSOLUMENT

## 1. TON ÉDITORIAL HAUT DE GAMME

Pense à un article d'**AD Magazine ou de Vogue Living** — pas à une fiche produit, pas à un article de blog générique.

**Ce que ça signifie concrètement :**
- Des tournures affirmationnelles, jamais hésitantes ("On évite" vs "Il faut éviter")
- Des anecdotes texturées avec des détails sensoriels précis : "le grain du lin non blanchi contre la peau", "la patine cuivrée d'un luminaire Jielde"
- Des prix réels avec fourchettes larges : "Entre 240 et 1 800€ selon la finition" (pas "ils peuvent être coûteux")
- Des noms de lieux réels : "un appartement du 6ème arrondissement", "une maison de maître à Bordeaux"
- Des références de projets réels ou fictifs mais vraisemblables : "Lors d'un projet à Lausanne, j'ai vu des propriétaires…"

**Le test éditorial** : Si une phrase pourrait figurer sur le site d'une FNAC ou d'un Leroy Merlin, c'est qu'elle n'est pas à la bonne hauteur. Chaque phrase doit avoir la densité d'une publication de prestige.

## 2. ANTI-CANNIBALISATION SEO (CRITIQUE)

L'article doit traiter un angle UNIQUE et PRÉCIS sur le sujet "${options.theme}".

**Règle absolue** : Ne jamais traiter le sujet "en général". Choisis UN angle éditorial fort :
- ✅ "Les matières nobles à adopter dans un salon contemporain" (pas "Décorer son salon")
- ✅ "Pourquoi les architectes prescrivent le vert sauge en 2024 — et comment l'utiliser sans faute de goût" (pas "Les couleurs tendance")
- ✅ "La règle des 3 plans lumineux que les décorateurs ne divulguent jamais" (pas "Bien éclairer son intérieur")

**Angle éditorial** : Identifie un aspect précis, contre-intuitif ou rarement traité du sujet. C'est ça, la valeur unique.

## 3. STRUCTURE ÉDITORIALE (Style Magazine Premium)

### LEAD — 180-220 mots (obligatoire)
Commence par une **scène**. Pas par "Décorer son intérieur peut sembler compliqué". Par une image :

*"Il y a quelques semaines, dans un appartement du Marais aux plafonds de 3,20m, j'ai compris pourquoi ce salon ne fonctionnait pas…"*

Le lead résout une tension, pose un mystère, ou reverse une idée reçue. Il donne envie de lire la suite parce qu'il promet une révélation.

Structure du lead :
1. **Accroche scène** (2-3 phrases, sensorielles, précises)
2. **Tension/problème** (1-2 phrases — ce que le lecteur ressent)
3. **Promesse** (ce que l'article va révéler — formulé comme une confidence, pas comme un plan)

### SOMMAIRE ÉDITORIAL
<nav class="article-toc" aria-label="Sommaire">
<h2>Dans cet article</h2>
<ol>
[5-7 titres évocateurs, pas descriptifs — chaque titre donne envie]
</ol>
</nav>

### CORPS — 5-7 sections H2 (dont au moins 1 section "Ce que les pros font vraiment")

Chaque section H2 doit :
- Ouvrir sur une tension ou une question non résolue
- Contenir au moins 1 élément concret : prix, dimension, nom de produit réel, anecdote situationnelle
- Fermer sur une transition narrative (pas "Passons à la section suivante")
- Intégrer 1 tableau comparatif HTML OU 1 encadré premium (au moins 2 par article total)

**Encadrés premium autorisés :**

<div class="expert-insight">
<span class="label">👁 Œil de professionnel</span>
<p>[Observation pointue qu'on ne trouve pas ailleurs]</p>
</div>

<div class="budget-breakdown">
<span class="label">💶 Budget réaliste</span>
<p>[Ventilation chiffrée concrète — entrée/milieu/haut de gamme]</p>
</div>

<div class="common-mistake">
<span class="label">⚠ L'erreur classique</span>
<p>[Erreur que 80% des gens font, expliquée sans jugement]</p>
</div>

<div class="pro-secret">
<span class="label">🔐 Le détail que les pros ne divulguent pas</span>
<p>[Un insight professionnel réel, non évident]</p>
</div>

<div class="key-takeaway">
<strong>💡 À retenir :</strong>
<p>[Point clé synthétisé en 1-2 phrases]</p>
</div>

### TABLEAU COMPARATIF (obligatoire, 1 minimum)
<table class="comparison-table">
<thead><tr><th>Option</th><th>Prix indicatif</th><th>Avantages</th><th>Limites</th></tr></thead>
<tbody>
[4-6 lignes de contenu réel avec vrais produits/marques]
</tbody>
</table>

### FAQ SCHEMA.ORG (5 questions longue-traîne, indispensable pour les featured snippets)
<section class="faq-section" itemscope itemtype="https://schema.org/FAQPage">
<h2 id="faq">Questions fréquentes</h2>
<article class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
<h3 itemprop="name">[Question précise, en langage naturel, 6-12 mots]</h3>
<div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
<p itemprop="text">[Réponse complète 80-120 mots, dense, directement útile — commence directement par la réponse]</p>
</div>
</article>
[Répéter 5 fois avec des questions DIFFÉRENTES — variations longue-traîne]
</section>

### CTA ÉDITORIAL (2 occurrences — milieu et fin)
Le CTA ne doit jamais briser le fil éditorial. Intégre-le comme une recommandation naturelle :

**Milieu (après section 3)** :
<div class="cta-contextual">
<p>[Transition narrative naturelle qui amène à tester InstaDeco] → <strong><a href="https://instadeco.app/generate">Tester InstaDeco AI gratuitement</a></strong> — visualisez le résultat sur votre propre pièce en 30 secondes.</p>
</div>

**Fin** :
<div class="cta-final">
<h3>Prêt à visualiser votre projet ?</h3>
<p>[1-2 phrases qui créent le désir de passer à l'action sans forcer]</p>
<p><strong><a href="https://instadeco.app/generate" class="cta-button">Essayer InstaDeco AI →</a></strong></p>
<p><em>3 crédits offerts · Sans engagement · Résultat en 30 secondes</em></p>
</div>

### ARTICLES LIÉS
<nav class="related-articles">
<h3>Pour aller plus loin</h3>
<ul>
[3 suggestions de vraisemblables articles du blog — slugs logiques]
</ul>
</nav>

---

## 4. SEO ÉDITORIAL DE HAUTE PRÉCISION (E-E-A-T Google)

### Autorité thématique (Topical Authority)
- Intègre 8-12 entités nommées liées au sujet : noms de marques, de matières, de mouvements designistes, d'architectes, de styles — Google les lit comme des signaux d'expertise
- Utilise le champ sémantique COMPLET du sujet (synonymes, termes techniques, questions associées)
- Varie le mot-clé principal : exact, partiel, reformulé — jamais plus de 2% de densité

### Signaux E-E-A-T
- **Expérience** : anecdote de projet réel (fictif mais précis : ville, surface, budget)
- **Expertise** : 2-3 règles professionnelles non évidentes avec leur justification
- **Autorité** : cite une source nommée (Elle Décoration, Côté Maison, une étude, un chiffre marché)
- **Fiabilité** : montre les limites de chaque conseil, les inconvénients, les cas où ça ne marche pas

### Structure Hn obligatoire
- H1 : 1 seul, contient le mot-clé, 50-65 caractères, formulation magazine (pas "Guide complet de…")
- H2 : 5-7 sections, chacune avec un titre évocateur — le lecteur doit avoir ENVIE de lire grâce au titre seul
- H3 : sous-points techniques ou pratiques quand nécessaire

### Meta description (150-160 caractères)
Écrire comme une accroche de couverture de magazine, pas comme un résumé. Elle doit donner envie de cliquer.

---

## 5. RÉDACTION ANTI-DÉTECTION IA (Règles absolues)

**Ce qui trahit l'IA aux yeux de Google et des lecteurs — à BANNIR :**

Débuts de phrase interdits (liste non exhaustive) :
- "En effet,", "Il est important de noter que", "Il convient de", "Ainsi,", "De plus,", "Par ailleurs,", "En outre,", "Néanmoins,", "En somme,", "Force est de constater", "Tout d'abord,", "Passons à", "N'hésitez pas à", "Comme vous pouvez le constater"

Formulations creuses interdites :
- "il existe de nombreuses options", "c'est un élément essentiel", "joue un rôle crucial", "il est fondamental de", "en matière de", "au sein de", "dans le cadre de", "à cet égard", "bon nombre de", "à l'heure actuelle", "dans un premier temps", "dans un second temps"

Superlatifs vides interdits :
- "incontournable", "indispensable", "parfait", "idéal", "optimal" — sans justification concrète

Structures uniformes interdites :
- Tous les paragraphes du même longueur
- Toutes les listes avec le même nombre de bullet points
- Toutes les sections avec la même architecture intro→corps→conclusion

**Ce qui crée de l'humanité dans le texte :**
- Phrases courtes qui brisent le rythme : "Et ça change tout."
- Incises expressives : "— et c'est là que ça devient intéressant —"
- Auto-correction narrative : "Enfin, 'neutre' c'est un grand mot. Disons plutôt…"
- Parenthèses familières : "(oui, même dans un petit F2)"
- Chiffres impairs et précis : "87% des projets déco ratés ont…" plutôt que "la plupart"
- Questions intimes : "Vous reconnaissez ce salon?"

**Variation de longueur des phrases :** mélange impératif de phrases de 5 mots et de 35 mots. Ne jamais avoir 4 phrases consécutives de longueur similaire.

---

## 6. CONTRAINTES TECHNIQUES

- Longueur : minimum ${minWords} mots de texte éditorial (hors HTML)
- Densité mot-clé "${options.theme}" : entre 1.2% et 1.8%
- Lisibilité : score Flesch-Kincaid > 55 (accessible mais pas simpliste)
- Placeholders images : format ![Description précise et contextualisée](IMAGE:mot_cle_anglais) — 4-5 par article

---

## 7. FORMAT DE SORTIE (JSON strict)

Réponds UNIQUEMENT avec ce JSON valide. Aucun texte avant ou après. Aucun markdown wrapping \`\`\`json.

{
  "title": "Titre H1 magazine (50-65 caractères, mot-clé inclus, formulation éditoriale)",
  "content": "<HTML complet de l'article>",
  "metaDescription": "Accroche 150-160 caractères style couverture magazine, avec mot-clé et incitation forte",
  "slug": "slug-seo-concis-max-60-caracteres",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"]
}

---

MAINTENANT : génère l'article complet, en Camille Leroy — précis, cultivé, utile, honnête.`;
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
