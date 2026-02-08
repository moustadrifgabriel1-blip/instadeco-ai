/**
 * API: Déclencher manuellement le rapport backlinks + notification email
 * 
 * POST /api/v2/backlinks/report
 * → Génère le fichier Markdown, le stocke dans Supabase Storage, envoie l'email
 * 
 * Protégé par CRON_SECRET ou mode dev
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateAndStoreReport } from '@/lib/notifications/backlink-report';
import { sendBacklinkReport } from '@/lib/notifications/email';

function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;
  if (process.env.NODE_ENV === 'development') return true;
  return false;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Générer le rapport + uploader le fichier
    const report = await generateAndStoreReport();

    // 2. Envoyer l'email
    const emailResult = await sendBacklinkReport({
      totalProspects: report.totalProspects,
      pipelineStats: report.pipelineStats,
      pitchesGenerated: 0,
      articlesGenerated: 0,
      readyToContact: report.readyToContact,
      needFollowUp: report.needFollowUp,
      fileUrl: report.fileUrl ?? undefined,
      markdownContent: report.markdownContent,
    });

    return NextResponse.json({
      success: true,
      report: {
        readyToContact: report.readyToContact.length,
        needFollowUp: report.needFollowUp.length,
        totalProspects: report.totalProspects,
        pipelineStats: report.pipelineStats,
        fileUrl: report.fileUrl,
      },
      email: {
        sent: emailResult.success,
        error: emailResult.error || null,
      },
    });
  } catch (error) {
    console.error('[Backlinks Report API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v2/backlinks/report
 * → Retourne le dernier fichier Markdown sans envoyer d'email
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const report = await generateAndStoreReport();

    return new NextResponse(report.markdownContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="pitchs-${new Date().toISOString().split('T')[0]}.md"`,
      },
    });
  } catch (error) {
    console.error('[Backlinks Report API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
