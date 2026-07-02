/**
 * API Route: /api/cron/seo-digest
 *
 * Reçoit le digest SEO hebdomadaire poussé par le VPS (rapports gsc/drift/rank,
 * gardés sur le VPS car le repo est public) et l'envoie par email.
 * Appelé le lundi matin par /opt/instadeco/seo-digest.sh (cron VPS).
 *
 * Sécurisé par CRON_SECRET. Destinataire : SEO_DIGEST_TO (défaut contact@instadeco.app).
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { verifyCronAuth, unauthorizedResponse } from '@/src/infrastructure/middleware/cronAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'InstaDeco AI <contact@instadeco.app>';
const DIGEST_TO = process.env.SEO_DIGEST_TO || 'contact@instadeco.app';
/** Garde-fou taille : un digest anormalement gros est tronqué, pas rejeté. */
const MAX_BODY_CHARS = 60_000;

/** Échappe le HTML pour insérer le markdown brut dans un <pre> sans risque XSS. */
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function POST(request: NextRequest) {
  const { authorized, error } = verifyCronAuth(request);
  if (!authorized) {
    return unauthorizedResponse(error);
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ success: false, error: 'RESEND_API_KEY non configurée' }, { status: 500 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const rawText = typeof body.text === 'string' ? body.text : '';
    if (!rawText.trim()) {
      return NextResponse.json({ success: false, error: 'Corps vide (champ text attendu)' }, { status: 400 });
    }

    const truncated = rawText.length > MAX_BODY_CHARS;
    const text = truncated ? `${rawText.slice(0, MAX_BODY_CHARS)}\n\n[... digest tronqué ...]` : rawText;
    const subject =
      typeof body.subject === 'string' && body.subject.trim()
        ? body.subject.trim().slice(0, 150)
        : `Digest SEO InstaDeco, semaine du ${new Date().toLocaleDateString('fr-FR')}`;

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [DIGEST_TO],
      subject,
      text,
      html: `<pre style="font-family:ui-monospace,Menlo,monospace;font-size:13px;line-height:1.5;white-space:pre-wrap;">${escapeHtml(text)}</pre>`,
    });

    return NextResponse.json({ success: true, to: DIGEST_TO, chars: text.length, truncated });
  } catch (err) {
    console.error('[seo-digest] Erreur:', err);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
