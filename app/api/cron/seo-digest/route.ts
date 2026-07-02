/**
 * API Route: /api/cron/seo-digest
 *
 * Reçoit le digest SEO hebdomadaire poussé par le VPS (résumés structurés des
 * monitors gsc_daily/drift_check/rank_tracker/ctr_optimizer, .claude/seo-engine/
 * reports/*.summary.json) et l'envoie par email, mis en forme dans la DA
 * prestige du site (nuit + or) via lib/seo/digest-email.ts, pas en texte brut.
 *
 * Appelé le lundi matin par scripts/seo-engine/seo-digest.sh (cron VPS).
 * Sécurisé par CRON_SECRET. Destinataire : SEO_DIGEST_TO (défaut contact@instadeco.app).
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { verifyCronAuth, unauthorizedResponse } from '@/src/infrastructure/middleware/cronAuth';
import { renderDigestEmail, type DigestPayload } from '@/lib/seo/digest-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'InstaDeco AI <contact@instadeco.app>';
const DIGEST_TO = process.env.SEO_DIGEST_TO || 'contact@instadeco.app';

export async function POST(request: NextRequest) {
  const { authorized, error } = verifyCronAuth(request);
  if (!authorized) {
    return unauthorizedResponse(error);
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ success: false, error: 'RESEND_API_KEY non configurée' }, { status: 500 });
  }

  try {
    const payload = (await request.json().catch(() => null)) as DigestPayload | null;
    if (!payload || (!payload.gsc && !payload.drift && !payload.rank && !payload.ctr)) {
      return NextResponse.json({ success: false, error: 'Corps vide ou sans section exploitable' }, { status: 400 });
    }

    const { subject, html } = renderDigestEmail(payload);
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({ from: FROM_EMAIL, to: [DIGEST_TO], subject, html });

    return NextResponse.json({
      success: true,
      to: DIGEST_TO,
      sections: {
        gsc: Boolean(payload.gsc),
        drift: Boolean(payload.drift),
        rank: Boolean(payload.rank),
        ctr: Boolean(payload.ctr),
      },
    });
  } catch (err) {
    console.error('[seo-digest] Erreur:', err);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
