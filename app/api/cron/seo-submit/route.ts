/**
 * API Cron: SEO Auto-Submit
 * 
 * Tâche automatique qui soumet les nouvelles URLs et vérifie l'indexation.
 * S'exécute quotidiennement via Vercel Cron.
 * 
 * Stratégie:
 * 1. Soumet toutes les URLs nouvelles/modifiées via IndexNow
 * 2. Ping Google & Bing avec le sitemap
 * 3. Log les résultats pour monitoring
 * 
 * Cron: Tous les jours à 3h du matin (UTC)
 */

import { NextResponse } from 'next/server';
import { SEO_CONFIG } from '@/lib/seo/config';
import { STYLE_SEO_DATA, ROOM_SEO_DATA } from '@/lib/seo/programmatic-data';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

// Vérification du secret CRON
function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.error('[CRON seo-submit] CRON_SECRET non configuré');
    return false;
  }
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Array<{ action: string; success: boolean; detail?: string }> = [];
  const BASE_URL = SEO_CONFIG.siteUrl;

  try {
    // ============================================
    // 1. Collecter TOUTES les URLs du site
    // ============================================
    const allUrls: string[] = [
      // Pages statiques
      BASE_URL,
      `${BASE_URL}/generate`,
      `${BASE_URL}/pricing`,
      `${BASE_URL}/exemples`,
      `${BASE_URL}/blog`,
      `${BASE_URL}/architecte-interieur`,
      
      // Pages styles programmatiques
      ...STYLE_SEO_DATA.map((s) => `${BASE_URL}/style/${s.slug}`),
      
      // Pages pièces programmatiques
      ...ROOM_SEO_DATA.map((r) => `${BASE_URL}/piece/${r.slug}`),
    ];

    // Ajouter les pages villes
    try {
      const { CITIES } = await import('@/src/shared/constants/cities');
      CITIES.forEach((city) => {
        allUrls.push(`${BASE_URL}/architecte-interieur/${city.slug}`);
      });
    } catch (e) {
      results.push({ action: 'load_cities', success: false, detail: (e as Error).message });
    }

    // Ajouter les articles de blog
    try {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();
      
      const { data: articles } = await supabase
        .from('blog_articles')
        .select('slug, updated_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(500);

      if (articles) {
        articles.forEach((article) => {
          allUrls.push(`${BASE_URL}/blog/${article.slug}`);
        });
        results.push({ action: 'load_blog_articles', success: true, detail: `${articles.length} articles` });
      }
    } catch (e) {
      results.push({ action: 'load_blog_articles', success: false, detail: (e as Error).message });
    }

    // ============================================
    // 2. IndexNow - Batch submission
    // ============================================
    const indexNowKey = SEO_CONFIG.indexNowKey;
    if (indexNowKey) {
      const BATCH_SIZE = 10000; // IndexNow supporte jusqu'à 10k URLs par requête
      
      for (let i = 0; i < allUrls.length; i += BATCH_SIZE) {
        const batch = allUrls.slice(i, i + BATCH_SIZE);
        
        try {
          const response = await fetch('https://api.indexnow.org/indexnow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              host: new URL(BASE_URL).host,
              key: indexNowKey,
              keyLocation: `${BASE_URL}/${indexNowKey}.txt`,
              urlList: batch,
            }),
          });

          results.push({
            action: `indexnow_batch_${Math.floor(i / BATCH_SIZE) + 1}`,
            success: response.ok || response.status === 202,
            detail: `${batch.length} URLs, status ${response.status}`,
          });
        } catch (e) {
          results.push({
            action: `indexnow_batch_${Math.floor(i / BATCH_SIZE) + 1}`,
            success: false,
            detail: (e as Error).message,
          });
        }
      }
    } else {
      results.push({ action: 'indexnow', success: false, detail: 'INDEXNOW_KEY not configured' });
    }

    // ============================================
    // 3. Ping Google Sitemap
    // ============================================
    try {
      const sitemapUrl = `${BASE_URL}/sitemap.xml`;
      const googleRes = await fetch(
        `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
        { headers: { 'User-Agent': 'InstaDeco-SEO-Bot/2.0' } }
      );
      results.push({
        action: 'google_ping',
        success: googleRes.ok,
        detail: `status ${googleRes.status}`,
      });
    } catch (e) {
      results.push({ action: 'google_ping', success: false, detail: (e as Error).message });
    }

    // ============================================
    // 4. Ping Bing Sitemap
    // ============================================
    try {
      const sitemapUrl = `${BASE_URL}/sitemap.xml`;
      const bingRes = await fetch(
        `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
        { headers: { 'User-Agent': 'InstaDeco-SEO-Bot/2.0' } }
      );
      results.push({
        action: 'bing_ping',
        success: bingRes.ok,
        detail: `status ${bingRes.status}`,
      });
    } catch (e) {
      results.push({ action: 'bing_ping', success: false, detail: (e as Error).message });
    }

    // ============================================
    // 5. Submit to Yandex (marché suisse/international)
    // ============================================
    if (indexNowKey) {
      try {
        const yandexRes = await fetch('https://yandex.com/indexnow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            host: new URL(BASE_URL).host,
            key: indexNowKey,
            keyLocation: `${BASE_URL}/${indexNowKey}.txt`,
            urlList: allUrls.slice(0, 100), // Yandex: limiter
          }),
        });
        results.push({
          action: 'yandex_indexnow',
          success: yandexRes.ok || yandexRes.status === 202,
          detail: `status ${yandexRes.status}`,
        });
      } catch (e) {
        results.push({ action: 'yandex_indexnow', success: false, detail: (e as Error).message });
      }
    }

    // ============================================
    // RÉSUMÉ
    // ============================================
    const summary = {
      timestamp: new Date().toISOString(),
      totalUrls: allUrls.length,
      successCount: results.filter((r) => r.success).length,
      failureCount: results.filter((r) => !r.success).length,
      results,
    };

    console.log('[SEO Cron] Auto-submit completed:', JSON.stringify(summary, null, 2));

    return NextResponse.json(summary, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[SEO Cron] Fatal error:', error);
    return NextResponse.json(
      { error: 'SEO cron failed', detail: (error as Error).message },
      { status: 500 }
    );
  }
}
