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
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f9f9f9;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <h1 style="font-size:22px;color:#1d1d1f;margin:0 0 16px;">Merci pour votre achat 🎉</h1>
    <p style="font-size:15px;color:#3a3a3c;line-height:1.6;margin:0 0 12px;">
      Vos <strong>${credits} crédits</strong> ont été ajoutés à votre compte InstaDeco.
    </p>
    <p style="font-size:15px;color:#3a3a3c;line-height:1.6;margin:0 0 24px;">
      Cliquez ci-dessous pour accéder à votre compte (aucun mot de passe nécessaire) :
    </p>
    <a href="${magicLink}"
       style="display:inline-block;background:#1d1d1f;color:#fff;text-decoration:none;
              padding:14px 28px;border-radius:9999px;font-size:15px;font-weight:600;">
      Accéder à mon compte
    </a>
    <p style="font-size:12px;color:#aeaeb2;line-height:1.6;margin:24px 0 0;">
      Ce lien est valable un temps limité. Si vous n'êtes pas à l'origine de cet achat,
      ignorez cet email.
    </p>
  </div>
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
      subject: `Vos ${credits} crédits InstaDeco sont prêts 🎨`,
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
