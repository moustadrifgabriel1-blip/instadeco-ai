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
export const maxDuration = 60; // 60 secondes max pour la génération

/**
 * Vérifie le secret CRON
 */
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  console.log('[DEBUG] CRON_SECRET présent:', !!cronSecret, 'Longueur:', cronSecret?.length);
  console.log('[DEBUG] authHeader:', authHeader?.slice(0, 20) + '...');
  console.log('[DEBUG] Expected:', `Bearer ${cronSecret?.slice(0, 20)}...`);

  if (!cronSecret) {
    console.error('CRON_SECRET non configuré');
    return false;
  }

  // Vercel envoie le secret dans le header Authorization
  if (authHeader === `Bearer ${cronSecret}`) {
    console.log('[DEBUG] Auth réussie via Bearer token');
    return true;
  }

  // Alternative: query param pour tests locaux (dev only)
  if (process.env.NODE_ENV === 'development') {
    const url = new URL(request.url);
    const secretParam = url.searchParams.get('secret');
    if (secretParam === cronSecret) {
      console.log('[DEBUG] Auth réussie via query param');
      return true;
    }
  }

  console.error('[DEBUG] Auth échouée');
  return false;
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

    // 4. Récupérer les mots-clés déjà utilisés récemment
    const { data: recentArticles } = await repository.findMany(
      { status: 'published' },
      { limit: 50, sortBy: 'publishedAt', sortOrder: 'desc' }
    );
    const usedKeywords = recentArticles.flatMap((a) => a.tags);

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

    // 6. Générer le contenu via IA
    const generatedContent = await aiService.generateArticle({
      theme: selectedTheme.primaryKeyword,
      sessionType: getSessionTypeFromTime(),
      minWords: 1200,
      temperature: 0.7,
      additionalInstructions: `Mots-clés secondaires à intégrer: ${selectedTheme.secondaryKeywords.join(', ')}. Type de contenu: ${selectedTheme.themeType}. Cible: ${selectedTheme.targetCountry === 'ALL' ? 'Suisse, France, Belgique' : selectedTheme.targetCountry}.`,
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
    const slug = generateSlug(generatedContent.title);
    
    const article = createBlogArticle({
      id: crypto.randomUUID(),
      title: generatedContent.title,
      slug: slug,
      content: linkResult.content,
      metaDescription: generatedContent.metaDescription,
      tags: generatedContent.tags,
      sessionType: getSessionTypeFromTime(),
      antiAIScore: antiAIResult.score,
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
    console.error('Cron: Erreur génération article:', errorMessage);
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        timestamp: new Date().toISOString(),
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
