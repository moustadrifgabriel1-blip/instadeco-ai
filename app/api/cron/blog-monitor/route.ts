/**
 * API Route: /api/cron/blog-monitor
 * 
 * Cron de surveillance : vérifie chaque matin si les articles blog se génèrent normalement.
 * S'exécute quotidiennement à 9h UTC.
 * En cas d'anomalie, envoie une alerte Slack/Discord et tente une régénération immédiate.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 30;

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) return false;
  if (authHeader === `Bearer ${cronSecret}`) return true;

  // Vercel v2 signature
  const vercelSignature = request.headers.get('x-vercel-signature');
  return !!vercelSignature;
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Vérifier le dernier article publié
    const { data: lastArticle, error } = await supabase
      .from('blog_articles')
      .select('id, title, created_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`DB error: ${error.message}`);
    }

    const now = new Date();
    const ALERT_THRESHOLD_HOURS = 30; // Alerte si rien depuis 30h (devrait générer 3x/jour)

    if (!lastArticle) {
      await sendAlert('❌ Blog Monitor: Aucun article en base de données !', now);
      return NextResponse.json({ alert: true, reason: 'no_articles' });
    }

    const lastDate = new Date(lastArticle.created_at);
    const hoursSince = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);

    if (hoursSince > ALERT_THRESHOLD_HOURS) {
      const alertMsg = `🚨 *Blog InstaDeco — Génération bloquée !*\n• Dernier article: "${lastArticle.title}"\n• Il y a: ${Math.round(hoursSince)}h\n• Seuil: ${ALERT_THRESHOLD_HOURS}h\n\n*Actions requises:*\n1. Vérifier GEMINI_API_KEY dans Vercel env vars\n2. Vérifier CRON_SECRET dans Vercel env vars\n3. Consulter les logs Vercel → Functions → /api/cron/generate-articles\n4. Tester manuellement: POST /api/cron/generate-articles`;
      
      await sendAlert(alertMsg, now);
      
      // Tenter une régénération immédiate en appelant le cron
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://instadeco.app';
      const cronSecret = process.env.CRON_SECRET;
      
      if (cronSecret) {
        try {
          const regenResponse = await fetch(`${siteUrl}/api/cron/generate-articles`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${cronSecret}` },
            signal: AbortSignal.timeout(25000), // 25s max pour cette tentative
          });
          
          const regenData = await regenResponse.json();
          console.log('[Blog Monitor] Tentative de régénération auto:', regenResponse.status, regenData.success ? '✅' : '❌');
          
          return NextResponse.json({
            alert: true,
            reason: 'generation_blocked',
            hoursSince: Math.round(hoursSince),
            autoRegen: { attempted: true, success: regenData.success, status: regenResponse.status },
          });
        } catch (regenError) {
          console.error('[Blog Monitor] Échec régénération auto:', regenError);
        }
      }
      
      return NextResponse.json({
        alert: true,
        reason: 'generation_blocked',
        hoursSince: Math.round(hoursSince),
        autoRegen: { attempted: false },
      });
    }

    console.log(`[Blog Monitor] ✅ OK - Dernier article il y a ${Math.round(hoursSince)}h`);
    return NextResponse.json({
      alert: false,
      lastArticle: { title: lastArticle.title, hoursSince: Math.round(hoursSince) },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('[Blog Monitor] Erreur:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

async function sendAlert(message: string, now: Date): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
  console.error('[Blog Monitor ALERT]', message, 'at', now.toISOString());

  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message, content: message }),
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      // Ne pas bloquer pour une erreur de webhook
    }
  }
}
