/**
 * API Route: /api/blog-health
 * 
 * Endpoint de monitoring pour vérifier l'état de la génération d'articles blog.
 * Retourne le statut du dernier article, l'ancienneté, et un signal d'alerte.
 * 
 * Public : accessible sans authentification pour le monitoring externe (UptimeRobot, etc.)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const revalidate = 0;

// Seuil d'alerte : si aucun article n'a été publié depuis X heures
const ALERT_THRESHOLD_HOURS = 48;

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Récupérer le dernier article publié
    const { data: lastArticle, error } = await supabase
      .from('blog_articles')
      .select('id, title, created_at, status, word_count')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`DB error: ${error.message}`);
    }

    // Compter le total d'articles
    const { count: totalArticles } = await supabase
      .from('blog_articles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published');

    const now = new Date();
    let hoursSinceLastArticle: number | null = null;
    let isHealthy = true;
    let alertMessage: string | null = null;

    if (lastArticle) {
      const lastArticleDate = new Date(lastArticle.created_at);
      hoursSinceLastArticle = Math.round(
        (now.getTime() - lastArticleDate.getTime()) / (1000 * 60 * 60)
      );

      if (hoursSinceLastArticle > ALERT_THRESHOLD_HOURS) {
        isHealthy = false;
        alertMessage = `⚠️ Aucun article depuis ${hoursSinceLastArticle}h (seuil: ${ALERT_THRESHOLD_HOURS}h). Vérifier le cron /api/cron/generate-articles et les var d'env Vercel (GEMINI_API_KEY, CRON_SECRET).`;
      }
    } else {
      isHealthy = false;
      alertMessage = '⚠️ Aucun article publié en base de données.';
    }

    const response = {
      status: isHealthy ? 'ok' : 'degraded',
      blog: {
        totalArticles: totalArticles ?? 0,
        lastArticle: lastArticle
          ? {
              id: lastArticle.id,
              title: lastArticle.title,
              publishedAt: lastArticle.created_at,
              hoursSince: hoursSinceLastArticle,
              wordCount: lastArticle.word_count,
            }
          : null,
      },
      cron: {
        schedule: '3× par jour (6h, 12h, 18h UTC)',
        nextExpected: lastArticle
          ? `Prochain article dans ~${Math.max(0, 8 - (hoursSinceLastArticle ?? 0))}h max`
          : 'Inconnu',
        alertThresholdHours: ALERT_THRESHOLD_HOURS,
      },
      alert: alertMessage,
      checkedAt: now.toISOString(),
    };

    // HTTP 200 si sain, 503 si dégradé (pour les moniteurs de disponibilité)
    return NextResponse.json(response, {
      status: isHealthy ? 200 : 503,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json(
      {
        status: 'error',
        error: errorMessage,
        alert: `❌ Erreur système: ${errorMessage}`,
        checkedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
