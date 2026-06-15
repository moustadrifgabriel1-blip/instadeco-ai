/**
 * API Route: /api/cron/generate-articles
 * 
 * Endpoint appelé par Vercel Cron pour générer automatiquement un article SEO.
 * Exécuté 3 fois par jour (6h, 12h, 18h).
 * 
 * Sécurisé par CRON_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SupabaseBlogArticleRepository } from '@/src/infrastructure/repositories/supabase/SupabaseBlogArticleRepository';
import { GeminiAIContentService } from '@/src/infrastructure/services/GeminiAIContentService';
import { SEONotificationService } from '@/src/infrastructure/services/SEONotificationService';
import { AntiAIPostProcessor } from '@/src/infrastructure/services/AntiAIPostProcessor';
import { InternalLinksService } from '@/src/infrastructure/services/InternalLinksService';
import { selectRandomTheme, BLOG_THEMES, getSessionTypeFromTime } from '@/src/shared/constants/blog-themes';
import { createBlogArticle, generateSlug, ARTICLE_LANGUAGES, type ArticleLanguage } from '@/src/domain/entities/BlogArticle';

export const runtime = 'nodejs';
export const maxDuration = 60; // aligné sur le plafond réel de vercel.json (60s) — génération peut prendre 20-60s

/**
 * Vérifie le secret CRON (Vercel ou manuel)
 */
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[CRON] CRON_SECRET non configuré dans les variables d\'environnement Vercel !');
    return false;
  }

  // Vercel envoie le secret dans le header Authorization: Bearer <CRON_SECRET>
  // (fourni automatiquement par Vercel Cron quand CRON_SECRET est défini en env var).
  // NOTE: on ne fait PAS confiance à la simple présence de x-vercel-signature
  // (header spoofable → bypass d'auth + coût IA déclenché par un tiers).
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  console.error('[CRON] Auth échouée - secret invalide. Header reçu:', authHeader?.substring(0, 20) ?? 'null');
  return false;
}

/**
 * Envoie une alerte en cas d'échec du cron via Slack ou simple log
 */
async function sendCronFailureAlert(error: string, durationMs: number): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://instadeco.app';
  
  const message = `⚠️ *Cron Blog échoué* sur ${siteUrl}\n⏱ Durée: ${Math.round(durationMs / 1000)}s\n❌ Erreur: ${error}\n→ Vérifier: GEMINI_API_KEY, CRON_SECRET dans Vercel env vars`;
  
  console.error('[CRON ALERT]', message);
  
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message, content: message }),
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      // Ne pas faire échouer le cron à cause de l'alerte
    }
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // 1. Vérifier l'authentification
  if (!verifyCronSecret(request)) {
    console.error('Cron: Accès non autorisé');
    return NextResponse.json(
      { error: 'Non autorisé' },
      { status: 401 }
    );
  }

  try {
    // 2. Initialiser les services
    const repository = new SupabaseBlogArticleRepository();
    const aiService = new GeminiAIContentService();
    const seoService = new SEONotificationService();
    const antiAIProcessor = new AntiAIPostProcessor();
    const linksService = new InternalLinksService(repository);

    // 3. Vérifier que l'IA est disponible
    const aiAvailable = await aiService.isAvailable();
    if (!aiAvailable) {
      console.error('Cron: Service IA non disponible');
      return NextResponse.json(
        { error: 'Service IA non disponible', details: 'GEMINI_API_KEY manquante ou invalide' },
        { status: 503 }
      );
    }

    // 4. Récupérer les articles récents pour l'anti-cannibalisation
    const { data: recentArticles } = await repository.findMany(
      { status: 'published' },
      { limit: 80, sortBy: 'publishedAt', sortOrder: 'desc' }
    );
    const recentTitles = recentArticles.map((a) => a.title);

    // Anti-cannibalisation renforcée :
    // Construire un index des "empreintes sémantiques" des articles récents
    // = tous les mots significatifs des titres + tags des 60 derniers articles
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .trim();

    const stopWords = new Set([
      'le','la','les','de','du','des','un','une','et','en','au','aux','a',
      'sur','dans','pour','par','avec','sans','son','sa','ses','ce','cette',
      'ces','est','sont','nos','votre','vos','mon','ma','mes','tout','tous',
      'comment','faire','guide','idee','idees','conseils','astuces','top',
      'nos','meilleures','meilleur','meilleure','style','interieur',
    ]);

    // Extraire les mots-clés significatifs de chaque article récent
    const recentKeywordSets: Set<string>[] = recentArticles.slice(0, 60).map((a) => {
      const words = new Set<string>();
      // Mots du titre
      normalize(a.title).split(/\s+/).forEach((w) => { if (w.length >= 4 && !stopWords.has(w)) words.add(w); });
      // Tags
      a.tags.forEach((t) => { normalize(t).split(/\s+/).forEach((w) => { if (w.length >= 4 && !stopWords.has(w)) words.add(w); }); });
      return words;
    });

    // Fonction de détection de cannibalisation : compare un thème avec les articles récents
    // Retourne true si le thème est trop similaire à un article existant (>= 50% d'overlap)
    const isCannibalizing = (theme: { primaryKeyword: string; secondaryKeywords: string[] }): boolean => {
      const themeWords = new Set<string>();
      normalize(theme.primaryKeyword).split(/\s+/).forEach((w) => { if (w.length >= 4 && !stopWords.has(w)) themeWords.add(w); });
      theme.secondaryKeywords.slice(0, 3).forEach((kw) =>
        normalize(kw).split(/\s+/).forEach((w) => { if (w.length >= 4 && !stopWords.has(w)) themeWords.add(w); })
      );
      if (themeWords.size === 0) return false;
      for (const recentSet of recentKeywordSets) {
        const overlap = [...themeWords].filter((w) => recentSet.has(w)).length;
        if (overlap / themeWords.size >= 0.5) return true; // >= 50% des mots du thème sont dans un article récent
      }
      return false;
    };

    // Pour compatibilité avec selectRandomTheme, passer les primaryKeywords des thèmes cannibalisants
    const usedKeywords = BLOG_THEMES
      .filter((t) => isCannibalizing(t))
      .map((t) => t.primaryKeyword);

    console.log(`Cron: ${usedKeywords.length}/${BLOG_THEMES.length} thèmes exclus (cannibalisation)`);

    // 5. Sélectionner un thème aléatoire non utilisé
    let selectedTheme = selectRandomTheme(usedKeywords);
    if (!selectedTheme) {
      console.warn('Cron: Tous les thèmes ont été utilisés récemment');
      // Fallback: prendre un thème prioritaire au hasard
      const priorityThemes = BLOG_THEMES.filter((t) => t.priority === 1);
      selectedTheme = priorityThemes[Math.floor(Math.random() * priorityThemes.length)];
      if (!selectedTheme) {
        return NextResponse.json(
          { error: 'Aucun thème disponible' },
          { status: 500 }
        );
      }
    }

    console.log(`Cron: Génération article pour "${selectedTheme.primaryKeyword}"`);

    // 5.1 Construire la liste des titres récents à éviter pour le prompt
    const titlesToAvoid = recentTitles.slice(0, 20).map((t) => `- "${t}"`).join('\n');
    const sessionType = getSessionTypeFromTime();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://instadeco.app';

    // 6. BLOG MULTILINGUE — choix de(s) langue(s) à générer.
    //    Chaque langue est un article distinct (slug unique par langue), ce qui élimine
    //    le duplicate content sous /en et /de.
    //
    //    ⚠️ Contrainte budget : vercel.json plafonne cette function à maxDuration=60s
    //    (règle coût ≤10.-/mois). Or 1 génération gemini-2.5-pro ≈ 60-120s. Générer les
    //    3 langues en une invocation dépasserait largement 60s.
    //    → Approche par défaut : ROTATION d'une langue par exécution. Le cron tourne 1×/j
    //      (vercel.json : "0 6 * * *") : on alterne donc la langue d'un jour à l'autre via
    //      le numéro de jour (J1→fr, J2→en, J3→de, J4→fr…). Sur 3 jours on couvre les 3
    //      langues, sans jamais dépasser le budget temps de 60s.
    //    → Override possible : ?languages=fr,en,de (ou ?languages=all) pour tout générer
    //      en une fois (utile en test manuel avec un maxDuration relevé).
    const { searchParams } = new URL(request.url);
    const langParam = searchParams.get('languages');

    let languagesToGenerate: ArticleLanguage[];
    if (langParam === 'all') {
      languagesToGenerate = [...ARTICLE_LANGUAGES];
    } else if (langParam) {
      languagesToGenerate = langParam
        .split(',')
        .map((l) => l.trim())
        .filter((l): l is ArticleLanguage => (ARTICLE_LANGUAGES as string[]).includes(l));
      if (languagesToGenerate.length === 0) languagesToGenerate = ['fr'];
    } else {
      // Rotation par jour : indexe ARTICLE_LANGUAGES via le numéro de jour (jour julien
      // approximatif), pour alterner la langue à chaque exécution quotidienne du cron.
      const now = new Date();
      const dayNumber = Math.floor(now.getTime() / 86_400_000); // jours depuis epoch
      const idx = dayNumber % ARTICLE_LANGUAGES.length;
      languagesToGenerate = [ARTICLE_LANGUAGES[idx]];
    }

    console.log(`Cron: langues à générer = [${languagesToGenerate.join(', ')}]`);

    const generateForLanguage = async (language: ArticleLanguage) => {
      // 6.a Générer le contenu via IA dans la langue cible
      const generatedContent = await aiService.generateArticle({
        theme: selectedTheme!.primaryKeyword,
        targetLanguage: language,
        sessionType,
        minWords: 2000,
        temperature: 0.75,
        additionalInstructions: `Mots-clés secondaires à intégrer: ${selectedTheme!.secondaryKeywords.join(', ')}. Type de contenu: ${selectedTheme!.themeType}. Cible: ${selectedTheme!.targetCountry === 'ALL' ? 'Suisse, France, Belgique' : selectedTheme!.targetCountry}. IMPORTANT: Inclure des prix réels de produits (IKEA, Maisons du Monde, La Redoute), des dimensions concrètes, et au moins 1 tableau comparatif HTML. Le titre doit être EVERGREEN (pas de date). Chaque conseil doit être ACTIONNABLE immédiatement.

⚠️ TITRES INTERDITS — Ces titres existent déjà sur notre blog. Ton titre doit être COMPLÈTEMENT DIFFÉRENT (angle différent, formulation différente, accroche différente). NE REPRENDS AUCUN de ces titres ni même une formulation proche :
${titlesToAvoid}

Crée un titre avec un ANGLE UNIQUE : chiffre précis, question provocante, formule originale, erreur à éviter, secret de pro, etc.`,
      });

      // 6.b Post-traitement anti-AI
      const antiAIResult = await antiAIProcessor.process(generatedContent.content);

      // 6.c Ajouter les liens internes
      const linkResult = await linksService.addInternalLinks(
        antiAIResult.content,
        undefined,
        selectedTheme!.themeType,
        5
      );

      // 6.d Créer l'entité article (slug unique PAR langue)
      let slug = generateSlug(generatedContent.title);
      const finalTitle = generatedContent.title;

      // Vérifier que le slug n'existe pas déjà DANS CETTE LANGUE
      const slugTaken = await repository.slugExists(slug, language);
      if (slugTaken) {
        const suffix = Date.now().toString(36);
        slug = `${slug}-${suffix}`;
        console.warn(`Cron[${language}]: Slug en doublon détecté, renommé en "${slug}"`);
      }

      const article = createBlogArticle({
        id: crypto.randomUUID(),
        title: finalTitle,
        slug,
        content: linkResult.content,
        metaDescription: generatedContent.metaDescription,
        tags: generatedContent.tags,
        sessionType,
        antiAIScore: Math.round(antiAIResult.score),
        source: 'automation',
        language,
      });

      const savedArticle = await repository.save(article);

      // 6.e Notifier les moteurs de recherche (URL localisée)
      const articleUrl = `${siteUrl}/${language}/blog/${savedArticle.slug}`;
      const seoResults = await seoService.notifyAll(articleUrl);
      const successfulNotifications = seoResults.filter((r) => r.success).length;

      console.log(`Cron[${language}]: article "${savedArticle.title}" → ${successfulNotifications}/${seoResults.length} notifications SEO`);

      return {
        language,
        id: savedArticle.id,
        title: savedArticle.title,
        slug: savedArticle.slug,
        url: articleUrl,
        wordCount: savedArticle.wordCount,
        antiAiScore: Math.round(antiAIResult.score),
        linksAdded: linkResult.linksAdded,
        seoNotified: successfulNotifications,
        seoTotal: seoResults.length,
      };
    };

    const articles: Array<Awaited<ReturnType<typeof generateForLanguage>>> = [];
    const errors: Array<{ language: ArticleLanguage; error: string }> = [];

    for (const language of languagesToGenerate) {
      try {
        articles.push(await generateForLanguage(language));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur inconnue';
        console.error(`[CRON][${language}] ❌ Échec génération:`, msg);
        errors.push({ language, error: msg });
      }
    }

    // Si AUCUNE langue n'a abouti, considérer l'exécution comme un échec.
    if (articles.length === 0) {
      throw new Error(`Aucun article généré (toutes langues en échec): ${errors.map((e) => `${e.language}=${e.error}`).join(' | ')}`);
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      theme: selectedTheme.primaryKeyword,
      languagesGenerated: articles.map((a) => a.language),
      articles,
      errors,
      duration: `${duration}ms`,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    const duration = Date.now() - startTime;
    console.error('[CRON] ❌ Erreur génération article:', errorMessage, `(durée: ${Math.round(duration / 1000)}s)`);
    
    // Envoyer une alerte pour détecter les pannes silencieuses
    await sendCronFailureAlert(errorMessage, duration).catch(() => {});
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        hint: 'Vérifier GEMINI_API_KEY et CRON_SECRET dans Vercel Environment Variables',
      },
      { status: 500 }
    );
  }
}

// POST pour tests manuels avec paramètres
export async function POST(request: NextRequest) {
  // Vérifier l'authentification
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { theme, language: rawLanguage } = body;

    if (!theme) {
      return NextResponse.json(
        { error: 'Le paramètre "theme" est requis' },
        { status: 400 }
      );
    }

    // Langue cible optionnelle (fr par défaut). Valider contre la liste autorisée.
    const language: ArticleLanguage = ARTICLE_LANGUAGES.includes(rawLanguage)
      ? rawLanguage
      : 'fr';

    // Initialiser les services
    const repository = new SupabaseBlogArticleRepository();
    const aiService = new GeminiAIContentService();

    // Générer le contenu via IA dans la langue cible
    const generatedContent = await aiService.generateArticle({
      theme,
      targetLanguage: language,
      sessionType: getSessionTypeFromTime(),
      minWords: 1200,
    });

    // Créer l'entité article (slug unique par langue)
    let slug = generateSlug(generatedContent.title);
    if (await repository.slugExists(slug, language)) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const article = createBlogArticle({
      id: crypto.randomUUID(),
      title: generatedContent.title,
      slug: slug,
      content: generatedContent.content,
      metaDescription: generatedContent.metaDescription,
      tags: generatedContent.tags,
      sessionType: getSessionTypeFromTime(),
      source: 'manual',
      language,
    });

    // Sauvegarder dans la base
    const savedArticle = await repository.save(article);

    return NextResponse.json({
      success: true,
      article: {
        id: savedArticle.id,
        title: savedArticle.title,
        slug: savedArticle.slug,
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
