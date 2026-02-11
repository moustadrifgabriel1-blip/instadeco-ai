/**
 * API Route: /api/v2/blog/check-cron
 * 
 * Endpoint de diagnostic pour vérifier la configuration du cron job
 * et les dernières tentatives de génération d'articles.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // 🔒 Protéger cet endpoint de diagnostic par CRON_SECRET
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    // Vérification des variables d'environnement
    const envCheck = {
      supabaseUrl: !!supabaseUrl,
      supabaseServiceKey: !!supabaseServiceKey,
      geminiKey: !!geminiKey,
      geminiKeyLength: geminiKey?.length || 0,
      cronSecret: !!cronSecret,
      cronSecretLength: cronSecret?.length || 0,
    };

    // Récupérer les derniers articles
    let recentArticles: any[] = [];
    let articleError: string | null = null;

    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        const { data, error } = await supabase
          .from('blog_articles')
          .select('id, title, slug, status, created_at, published_at, source')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          articleError = error.message;
        } else {
          recentArticles = data || [];
        }
      } catch (e) {
        articleError = e instanceof Error ? e.message : 'Unknown error';
      }
    }

    // Test de disponibilité Gemini
    let geminiStatus = 'not_tested';
    if (geminiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash?key=${geminiKey}`,
          { method: 'GET' }
        );
        geminiStatus = response.ok ? 'available' : `error_${response.status}`;
      } catch (e) {
        geminiStatus = 'connection_failed';
      }
    }

    // Statistiques des articles
    const today = new Date();
    const articlesThisWeek = recentArticles.filter(a => {
      const createdAt = new Date(a.created_at);
      const diffDays = (today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    });

    const lastArticle = recentArticles[0];
    const daysSinceLastArticle = lastArticle
      ? Math.floor((today.getTime() - new Date(lastArticle.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      gemini: {
        status: geminiStatus,
      },
      articles: {
        total: recentArticles.length,
        thisWeek: articlesThisWeek.length,
        daysSinceLastArticle,
        lastArticle: lastArticle ? {
          title: lastArticle.title,
          createdAt: lastArticle.created_at,
          status: lastArticle.status,
          source: lastArticle.source,
        } : null,
        recent: recentArticles.slice(0, 5).map(a => ({
          title: a.title.substring(0, 50) + (a.title.length > 50 ? '...' : ''),
          createdAt: a.created_at,
          status: a.status,
        })),
        error: articleError,
      },
      recommendations: [
        !geminiKey && '⚠️ GEMINI_API_KEY non configurée',
        !cronSecret && '⚠️ CRON_SECRET non configuré',
        geminiStatus !== 'available' && geminiKey && '⚠️ Gemini API indisponible ou clé invalide',
        daysSinceLastArticle && daysSinceLastArticle > 2 && `⚠️ Aucun article depuis ${daysSinceLastArticle} jours`,
      ].filter(Boolean),
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
