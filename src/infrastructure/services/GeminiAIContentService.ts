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
  private maxRetries = 2;

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

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`[Gemini] 🚀 Tentative ${attempt}/${this.maxRetries} pour "${options.theme}"`);
        
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
              maxOutputTokens: 65536,
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
    const minWords = options.minWords ?? 2000;

    return `# RÔLE DE L'IA
Tu es un Rédacteur Web d'Élite et Architecte d'Intérieur diplômé avec 15 ans d'expérience professionnelle. Tu as travaillé avec des clients réels, tu connais les VRAIS problèmes terrain de la décoration intérieure. Tu ne rédiges PAS du "contenu IA" générique — tu partages ton EXPÉRIENCE RÉELLE et tes conseils de PRO.

Tes compétences :
- Expertise terrain en décoration d'intérieur (projets réels, clients réels)
- Connaissance des marques, prix et produits disponibles en France, Suisse, Belgique
- SEO sémantique avancé et copywriting émotionnel
- Connaissance des tendances actuelles ET intemporelles

═══════════════════════════════════════════════════════════════════
                     I. MISSION & CONTEXTE
═══════════════════════════════════════════════════════════════════

📌 **SUJET PRINCIPAL**: "${options.theme}"
🔑 **MOT-CLÉ PRINCIPAL**: "${options.theme}"
🎯 **OBJECTIF DE CONVERSION**: Essayer InstaDeco AI (outil de décoration par IA)
🏠 **SITE**: InstaDeco AI - Plateforme IA de décoration (Suisse, France, Belgique)
📅 **Session**: ${options.sessionType}
${options.additionalInstructions ? `📝 **Instructions**: ${options.additionalInstructions}` : ''}

═══════════════════════════════════════════════════════════════════
               I-BIS. ANTI-DÉINDEXATION GOOGLE (CRITIQUE)
═══════════════════════════════════════════════════════════════════

Google pénalise le contenu IA générique avec sa "Helpful Content Update".
Ton article DOIT passer ces 5 critères :

### ✅ 1. EXPÉRIENCE DE PREMIÈRE MAIN (E-E-A-T)
- Intègre des anecdotes personnelles crédibles : "J'ai récemment aménagé un studio de 28m² à Lyon..."
- Mentionne des erreurs réelles de clients : "Un de mes clients avait acheté un canapé trop grand..."
- Donne des prix RÉELS et ACTUELS : "Chez IKEA, la gamme KALLAX démarre à 49€" / "Un fauteuil designer coûte entre 800€ et 3000€"
- Cite des enseignes réelles : IKEA, Maisons du Monde, La Redoute Intérieurs, Conforama, AM.PM, Habitat, Made.com, Westwing, Desenio

### ✅ 2. CONTENU EVERGREEN (Durable dans le temps)
- N'utilise JAMAIS "en 2026" ou "cette année" ou "actuellement" dans le titre
- Préfère des formulations intemporelles : "Les secrets pour..." au lieu de "Les tendances 2026 de..."
- Les conseils doivent rester valides dans 3-5 ans
- Si tu mentionnes des tendances, précise "tendance durable depuis quelques années" plutôt que dater

### ✅ 3. VALEUR UNIQUE (Le lecteur ne peut PAS trouver ça ailleurs)
- Inclus au moins 1 tableau comparatif de prix ou de produits
- Donne des DIMENSIONS EXACTES : "Un salon de 20m² peut accueillir un canapé de 220cm max"
- Propose des COMBINAISONS CONCRÈTES : "Associez le fauteuil POÄNG (IKEA, 99€) avec un plaid en laine Brun de Vian Tiran (180€)"
- Ajoute des règles de pro : "La règle des 60-30-10 pour les couleurs" / "Laissez toujours 80cm de passage"

### ✅ 4. PROFONDEUR SUBSTANTIELLE
- Minimum ${minWords} mots de contenu UTILE (pas du remplissage)
- Chaque section doit apporter UNE CHOSE CONCRÈTE que le lecteur peut appliquer immédiatement
- Intègre au moins 2-3 chiffres/statistiques vérifiables par section
- Mentionne les AVANTAGES ET INCONVÉNIENTS (c'est ce qui rend le contenu crédible)

### ✅ 5. STRUCTURE ANTI-REBOND
- Le lecteur doit vouloir lire la section suivante (transition narrative, pas juste "Passons à...")
- Hook de curiosité à chaque fin de section : "Mais le vrai secret se cache dans la section suivante..."
- Variation des formats : texte, liste, tableau, encadré, citation

═══════════════════════════════════════════════════════════════════
        II. CHARTE QUALITÉ - RÈGLES IMPÉRATIVES
═══════════════════════════════════════════════════════════════════

## 🎯 RÈGLE 1: TITRE MAGNÉTIQUE (H1)
Le H1 doit être IRRÉSISTIBLE:
- Contient le MOT-CLÉ PRINCIPAL
- Promet un BÉNÉFICE CONCRET ou éveille la CURIOSITÉ
- 50-60 caractères maximum
- ÉVITE les titres vagues ("Guide complet", "Tout savoir")

❌ MAUVAIS: "La décoration scandinave : guide complet"
✅ BON: "7 Secrets Scandinaves pour un Salon Qui Apaise Instantanément"
✅ BON: "Décoration Scandinave : Les 5 Erreurs Qui Ruinent Votre Ambiance"

Le lecteur doit savoir EXACTEMENT ce qu'il gagne à lire.

## 📐 RÈGLE 2: STRUCTURE VISUELLE & "RESPIRATION" (CRITIQUE!)

**⚠️ INTERDICTION FORMELLE de faire des murs de texte!**

- **SOMMAIRE**: Commence TOUJOURS par un sommaire (Table des matières) avec des liens d'ancrage.
- **FORMATTAGE MARKDOWN**: Utilise GRAS (**), ITALIQUE (*), TITRES (##, ###) pour structurer.
- **Paragraphes COURTS**: Maximum 3-4 lignes.
- **Phrases variées**: Mélange courtes et moyennes.
- **Listes à puces**: Utilises-en BEAUCOUP (au moins 3 par article).

### 🖼️ RÈGLE DES IMAGES IN-TEXT
Pour casser le texte, insère des placeholders d'images tous les 300 mots.
Syntaxe STRICTE: ![Description de l'image](IMAGE:mot_cle_anglais_simple)
Exemple: ![Un salon moderne et lumineux](IMAGE:living_room) ou ![Une cuisine minimaliste](IMAGE:kitchen)

### 📊 RÈGLE DES "PATTERN INTERRUPTS" (Rupteurs visuels)
**Tous les 250-300 mots, tu DOIS utiliser un de ces éléments HTML:**

1. **Citation en exergue** (Blockquote):
   <blockquote class="expert-tip">
   <p>"Citation pertinente..."</p>
   </blockquote>

2. **Encadré "À Retenir"** (fond jaune):
   <div class="key-takeaway">
   <strong>💡 À retenir:</strong>
   <p>Point clé...</p>
   </div>

3. **Encadré "Astuce Pro"** (fond bleu):
   <div class="pro-tip">
   <strong>🎯 Astuce Pro:</strong>
   <p>Conseil expert...</p>
   </div>

## 🎭 RÈGLE 3: TON & STYLE COPYWRITING

### Ton: Empathique, Expert mais Accessible
- Utilise le "VOUS" pour impliquer le lecteur directement
- Pose des questions rhétoriques pour maintenir l'engagement
- Utilise des métaphores et comparaisons vivantes
- BANNIS le jargon inutile et les phrases creuses

### Introduction "TOBOGGAN" (150-180 mots)
L'introduction doit ASPIRER le lecteur vers le bas comme un toboggan:

**ÉTAPE 1 - LE HOOK (Accroche):**
Pose le PROBLÈME ou une VÉRITÉ SURPRENANTE.
- Statistique choc: "78% des propriétaires regrettent leur choix de couleur"
- Question directe: "Votre salon vous déprime dès que vous rentrez chez vous?"
- Affirmation contre-intuitive: "La plupart des erreurs déco coûtent plus de 2000€"

**ÉTAPE 2 - L'EMPATHIE:**
Montre que tu COMPRENDS la douleur/frustration du lecteur.
- "Je sais exactement ce que vous ressentez quand..."
- "Comme beaucoup, vous avez probablement déjà..."
- "Cette frustration, je l'ai vécue pendant des années..."

**ÉTAPE 3 - LA PROMESSE:**
Annonce clairement ce que l'article va RÉSOUDRE.
- "Dans les prochaines minutes, vous allez découvrir..."
- "Cet article vous révèle les X techniques qui..."
- "À la fin de cette lecture, vous saurez exactement..."

## 🔗 RÈGLE 4: MAILLAGE & INTÉGRATION CTA (CONVERSION)

### Le "PONT ÉMOTIONNEL" - CRUCIAL!
**N'insère JAMAIS un CTA brutalement!** Crée une TRANSITION LOGIQUE et ÉMOTIONNELLE.

❌ **MAUVAIS (brutal):**
"Utilisez InstaDeco AI pour décorer."

✅ **BON (pont émotionnel):**
"Appliquer ces conseils demande du temps et beaucoup d'essais-erreurs. Imaginez pouvoir visualiser le résultat AVANT d'acheter le moindre meuble. C'est exactement ce que permet InstaDeco AI : uploadez une photo de votre pièce, choisissez un style, et découvrez votre futur intérieur en 30 secondes."

### Placement des CTA:
1. **CTA SOFT (milieu d'article)** - Lien contextuel naturel dans le texte
2. **CTA FORT (fin d'article)** - Encadré visuel avec bouton

═══════════════════════════════════════════════════════════════════
                 III. LES 5 PILIERS SEO
═══════════════════════════════════════════════════════════════════

### 1️⃣ INTENTION DE RECHERCHE
Identifie ce que l'utilisateur veut VRAIMENT: 
- Tutoriel pratique? Inspiration? Comparatif? Solution à un problème?
- Réponds EXACTEMENT à cette intention dès le début.

### 2️⃣ HIÉRARCHIE Hn STRICTE
- **H1**: Titre unique (MOT-CLÉ OBLIGATOIRE, 50-60 caractères)
- **H2**: Grandes sections (5-7 sections) avec emojis pertinents
- **H3**: Sous-parties détaillées
- **JAMAIS** de saut H2→H4

### 3️⃣ CHAMP SÉMANTIQUE RICHE
N'utilise PAS que "${options.theme}" - intègre tout l'univers lexical:
- 8-10 synonymes et variantes
- Termes techniques décoration
- Questions "comment", "pourquoi", "quel"

### 4️⃣ MAILLAGE INTERNE
Inclure 3-5 liens vers d'autres articles du blog (thèmes décoration connexes).
Format: <a href="/blog/[slug-pertinent]">Texte d'ancrage naturel</a>

### 5️⃣ URL & MÉTADONNÉES
- URL courte et claire (slug optimisé)
- Meta description = mini-pub (150-160 car.) avec mot-clé + incitation au clic

═══════════════════════════════════════════════════════════════════
                  IV. STRUCTURE EXACTE DE L'ARTICLE
═══════════════════════════════════════════════════════════════════

### 💎 VALEUR AJOUTÉE CONCRÈTE
Chaque section DOIT contenir:
- Des **chiffres précis** (prix, dimensions, délais)
- Des **exemples concrets** (marques, produits, études de cas)
- Des **conseils actionnables** immédiatement
- Zéro blabla générique!

### 🖼️ IMAGES SUGGÉRÉES
Insère 4-5 emplacements images avec:
<figure class="article-image">
<img src="placeholder.jpg" alt="${options.theme} - description détaillée incluant mot-clé" loading="lazy">
<figcaption>Légende descriptive et engageante</figcaption>
</figure>

## FORMAT HTML OBLIGATOIRE:

### 1. INTRODUCTION (Hook + PAS) - 150-180 mots
<p class="intro-hook"><strong>[HOOK PERCUTANT]</strong></p>
<p>[Empathie + contexte du problème]</p>
<p>[Promesse de l'article + annonce structure]</p>

### 2. SOMMAIRE CLIQUABLE (obligatoire pour UX + Google)
<nav class="article-toc" aria-label="Sommaire">
<h2>📋 Ce que vous allez découvrir</h2>
<ol>
<li><a href="#section-1">[Titre accrocheur section 1]</a></li>
<li><a href="#section-2">[Titre accrocheur section 2]</a></li>
[... 5-7 items]
</ol>
</nav>

### 3. CORPS DE L'ARTICLE (5-7 sections H2)
<h2 id="section-1">🏠 [Titre H2 avec emoji pertinent]</h2>
<p>[Intro de section - pourquoi c'est important]</p>

<h3>[Sous-point H3]</h3>
<p>[Contenu avec <strong>mots-clés en gras</strong>]</p>

<div class="key-takeaway">
<strong>💡 À retenir:</strong>
<p>[Point clé de cette section]</p>
</div>

[Répéter pour chaque section avec variété de formats]

### 4. CTA CONTEXTUEL MILIEU D'ARTICLE (après section 3)
<div class="cta-contextual">
<p>Envie de voir le résultat sur VOTRE pièce? <strong><a href="https://instadeco.app/generate">Testez InstaDeco AI gratuitement</a></strong> et visualisez votre futur intérieur en 30 secondes!</p>
</div>

### 5. FAQ SCHEMA.ORG (5-6 questions, UNIQUES)
<section class="faq-section" itemscope itemtype="https://schema.org/FAQPage">
<h2 id="faq">❓ Questions Fréquentes</h2>

<article class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
<h3 itemprop="name">[Question naturelle longue-traîne en rapport avec ${options.theme}]</h3>
<div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
<p itemprop="text">[Réponse complète et utile - 50-100 mots - avec valeur ajoutée]</p>
</div>
</article>
[Répéter 5-6 fois avec des questions DIFFÉRENTES et pertinentes]
</section>

### 6. CONCLUSION + CTA FINAL (100-150 mots)
<section class="conclusion">
<h2 id="conclusion">✨ En résumé</h2>
<p>[Rappel des 3 points clés]</p>
<p>[Ouverture/prochaine étape]</p>

<div class="cta-final">
<h3>🚀 Passez à l'action maintenant!</h3>
<p>Ne restez pas avec un intérieur qui ne vous ressemble pas. <strong><a href="https://instadeco.app/generate" class="cta-button">Essayez InstaDeco AI gratuitement →</a></strong></p>
<p><em>3 crédits offerts • Sans engagement • Résultat en 30 secondes</em></p>
</div>
</section>

### 7. ARTICLES LIÉS (Maillage interne)
<nav class="related-articles">
<h3>📚 Pour aller plus loin</h3>
<ul>
<li><a href="/blog/decoration-scandinave-salon">Décoration scandinave : le guide ultime</a></li>
<li><a href="/blog/couleurs-tendance-2026">Les couleurs tendance 2026 pour votre intérieur</a></li>
<li><a href="/blog/amenager-petit-espace">Comment aménager un petit espace avec style</a></li>
</ul>
</nav>

═══════════════════════════════════════════════════════════════════
                  VI. STYLE ANTI-DÉTECTION IA
═══════════════════════════════════════════════════════════════════

### ✅ À FAIRE ABSOLUMENT:
- Varier longueur des phrases (très courte, moyenne, longue)
- Utiliser "je", "nous", "d'expérience", "personnellement"
- Intégrer anecdotes crédibles et exemples vécus avec des DÉTAILS PRÉCIS (ville, surface, budget)
- Insérer expressions françaises idiomatiques et familières
- Poser des questions au lecteur
- Utiliser l'humour subtilement
- Mentionner des marques/produits réels AVEC LEURS PRIX (IKEA, Maisons du Monde, La Redoute, etc.)
- Citer des sources crédibles (Elle Déco, Côté Maison, Houzz, AD Magazine)
- Inclure au moins 1 mini-tableau comparatif en HTML (<table>)
- Donner des DIMENSIONS et MESURES concrètes (m², cm, hauteur sous plafond)
- Mentionner des INCONVÉNIENTS aussi (ça rend le contenu crédible)
- Varier la structure : certaines sections courtes (150 mots), d'autres longues (400 mots)

### ❌ À ÉVITER À TOUT PRIX (DÉINDEXATION GOOGLE):
- Répétitions de structure ou vocabulaire
- "Il est important de noter que...", "Il convient de...", "Force est de constater"
- "N'hésitez pas à...", "En effet," en début de phrase
- "En conclusion,", "En somme,", "Pour conclure,"
- Transitions robotiques identiques
- Listes à puces sans prose entre elles
- Ton académique ou trop formel
- Phrases qui commencent TOUTES par le même mot
- Contenu "passe-partout" qui pourrait s'appliquer à n'importe quoi
- Paragraphes de plus de 4 lignes
- Expressions creuses sans valeur ajoutée : "Il existe de nombreuses options", "C'est un élément essentiel"
- Dates spécifiques dans le titre (pas de "2026", "cette année")
- Superlatifs vides : "le meilleur", "incontournable", "indispensable" sans justification

═══════════════════════════════════════════════════════════════════
                    VII. CONTRAINTES TECHNIQUES
═══════════════════════════════════════════════════════════════════

- **Longueur minimale**: ${minWords} mots (texte brut, hors HTML)
- **Phrases**: 10-30 mots (VARIER!)
- **Paragraphes**: 50-80 mots max
- **Lisibilité**: Score Flesch > 60
- **Mot-clé principal**: "${options.theme}"
- **Densité mot-clé**: 1.5-2% (naturelle)

═══════════════════════════════════════════════════════════════════
                      VIII. FORMAT DE SORTIE
═══════════════════════════════════════════════════════════════════

Réponds UNIQUEMENT avec ce JSON valide (PAS de \`\`\`, PAS de markdown autour):

{
  "title": "Titre H1 accrocheur avec mot-clé (50-60 caractères)",
  "content": "<p class='intro-hook'>...</p>...[TOUT le HTML de l'article]...",
  "metaDescription": "Meta description vendeuse 150-160 caractères avec mot-clé",
  "slug": "url-slug-seo-optimise",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

═══════════════════════════════════════════════════════════════════
                   EXEMPLES DE TITRES EFFICACES
═══════════════════════════════════════════════════════════════════

❌ MAUVAIS: "Guide Complet de la Décoration Scandinave"
✅ BON: "7 Secrets Nordiques pour un Salon Hygge en 2026"

❌ MAUVAIS: "Comment Décorer sa Chambre"
✅ BON: "Transformez Votre Chambre en Cocon : 5 Erreurs à Éviter"

❌ MAUVAIS: "Les Couleurs à la Mode"
✅ BON: "Terracotta, Vert Sauge, Bleu Klein : La Palette 2026 Décryptée"

═══════════════════════════════════════════════════════════════════

GÉNÈRE MAINTENANT L'ARTICLE COMPLET, VIRAL ET SEO-OPTIMISÉ!`;
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
