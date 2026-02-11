/**
 * API Admin: Gestion du pipeline de backlinks
 * 
 * Endpoints:
 * GET  - Récupère le pipeline complet + prochaines actions
 * POST - Actions: seed, generate-pitch, generate-article, update-status
 * 
 * Protégé par CRON_SECRET ou vérification admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { BacklinkOutreachService } from '@/lib/seo/backlink-outreach';

// Vérification simple d'autorisation
function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.error('[Backlinks] CRON_SECRET non configuré');
    return false;
  }
  
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * GET /api/v2/backlinks
 * 
 * Retourne le pipeline complet et les prochaines actions à effectuer
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [pipeline, nextActions] = await Promise.all([
      BacklinkOutreachService.getPipeline(),
      BacklinkOutreachService.getNextActions(),
    ]);

    return NextResponse.json({
      success: true,
      pipeline: {
        total: pipeline.prospects.length,
        stats: pipeline.stats,
        prospects: pipeline.prospects,
      },
      nextActions: {
        needPitch: nextActions.needPitch.map(p => ({
          id: p.id,
          site_name: p.site_name,
          site_url: p.site_url,
          category: p.category,
          priority: p.priority,
          domain_authority: p.domain_authority,
        })),
        readyToContact: nextActions.readyToContact.map(p => ({
          id: p.id,
          site_name: p.site_name,
          site_url: p.site_url,
          pitch_generated: p.pitch_generated,
          contact_email: p.contact_email,
        })),
        needFollowUp: nextActions.needFollowUp.map(p => ({
          id: p.id,
          site_name: p.site_name,
          site_url: p.site_url,
          outreach_sent_at: p.outreach_sent_at,
        })),
      },
    });
  } catch (error) {
    console.error('[Backlinks API] GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v2/backlinks
 * 
 * Actions disponibles:
 * - seed: Initialise les prospects dans la DB
 * - generate-pitch: Génère un pitch pour un prospect
 * - generate-article: Génère un brouillon d'article invité
 * - update-status: Met à jour le statut d'un prospect
 * - batch-pitches: Génère des pitchs en batch
 */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, prospectId, status, backlinkUrl, topic, limit } = body;

    switch (action) {
      case 'seed': {
        const result = await BacklinkOutreachService.seedProspects();
        return NextResponse.json({ success: true, ...result });
      }

      case 'generate-pitch': {
        if (!prospectId) return NextResponse.json({ error: 'prospectId required' }, { status: 400 });
        const pitch = await BacklinkOutreachService.generatePitch(prospectId);
        return NextResponse.json({ success: true, pitch });
      }

      case 'generate-article': {
        if (!prospectId) return NextResponse.json({ error: 'prospectId required' }, { status: 400 });
        const article = await BacklinkOutreachService.generateArticleDraft(prospectId, topic);
        return NextResponse.json({ success: true, article: article.substring(0, 500) + '...' });
      }

      case 'update-status': {
        if (!prospectId || !status) return NextResponse.json({ error: 'prospectId and status required' }, { status: 400 });
        await BacklinkOutreachService.updateStatus(prospectId, status, backlinkUrl);
        return NextResponse.json({ success: true });
      }

      case 'batch-pitches': {
        const count = await BacklinkOutreachService.batchGeneratePitches(limit || 5);
        return NextResponse.json({ success: true, pitchesGenerated: count });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: seed, generate-pitch, generate-article, update-status, batch-pitches' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Backlinks API] POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
