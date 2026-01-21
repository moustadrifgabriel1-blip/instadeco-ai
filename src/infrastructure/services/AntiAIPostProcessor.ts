/**
 * Service: AntiAIPostProcessor
 * 
 * Post-traitement pour réduire les patterns détectables par les outils anti-IA.
 * Humanise le contenu généré par l'IA.
 */

export interface ProcessingResult {
  content: string;
  score: number; // Score anti-AI (0-100, plus haut = plus humain)
  modifications: string[];
}

export class AntiAIPostProcessor {
  // Patterns typiques de l'IA à remplacer
  private readonly aiPatterns: Array<{ pattern: RegExp; replacements: string[] }> = [
    // Débuts de phrases trop "IA"
    {
      pattern: /^En effet,\s*/gim,
      replacements: ['', 'Car ', 'De fait, ', ''],
    },
    {
      pattern: /^Il est important de noter que\s*/gim,
      replacements: ['', 'À savoir : ', 'Notez que ', ''],
    },
    {
      pattern: /^Il convient de souligner que\s*/gim,
      replacements: ['', 'Précisons que ', '', 'Soulignons que '],
    },
    {
      pattern: /^Dans le cadre de\s*/gim,
      replacements: ['Pour ', 'Concernant ', 'Avec ', ''],
    },
    {
      pattern: /^Ainsi,\s*/gim,
      replacements: ['', 'Donc, ', '', 'Par conséquent, '],
    },
    {
      pattern: /^De plus,\s*/gim,
      replacements: ['', 'Aussi, ', 'Et ', 'En plus, '],
    },
    {
      pattern: /^Par ailleurs,\s*/gim,
      replacements: ['', 'Aussi, ', 'D\'autre part, ', ''],
    },
    {
      pattern: /^En outre,\s*/gim,
      replacements: ['', 'De surcroît, ', 'Qui plus est, ', ''],
    },
    {
      pattern: /^Néanmoins,\s*/gim,
      replacements: ['Mais ', 'Cependant, ', 'Toutefois, ', 'Pourtant, '],
    },
    {
      pattern: /^En somme,\s*/gim,
      replacements: ['Bref, ', 'Au final, ', 'Pour résumer, ', ''],
    },
    {
      pattern: /^Force est de constater que\s*/gim,
      replacements: ['On remarque que ', '', 'Il est clair que ', ''],
    },

    // Expressions trop formelles
    {
      pattern: /\bpermettre de\b/gi,
      replacements: ['aider à', 'servir à', 'donner la possibilité de'],
    },
    {
      pattern: /\bafin de\b/gi,
      replacements: ['pour', 'dans le but de', 'pour'],
    },
    {
      pattern: /\bau sein de\b/gi,
      replacements: ['dans', 'à l\'intérieur de', 'chez'],
    },
    {
      pattern: /\bà cet égard\b/gi,
      replacements: ['sur ce point', 'à ce sujet', 'en ce sens'],
    },
    {
      pattern: /\ben termes de\b/gi,
      replacements: ['pour ce qui est de', 'côté', 'niveau'],
    },
    {
      pattern: /\btout d'abord\b/gi,
      replacements: ['d\'abord', 'premièrement', 'pour commencer'],
    },
    {
      pattern: /\bbon nombre de\b/gi,
      replacements: ['beaucoup de', 'plusieurs', 'de nombreux'],
    },
    {
      pattern: /\bil est à noter que\b/gi,
      replacements: ['notez que', 'précisons que', ''],
    },

    // Mots "passe-partout" trop utilisés par l'IA
    {
      pattern: /\bextrêmement\b/gi,
      replacements: ['très', 'vraiment', 'particulièrement'],
    },
    {
      pattern: /\bfondamentalement\b/gi,
      replacements: ['en soi', 'au fond', 'essentiellement'],
    },
    {
      pattern: /\bincontestablement\b/gi,
      replacements: ['clairement', 'sans aucun doute', 'manifestement'],
    },
    {
      pattern: /\bindéniablement\b/gi,
      replacements: ['sans conteste', 'à l\'évidence', 'manifestement'],
    },
    {
      pattern: /\boptimal\b/gi,
      replacements: ['idéal', 'parfait', 'le meilleur'],
    },
    {
      pattern: /\bprimordial\b/gi,
      replacements: ['essentiel', 'capital', 'crucial'],
    },

    // Superlatifs excessifs
    {
      pattern: /\bla meilleure façon\b/gi,
      replacements: ['une bonne façon', 'la façon idéale', 'un excellent moyen'],
    },
    {
      pattern: /\ble meilleur moyen\b/gi,
      replacements: ['un excellent moyen', 'la solution idéale', 'une méthode efficace'],
    },
  ];

  // Variations de ponctuation pour humaniser
  private readonly sentenceVariations = [
    { pattern: /\. /g, weight: 0.05, replacement: '... ' },
    { pattern: /\. /g, weight: 0.03, replacement: ' – ' },
    { pattern: /!\s/g, weight: 0.2, replacement: '. ' },
  ];

  async process(content: string): Promise<ProcessingResult> {
    const modifications: string[] = [];
    let processedContent = content;
    let modificationCount = 0;

    // 1. Appliquer les remplacements de patterns IA
    for (const { pattern, replacements } of this.aiPatterns) {
      const matches = processedContent.match(pattern);
      if (matches) {
        for (const match of matches) {
          const replacement = this.pickRandom(replacements);
          if (replacement !== match) {
            processedContent = processedContent.replace(match, replacement);
            modificationCount++;
            if (modificationCount <= 10) {
              modifications.push(`"${match.trim()}" → "${replacement.trim() || '(supprimé)'}"`);
            }
          }
        }
      }
    }

    // 2. Ajouter des variations mineures de style
    processedContent = this.addStylisticVariations(processedContent);

    // 3. Équilibrer la longueur des paragraphes
    processedContent = this.balanceParagraphs(processedContent);

    // 4. Insérer des marqueurs d'hésitation naturels (parcimonie)
    processedContent = this.addNaturalHesitations(processedContent);

    // Calculer le score anti-AI (estimation basée sur les modifications)
    const score = this.calculateAntiAIScore(content, processedContent, modificationCount);

    if (modificationCount > 10) {
      modifications.push(`... et ${modificationCount - 10} autres modifications`);
    }

    return {
      content: processedContent,
      score,
      modifications,
    };
  }

  private addStylisticVariations(content: string): string {
    let result = content;

    // Ajouter quelques contractions naturelles (avec parcimonie)
    const contractions: Array<{ full: string; contracted: string }> = [
      { full: 'ne est', contracted: 'n\'est' },
      { full: 'ce est', contracted: 'c\'est' },
      { full: 'que il', contracted: 'qu\'il' },
      { full: 'que elle', contracted: 'qu\'elle' },
      { full: 'de un', contracted: 'd\'un' },
      { full: 'de une', contracted: 'd\'une' },
    ];

    for (const { full, contracted } of contractions) {
      result = result.replace(new RegExp(full, 'gi'), contracted);
    }

    return result;
  }

  private balanceParagraphs(content: string): string {
    const paragraphs = content.split('\n\n');
    const balanced: string[] = [];

    for (const para of paragraphs) {
      // Si le paragraphe est trop long, le garder tel quel (le découpage altère le sens)
      // Si c'est un titre (commence par #), le garder
      if (para.startsWith('#') || para.length < 800) {
        balanced.push(para);
      } else {
        // Découper les paragraphes très longs après une phrase
        const sentences = para.split(/(?<=[.!?])\s+/);
        let currentPara = '';
        
        for (const sentence of sentences) {
          if (currentPara.length + sentence.length > 600) {
            if (currentPara) balanced.push(currentPara.trim());
            currentPara = sentence;
          } else {
            currentPara += (currentPara ? ' ' : '') + sentence;
          }
        }
        
        if (currentPara) balanced.push(currentPara.trim());
      }
    }

    return balanced.join('\n\n');
  }

  private addNaturalHesitations(content: string): string {
    // Ajouter très occasionnellement des éléments naturels
    const hesitations = [
      { pattern: /Vous pouvez/g, replacement: "Vous pouvez aussi", chance: 0.1 },
      { pattern: /C'est /g, replacement: "C'est vraiment ", chance: 0.08 },
      { pattern: /Il faut/g, replacement: "Il vaut mieux", chance: 0.15 },
    ];

    let result = content;
    let hesitationCount = 0;
    const maxHesitations = 3;

    for (const { pattern, replacement, chance } of hesitations) {
      if (hesitationCount >= maxHesitations) break;
      
      result = result.replace(pattern, (match) => {
        if (hesitationCount < maxHesitations && Math.random() < chance) {
          hesitationCount++;
          return replacement;
        }
        return match;
      });
    }

    return result;
  }

  private calculateAntiAIScore(
    original: string,
    processed: string,
    modificationCount: number
  ): number {
    let score = 50; // Score de base

    // Plus de modifications = contenu plus humanisé
    score += Math.min(modificationCount * 2, 30);

    // Vérifier la diversité des débuts de phrases
    const sentences = processed.split(/[.!?]\s+/);
    const sentenceStarts = new Set(
      sentences.map((s) => s.trim().split(/\s+/).slice(0, 2).join(' ').toLowerCase())
    );
    const diversityRatio = sentenceStarts.size / sentences.length;
    score += diversityRatio * 15;

    // Vérifier l'absence de patterns IA résiduels
    let remainingPatterns = 0;
    for (const { pattern } of this.aiPatterns) {
      if (pattern.test(processed)) {
        remainingPatterns++;
      }
    }
    score -= remainingPatterns * 3;

    // Bonus pour les paragraphes de longueur variée
    const paragraphs = processed.split('\n\n').filter((p) => !p.startsWith('#'));
    if (paragraphs.length > 2) {
      const lengths = paragraphs.map((p) => p.length);
      const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const variance = lengths.reduce((acc, len) => acc + Math.abs(len - avgLength), 0) / lengths.length;
      if (variance > 50) score += 5;
    }

    return Math.min(Math.max(score, 0), 100);
  }

  private pickRandom<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Analyse un contenu et retourne un score de détection IA potentielle
   */
  analyzeContent(content: string): { score: number; issues: string[] } {
    const issues: string[] = [];
    let detectionScore = 0;

    // Vérifier les patterns problématiques
    for (const { pattern } of this.aiPatterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        detectionScore += matches.length * 5;
        if (matches.length > 2) {
          issues.push(`Pattern répété ${matches.length}x: "${matches[0].trim()}"`);
        }
      }
    }

    // Vérifier la répétition des débuts de phrase
    const sentences = content.split(/[.!?]\s+/);
    const startCounts: Record<string, number> = {};
    
    for (const sentence of sentences) {
      const start = sentence.trim().split(/\s+/).slice(0, 2).join(' ').toLowerCase();
      startCounts[start] = (startCounts[start] || 0) + 1;
    }

    for (const [start, count] of Object.entries(startCounts)) {
      if (count > 3) {
        detectionScore += (count - 3) * 8;
        issues.push(`Début de phrase répété ${count}x: "${start}"`);
      }
    }

    // Score inversé (100 = très humain, 0 = très IA)
    const humanScore = Math.max(0, 100 - detectionScore);

    return {
      score: humanScore,
      issues,
    };
  }
}
