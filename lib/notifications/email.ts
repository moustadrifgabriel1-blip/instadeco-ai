/**
 * Service: Email Notifications via Resend
 * 
 * Envoie des notifications email automatiques :
 * - Rapport hebdomadaire de backlink outreach
 * - Fichier de pitchs prêts à envoyer
 * - Alertes pipeline (nouveau backlink publié, etc.)
 */

import { Resend } from 'resend';

// Lazy init pour éviter l'erreur "Missing API key" au build
let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'moustadrifgabriel1@gmail.com';

// Utiliser le domaine vérifié ou l'email de test Resend
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'InstaDeco AI <onboarding@resend.dev>';

export interface BacklinkReportData {
  totalProspects: number;
  pipelineStats: Record<string, number>;
  pitchesGenerated: number;
  articlesGenerated: number;
  readyToContact: Array<{
    site_name: string;
    site_url: string;
    category: string;
    domain_authority?: number;
    priority: number;
    pitch_generated?: string;
    contact_email?: string;
  }>;
  needFollowUp: Array<{
    site_name: string;
    site_url: string;
    outreach_sent_at?: string;
  }>;
  fileUrl?: string;
  markdownContent?: string;
}

/**
 * Envoie le rapport hebdomadaire de backlink outreach
 * - Pitchs complets directement dans le corps de l'email (copier-coller)
 * - Fichier Markdown en pièce jointe
 */
export async function sendBacklinkReport(data: BacklinkReportData): Promise<{ success: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY non configuree -- notification ignoree');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const subject = `Backlinks InstaDeco - ${data.readyToContact.length} pitchs prets (${today})`;

  const html = buildReportHtml(data, today);

  // Preparer la piece jointe Markdown si disponible
  const attachments: Array<{ filename: string; content: Buffer }> = [];
  if (data.markdownContent) {
    attachments.push({
      filename: `pitchs-${new Date().toISOString().split('T')[0]}.md`,
      content: Buffer.from(data.markdownContent, 'utf-8'),
    });
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL],
      subject,
      html,
      ...(attachments.length > 0 ? { attachments } : {}),
    });

    if (error) {
      console.error('[Email] Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Rapport envoye a ${ADMIN_EMAIL}`);
    return { success: true };
  } catch (err) {
    console.error('[Email] Send failed:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Echappe les caracteres HTML
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Extrait le sujet et le corps d'un pitch genere
 */
function parsePitch(pitchText: string): { subject: string; body: string } {
  const lines = pitchText.split('\n');
  let subject = '';
  let bodyStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.toLowerCase().startsWith('subject:')) {
      subject = line.replace(/^subject:\s*/i, '').trim();
      bodyStart = i + 1;
      // Sauter les lignes vides apres le sujet
      while (bodyStart < lines.length && lines[bodyStart].trim() === '') {
        bodyStart++;
      }
      break;
    }
  }

  const body = lines.slice(bodyStart).join('\n').trim();
  return { subject: subject || '(pas de sujet)', body: body || pitchText };
}

/**
 * Construit le HTML du rapport email avec pitchs complets en copier-coller
 */
function buildReportHtml(data: BacklinkReportData, dateStr: string): string {
  const statusLabels: Record<string, string> = {
    prospect: 'Prospect',
    contacted: 'Contacte',
    responded: 'Repondu',
    negotiating: 'Negociation',
    published: 'Publie',
    rejected: 'Rejete',
    expired: 'Expire',
  };

  const statsHtml = Object.entries(data.pipelineStats)
    .map(([status, count]) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${statusLabels[status] || status}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: center; font-weight: bold;">${count}</td>
      </tr>
    `)
    .join('');

  // Chaque pitch en texte complet, pret a copier-coller
  let pitchesHtml = '';
  if (data.readyToContact.length > 0) {
    pitchesHtml = data.readyToContact.map((p, i) => {
      const parsed = p.pitch_generated ? parsePitch(p.pitch_generated) : null;
      
      return `
      <div style="background: #ffffff; border: 2px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <!-- En-tete prospect -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
          <div>
            <h3 style="margin: 0 0 4px; color: #1a1a1a; font-size: 17px;">${i + 1}. ${escapeHtml(p.site_name)}</h3>
            <p style="margin: 0; color: #6b7280; font-size: 13px;">
              <a href="${escapeHtml(p.site_url)}" style="color: #3b82f6; text-decoration: none;">${escapeHtml(p.site_url)}</a>
              | DA: ${p.domain_authority || '?'} | P${p.priority} | ${escapeHtml(p.category)}
            </p>
            ${p.contact_email ? `<p style="margin: 4px 0 0; color: #059669; font-size: 13px;">Email: ${escapeHtml(p.contact_email)}</p>` : ''}
          </div>
        </div>

        ${parsed ? `
        <!-- Sujet de l'email -->
        <div style="margin-bottom: 12px;">
          <p style="margin: 0 0 4px; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">Objet de l'email :</p>
          <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 10px 14px; font-size: 14px; color: #0c4a6e;">
            ${escapeHtml(parsed.subject)}
          </div>
        </div>

        <!-- Corps de l'email -->
        <div>
          <p style="margin: 0 0 4px; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">Corps du message (copier-coller) :</p>
          <div style="background: #fafafa; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; font-size: 14px; line-height: 1.6; color: #374151; white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
${escapeHtml(parsed.body)}
          </div>
        </div>
        ` : `
        <p style="color: #9ca3af; font-style: italic;">Pitch pas encore genere pour ce prospect.</p>
        `}
      </div>`;
    }).join('');
  } else {
    pitchesHtml = '<p style="color: #9ca3af; padding: 16px;">Aucun pitch pret cette semaine. Ils seront generes au prochain cycle.</p>';
  }

  // Relances
  const followUpHtml = data.needFollowUp.length > 0
    ? data.needFollowUp.map(p => `
      <li style="margin-bottom: 8px;">
        <strong>${escapeHtml(p.site_name)}</strong> - contacte le ${p.outreach_sent_at ? new Date(p.outreach_sent_at).toLocaleDateString('fr-FR') : '?'}
        <br><a href="${escapeHtml(p.site_url)}" style="color: #3b82f6; font-size: 13px;">${escapeHtml(p.site_url)}</a>
      </li>
    `).join('')
    : '<li style="color: #9ca3af;">Aucune relance necessaire</li>';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 680px; margin: 0 auto; padding: 20px; background: #f9fafb; color: #1a1a1a;">
  
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
    <h1 style="margin: 0; color: #fff; font-size: 22px;">Rapport Backlinks InstaDeco</h1>
    <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">${escapeHtml(dateStr)}</p>
  </div>

  <!-- Resume -->
  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
    <p style="margin: 0; font-size: 15px;">
      <strong>${data.pitchesGenerated}</strong> nouveaux pitchs generes
      | <strong>${data.articlesGenerated}</strong> article(s) cree(s)
      | <strong>${data.readyToContact.length}</strong> prets a contacter
    </p>
  </div>

  <!-- Pipeline -->
  <h2 style="font-size: 18px; margin: 24px 0 12px; color: #1a1a1a;">Pipeline (${data.totalProspects} prospects)</h2>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; background: #fff; border-radius: 8px; overflow: hidden;">
    <thead>
      <tr style="background: #f1f5f9;">
        <th style="padding: 8px 12px; text-align: left; font-size: 13px;">Statut</th>
        <th style="padding: 8px 12px; text-align: center; font-size: 13px;">Nombre</th>
      </tr>
    </thead>
    <tbody>
      ${statsHtml}
    </tbody>
  </table>

  <!-- PITCHS COMPLETS -->
  <h2 style="font-size: 18px; margin: 24px 0 4px; color: #1a1a1a;">Pitchs prets a envoyer (${data.readyToContact.length})</h2>
  <p style="margin: 0 0 16px; color: #6b7280; font-size: 13px;">Selectionne le texte et copie-colle directement dans ton email.</p>
  ${pitchesHtml}

  <!-- Relances -->
  <h2 style="font-size: 18px; margin: 24px 0 12px; color: #1a1a1a;">Relances necessaires (${data.needFollowUp.length})</h2>
  <ul style="padding-left: 20px;">
    ${followUpHtml}
  </ul>

  <!-- Note piece jointe -->
  ${data.markdownContent ? `
  <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 24px 0;">
    <p style="margin: 0; font-size: 14px; color: #1e40af;">
      Le fichier Markdown complet est en piece jointe de cet email.
    </p>
  </div>
  ` : ''}

  <!-- Footer -->
  <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px;">
    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
      Email automatique - InstaDeco AI Backlink System
    </p>
  </div>
</body>
</html>`;
}
