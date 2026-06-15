/**
 * Alerte admin sur erreur CRITICAL — observabilité low-cost.
 *
 * Branché sur ConsoleLoggerService.error : tout log dont le message commence par
 * "CRITICAL" (convention du code : échecs de remboursement/webhook = argent perdu)
 * envoie un email à l'admin via Resend (déjà configuré, zéro coût supplémentaire).
 *
 * Garde-fous :
 *  - no-op hors production (pas de bruit en dev) ;
 *  - no-op si RESEND_API_KEY absente (jamais bloquant, jamais facturé) ;
 *  - anti-spam en mémoire (un même message au plus 1×/cooldown) pour qu'une boucle
 *    d'erreur ne déclenche pas des milliers d'emails ;
 *  - ne JETTE jamais et ne re-log jamais (éviter toute boucle depuis le logger).
 *
 * NB : alternative plus riche (Sentry free tier) documentée dans docs/OBSERVABILITY.md.
 * Cette alerte email couvre l'essentiel — être prévenu quand un crédit/paiement casse.
 */
import { Resend } from 'resend';

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const ADMIN_EMAIL =
  process.env.ADMIN_ALERT_EMAIL || process.env.ADMIN_EMAIL || 'moustadrifgabriel1@gmail.com';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'InstaDeco AI <contact@instadeco.app>';

/** Fenêtre anti-spam par message (10 min). Best-effort en serverless (mémoire éphémère). */
const COOLDOWN_MS = 10 * 60 * 1000;
const lastSent = new Map<string, number>();

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function notifyAdminCritical(
  message: string,
  details?: Record<string, unknown>,
): Promise<void> {
  try {
    if (process.env.NODE_ENV !== 'production') return;

    const resend = getResend();
    if (!resend) return;

    const key = message.slice(0, 140);
    const now = Date.now();
    const prev = lastSent.get(key);
    if (prev && now - prev < COOLDOWN_MS) return; // déjà alerté récemment
    lastSent.set(key, now);

    const when = new Date().toISOString();
    const detailsJson = details && Object.keys(details).length > 0
      ? JSON.stringify(details, null, 2)
      : '(aucun détail)';

    const html = `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:640px;margin:0 auto;padding:20px;color:#1a1a1a;">
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;margin-bottom:16px;">
        <h1 style="margin:0;color:#b91c1c;font-size:18px;">🔴 Erreur CRITICAL — InstaDeco</h1>
        <p style="margin:8px 0 0;color:#7f1d1d;font-size:13px;">${escapeHtml(when)}</p>
      </div>
      <p style="font-size:15px;font-weight:600;">${escapeHtml(message)}</p>
      <pre style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;font-size:12px;white-space:pre-wrap;overflow:auto;">${escapeHtml(detailsJson)}</pre>
      <p style="color:#9ca3af;font-size:12px;margin-top:16px;">Alerte automatique (logger → CRITICAL). Concerne typiquement un crédit/paiement non réconcilié — à vérifier rapidement.</p>
    </body></html>`;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL],
      subject: `🔴 [InstaDeco] ${message.slice(0, 90)}`,
      html,
    });
  } catch {
    // L'alerting ne doit JAMAIS casser le flux applicatif ni reboucler dans le logger.
  }
}
