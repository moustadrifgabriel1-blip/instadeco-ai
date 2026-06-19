/**
 * Service: Email Guest Checkout (magic link après achat sans compte)
 *
 * Envoyé quand un client achète des crédits sans être connecté : on crée son
 * compte et on lui envoie un lien de connexion magique + le récap de ses crédits.
 */

import { Resend } from 'resend';

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'InstaDeco AI <contact@instadeco.app>';

function buildMagicLinkEmail(magicLink: string, credits: number): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="dark"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#0a0807;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0807;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#0c0a09;border:1px solid rgba(200,162,77,0.28);border-radius:18px;overflow:hidden;">
        <tr><td style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid rgba(200,162,77,0.18);">
          <img src="https://instadeco.app/images/logo-prestige.svg" alt="InstaDeco AI" width="44" height="44" style="display:inline-block;margin-bottom:12px;" />
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:0.34em;text-transform:uppercase;color:#c8a24d;">InstaDeco&nbsp;AI</div>
        </td></tr>
        <tr><td style="padding:34px 32px;color:#b3a89a;">
          <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:25px;color:#faf8f4;margin:0 0 16px;text-align:center;font-weight:normal;">Merci pour votre achat.</h1>
          <p style="font-size:15px;color:#b3a89a;line-height:1.7;margin:0 0 12px;text-align:center;">
            Vos <strong style="color:#c8a24d;">${credits} crédits</strong> ont été ajoutés à votre compte InstaDeco.
          </p>
          <p style="font-size:15px;color:#b3a89a;line-height:1.7;margin:0 0 26px;text-align:center;">
            Accédez à votre compte ci-dessous, aucun mot de passe requis.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr><td style="border-radius:999px;background-color:#c8a24d;">
              <a href="${magicLink}" style="display:inline-block;padding:15px 38px;font-size:14px;font-weight:700;color:#0c0a09;text-decoration:none;border-radius:999px;">Accéder à mon compte</a>
            </td></tr>
          </table>
          <p style="font-size:12px;color:#8c8478;line-height:1.6;margin:26px 0 0;text-align:center;">
            Ce lien est valable un temps limité. Si vous n'êtes pas à l'origine de cet achat, ignorez cet email.
          </p>
        </td></tr>
        <tr><td style="background-color:#0a0807;padding:20px 32px;text-align:center;border-top:1px solid rgba(200,162,77,0.18);">
          <p style="color:#8c8478;font-size:12px;margin:0;"><a href="https://instadeco.app" style="color:#c8a24d;text-decoration:none;">instadeco.app</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Envoie le magic link de connexion après un achat invité.
 * @returns true si l'email est parti, false sinon (best-effort).
 */
export async function sendGuestCheckoutMagicLink(
  email: string,
  magicLink: string,
  credits: number,
): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn('[GuestCheckoutEmail] RESEND_API_KEY absent — email non envoyé');
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: `Vos ${credits} crédits InstaDeco sont prêts`,
      html: buildMagicLinkEmail(magicLink, credits),
    });
    if (error) {
      console.error('[GuestCheckoutEmail] Échec envoi:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[GuestCheckoutEmail] Exception envoi:', err);
    return false;
  }
}
