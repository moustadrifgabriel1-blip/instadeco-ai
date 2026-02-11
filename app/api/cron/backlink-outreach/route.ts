/**
 * API Cron: Backlink Outreach Automation
 * 
 * Tâche automatique hebdomadaire qui:
 * 1. Génère des pitchs personnalisés pour les prospects prioritaires
 * 2. Génère des brouillons d'articles invités
 * 3. Exporte les pitchs prêts dans un fichier Markdown (Supabase Storage)
 * 4. Envoie une notification email avec le rapport + lien du fichier
 * 
 * Cron: Tous les lundis à 8h du matin (UTC)
 */

import { NextResponse } from 'next/server';
import { BacklinkOutreachService } from '@/lib/seo/backlink-outreach';
import { generateAndStoreReport } from '@/lib/notifications/backlink-report';
import { sendBacklinkReport } from '@/lib/notifications/email';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // Vérifier l'autorisation (cron Vercel uniquement)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = {
      seedResult: null as { inserted: number; skipped: number } | null,
      pitchesGenerated: 0,
      articlesGenerated: 0,
      reportExported: false,
      emailSent: false,
      fileUrl: null as string | null,
      nextActions: null as {
        needPitch: number;
        readyToContact: number;
        needFollowUp: number;
      } | null,
      pipelineStats: null as Record<string, number> | null,
    };

    // 1. Seed des prospects si pas encore fait
    try {
      results.seedResult = await BacklinkOutreachService.seedProspects();
      console.log(`[Backlink Cron] Seed: ${results.seedResult.inserted} inserted, ${results.seedResult.skipped} skipped`);
    } catch (e) {
      console.error('[Backlink Cron] Seed error:', e);
    }

    // 2. Générer des pitchs pour les 5 prospects prioritaires sans pitch
    try {
      results.pitchesGenerated = await BacklinkOutreachService.batchGeneratePitches(5);
      console.log(`[Backlink Cron] Generated ${results.pitchesGenerated} pitches`);
    } catch (e) {
      console.error('[Backlink Cron] Pitch generation error:', e);
    }

    // 3. Générer un article invité pour le prospect le plus prioritaire sans article
    try {
      const { prospects } = await BacklinkOutreachService.getPipeline();
      const needArticle = prospects.find(
        p => p.pitch_generated && !p.article_draft && p.status === 'prospect'
      );
      if (needArticle && needArticle.id) {
        await BacklinkOutreachService.generateArticleDraft(needArticle.id);
        results.articlesGenerated = 1;
        console.log(`[Backlink Cron] Generated article draft for: ${needArticle.site_name}`);
      }
    } catch (e) {
      console.error('[Backlink Cron] Article generation error:', e);
    }

    // 4. Exporter le rapport dans un fichier Markdown + Supabase Storage
    try {
      const report = await generateAndStoreReport();
      results.reportExported = true;
      results.fileUrl = report.fileUrl;
      results.nextActions = {
        needPitch: (await BacklinkOutreachService.getNextActions()).needPitch.length,
        readyToContact: report.readyToContact.length,
        needFollowUp: report.needFollowUp.length,
      };
      results.pipelineStats = report.pipelineStats;
      console.log(`[Backlink Cron] Report exported: ${report.readyToContact.length} ready, file: ${report.fileUrl ? 'yes' : 'no'}`);

      // 5. Envoyer la notification email
      try {
        const emailResult = await sendBacklinkReport({
          totalProspects: report.totalProspects,
          pipelineStats: report.pipelineStats,
          pitchesGenerated: results.pitchesGenerated,
          articlesGenerated: results.articlesGenerated,
          readyToContact: report.readyToContact,
          needFollowUp: report.needFollowUp,
          fileUrl: report.fileUrl ?? undefined,
          markdownContent: report.markdownContent,
        });
        results.emailSent = emailResult.success;
        if (emailResult.success) {
          console.log('[Backlink Cron] Email notification sent successfully');
        } else {
          console.warn('[Backlink Cron] Email not sent:', emailResult.error);
        }
      } catch (emailErr) {
        console.error('[Backlink Cron] Email send error:', emailErr);
      }
    } catch (e) {
      console.error('[Backlink Cron] Report export error:', e);
      
      // Fallback: récupérer les stats même si l'export échoue
      try {
        const actions = await BacklinkOutreachService.getNextActions();
        results.nextActions = {
          needPitch: actions.needPitch.length,
          readyToContact: actions.readyToContact.length,
          needFollowUp: actions.needFollowUp.length,
        };
        const pipeline = await BacklinkOutreachService.getPipeline();
        results.pipelineStats = pipeline.stats;
      } catch (statsErr) {
        console.error('[Backlink Cron] Pipeline stats error:', statsErr);
      }
    }

    console.log('[Backlink Cron] Weekly report:', JSON.stringify(results, null, 2));

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error('[Backlink Cron] Fatal error:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
