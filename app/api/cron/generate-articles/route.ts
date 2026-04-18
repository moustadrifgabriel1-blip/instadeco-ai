/**
 * API Route: /api/cron/generate-articles
 * 
 * Endpoint appelé par Vercel Cron pour générer automatiquement un article SEO.
 * Exécuté 3 fois par jour (6h, 12h, 18h).
 * 
 * Sécurisé par CRON_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SupabaseBlogArticleRepository } from '@/src/infrastructure/repositories/SupabaseBlogArticleRepository';
import { GeminiAIContentService } from '@/src/infrastructure/services/GeminiAIContentService';
import { SEONotificationService } from '@/src/infrastructure/services/SEONotificationService';
import { AntiAIPostProcessor } from '@/src/infrastructure/services/AntiAIPostProcessor';
import { InternalLinksService } from '@/src/infrastructure/services/InternalLinksService';
import { selectRandomTheme, BLOG_THEMES, getSessionTypeFromTime } from '@/src/shared/constants/blog-themes';
import { createBlogArticle, generateSlug } from '@/src/domain/entities/BlogArticle';

export const runtime = 'nodejs';
export const maxDuration = 300; // 300s max (Pro plan Vercel) — génération peut prendre 20-60s

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
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Vercel peut aussi émettre vers des routes via x-vercel-signature (v2)
  const vercelSignature = request.headers.get('x-vercel-signature');
  if (vercelSignature) {
    // Si Vercel gère la signature, on fait aussi confiance
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

    // 6. Générer le contenu via IA (2000+ mots pour un contenu substantiel)
    const generatedContent = await aiService.generateArticle({
      theme: selectedTheme.primaryKeyword,
      sessionType: getSessionTypeFromTime(),
      minWords: 2000,
      temperature: 0.75,
      additionalInstructions: `Mots-clés secondaires à intégrer: ${selectedTheme.secondaryKeywords.join(', ')}. Type de contenu: ${selectedTheme.themeType}. Cible: ${selectedTheme.targetCountry === 'ALL' ? 'Suisse, France, Belgique' : selectedTheme.targetCountry}. IMPORTANT: Inclure des prix réels de produits (IKEA, Maisons du Monde, La Redoute), des dimensions concrètes, et au moins 1 tableau comparatif HTML. Le titre doit être EVERGREEN (pas de date). Chaque conseil doit être ACTIONNABLE immédiatement.

⚠️ TITRES INTERDITS — Ces titres existent déjà sur notre blog. Ton titre doit être COMPLÈTEMENT DIFFÉRENT (angle différent, formulation différente, accroche différente). NE REPRENDS AUCUN de ces titres ni même une formulation proche :
${titlesToAvoid}

Crée un titre avec un ANGLE UNIQUE : chiffre précis, question provocante, formule originale, erreur à éviter, secret de pro, etc.`,
    });

    // 7. Post-traitement anti-AI
    const antiAIResult = await antiAIProcessor.process(generatedContent.content);
    console.log(`Cron: Score anti-AI: ${antiAIResult.score}/100`);

    // 8. Ajouter les liens internes
    const linkResult = await linksService.addInternalLinks(
      antiAIResult.content,
      undefined,
      selectedTheme.themeType,
      5
    );
    console.log(`Cron: ${linkResult.linksAdded} liens internes ajoutés`);

    // 9. Créer l'entité article
    let slug = generateSlug(generatedContent.title);
    let finalTitle = generatedContent.title;
    
    // 9.1 Vérifier que le titre n'est pas trop similaire à un titre existant
    const titleIsSimilar = await repository.titleExistsSimilar(finalTitle, 90);
    if (titleIsSimilar) {
      console.warn(`Cron: Titre trop similaire détecté: "${finalTitle}"`);
      // Ajouter un préfixe unique pour le différencier
      const prefixes = ['Le Guide Pro :', 'Secrets de Déco :', 'Astuces Maison :', 'Nos Conseils :', 'Inspiration :', 'L\'Essentiel :'];
      const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      finalTitle = `${randomPrefix} ${finalTitle}`;
      slug = generateSlug(finalTitle);
      console.log(`Cron: Titre renommé en: "${finalTitle}"`);
    }
    
    // 9.2 Vérifier que le slug n'existe pas déjà
    const existingArticle = await repository.findBySlug(slug);
    if (existingArticle) {
      // Ajouter un suffixe unique pour éviter le conflit
      const suffix = Date.now().toString(36);
      slug = `${slug}-${suffix}`;
      console.warn(`Cron: Slug en doublon détecté, renommé en "${slug}"`);
    }
    
    const article = createBlogArticle({
      id: crypto.randomUUID(),
      title: finalTitle,
      slug: slug,
      content: linkResult.content,
      metaDescription: generatedContent.metaDescription,
      tags: generatedContent.tags,
      sessionType: getSessionTypeFromTime(),
      antiAIScore: Math.round(antiAIResult.score),
      source: 'automation',
    });

    // 10. Sauvegarder dans la base
    const savedArticle = await repository.save(article);

    // 11. Notifier les moteurs de recherche
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://instadeco.app';
    const articleUrl = `${siteUrl}/blog/${savedArticle.slug}`;
    
    const seoResults = await seoService.notifyAll(articleUrl);
    const successfulNotifications = seoResults.filter((r) => r.success).length;
    console.log(`Cron: ${successfulNotifications}/${seoResults.length} notifications SEO réussies`);

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      article: {
        id: savedArticle.id,
        title: savedArticle.title,
        slug: savedArticle.slug,
        url: articleUrl,
        wordCount: savedArticle.wordCount,
        antiAiScore: antiAIResult.score,
      },
      seo: {
        notified: successfulNotifications,
        total: seoResults.length,
        results: seoResults,
      },
      processing: {
        linksAdded: linkResult.linksAdded,
        modifications: antiAIResult.modifications.slice(0, 5),
      },
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
    const { theme } = body;

    if (!theme) {
      return NextResponse.json(
        { error: 'Le paramètre "theme" est requis' },
        { status: 400 }
      );
    }

    // Initialiser les services
    const repository = new SupabaseBlogArticleRepository();
    const aiService = new GeminiAIContentService();

    // Générer le contenu via IA
    const generatedContent = await aiService.generateArticle({
      theme,
      sessionType: getSessionTypeFromTime(),
      minWords: 1200,
    });

    // Créer l'entité article
    const slug = generateSlug(generatedContent.title);
    
    const article = createBlogArticle({
      id: crypto.randomUUID(),
      title: generatedContent.title,
      slug: slug,
      content: generatedContent.content,
      metaDescription: generatedContent.metaDescription,
      tags: generatedContent.tags,
      sessionType: getSessionTypeFromTime(),
      source: 'manual',
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
