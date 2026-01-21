/**
 * API Route: /api/blog/notify-seo
 * 
 * Endpoint pour déclencher manuellement les notifications SEO.
 * Utile après des modifications ou pour rattraper des échecs.
 * 
 * Sécurisé par CRON_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SupabaseBlogArticleRepository } from '@/src/infrastructure/repositories/SupabaseBlogArticleRepository';
import { SEONotificationService } from '@/src/infrastructure/services/SEONotificationService';
import { verifyCronAuth, unauthorizedResponse } from '@/src/infrastructure/middleware/cronAuth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  // Vérifier l'authentification
  const { authorized, error } = verifyCronAuth(request);
  if (!authorized) {
    return unauthorizedResponse(error);
  }

  try {
    const body = await request.json();
    const { slug, notifyAll } = body;

    const repository = new SupabaseBlogArticleRepository();
    const seoService = new SEONotificationService();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://instadeco.app';

    // Mode 1: Notifier un article spécifique
    if (slug) {
      const article = await repository.findBySlug(slug);
      if (!article) {
        return NextResponse.json(
          { success: false, error: 'Article non trouvé' },
          { status: 404 }
        );
      }

      const url = `${siteUrl}/blog/${article.slug}`;
      const results = await seoService.notifyAll(url);

      return NextResponse.json({
        success: true,
        article: { id: article.id, slug: article.slug },
        seo: results,
      });
    }

    // Mode 2: Notifier tous les articles récents non notifiés
    if (notifyAll) {
      const { data: articles } = await repository.findMany(
        { status: 'published' },
        { limit: 10, sortBy: 'publishedAt', sortOrder: 'desc' }
      );

      const urls = articles.map((a) => `${siteUrl}/blog/${a.slug}`);
      const batchResult = await seoService.notifyBatch(urls);

      // Ping également le sitemap
      const sitemapResult = await seoService.pingGoogle(`${siteUrl}/sitemap.xml`);

      return NextResponse.json({
        success: true,
        articlesNotified: articles.length,
        batchResult,
        sitemapResult,
      });
    }

    // Mode 3: Juste ping le sitemap
    const googleResult = await seoService.pingGoogle();
    const bingResult = await seoService.pingBing();

    return NextResponse.json({
      success: true,
      sitemap: {
        google: googleResult,
        bing: bingResult,
      },
    });

  } catch (error) {
    console.error('API notify-seo error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}

// GET pour vérifier le statut du service
export async function GET(request: NextRequest) {
  const seoService = new SEONotificationService();
  
  return NextResponse.json({
    success: true,
    configured: seoService.isConfigured(),
    indexNowKey: process.env.INDEXNOW_KEY ? 'configured' : 'missing',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'not set',
  });
}
