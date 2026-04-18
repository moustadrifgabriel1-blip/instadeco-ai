/**
 * Service: Marketing Emails (Welcome + Post-Generation)
 * 
 * Emails transactionnels envoyés automatiquement :
 * - Email de bienvenue à l'inscription
 * - Email après génération avec CTA de partage + parrainage
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

// ============================================
// EMAIL WRAPPER (réutilise le même design)
// ============================================
function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9f9f9;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #E07B54, #D4603C); padding: 32px 24px; text-align: center;">
      <img src="https://instadeco.app/images/logo-v3-house-sparkle.svg" alt="InstaDeco AI" width="48" height="48" style="border-radius: 12px; margin-bottom: 12px;" />
      <h1 style="color: white; font-size: 24px; margin: 0; font-weight: 700;">InstaDeco AI</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 32px 24px;">
      ${content}
    </div>
    
    <!-- Footer -->
    <div style="background: #f5f5f7; padding: 16px 24px; text-align: center;">
      <p style="color: #636366; font-size: 12px; margin: 0;">
        InstaDeco AI — Décoration d'intérieur par intelligence artificielle<br />
        <a href="https://instadeco.app" style="color: #E07B54; text-decoration: none;">instadeco.app</a>
      </p>
      <p style="color: #aaa; font-size: 11px; margin: 8px 0 0;">
        Vous recevez cet email car vous avez créé un compte sur InstaDeco AI.
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ============================================
// 1. EMAIL DE BIENVENUE
// ============================================
function buildWelcomeEmail(name: string): string {
  return emailWrapper(`
    <h2 style="color: #1d1d1f; font-size: 24px; margin: 0 0 16px; text-align: center;">
      Bienvenue ${name} ! 🎉
    </h2>
    
    <p style="color: #6B6B6B; line-height: 1.6; margin: 0 0 16px; text-align: center;">
      Votre compte InstaDeco AI est prêt. Vous avez 
      <strong style="color: #E07B54;">3 crédits gratuits</strong> pour découvrir
      la transformation de vos pièces par intelligence artificielle.
    </p>

    <div style="background: linear-gradient(135deg, #FFF8F5, #FFF0EB); border-radius: 16px; padding: 24px; margin: 0 0 24px; border: 1px solid #F5D5C8;">
      <p style="font-weight: 700; color: #1d1d1f; margin: 0 0 16px; text-align: center; font-size: 16px;">
        3 étapes simples :
      </p>
      <table style="width: 100%;" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 8px 12px; vertical-align: top;">
            <div style="background: #E07B54; color: white; width: 28px; height: 28px; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 700; font-size: 14px;">1</div>
          </td>
          <td style="padding: 8px 0; color: #2D2D2D; font-size: 14px;">
            <strong>Prenez une photo</strong><br />
            <span style="color: #6B6B6B;">Photographiez votre pièce avec votre smartphone</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; vertical-align: top;">
            <div style="background: #E07B54; color: white; width: 28px; height: 28px; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 700; font-size: 14px;">2</div>
          </td>
          <td style="padding: 8px 0; color: #2D2D2D; font-size: 14px;">
            <strong>Choisissez un style</strong><br />
            <span style="color: #6B6B6B;">12 styles disponibles : Moderne, Scandinave, Japandi...</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; vertical-align: top;">
            <div style="background: #E07B54; color: white; width: 28px; height: 28px; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 700; font-size: 14px;">3</div>
          </td>
          <td style="padding: 8px 0; color: #2D2D2D; font-size: 14px;">
            <strong>Admirez le résultat</strong><br />
            <span style="color: #6B6B6B;">En 10 secondes, votre pièce est transformée !</span>
          </td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="https://instadeco.app/generate"
         style="display: inline-block; background: linear-gradient(135deg, #E07B54, #D4603C); color: white; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-weight: 700; font-size: 16px;">
        Transformer ma pièce →
      </a>
    </div>

    <p style="color: #636366; font-size: 13px; text-align: center; margin: 16px 0 0;">
      Vos 3 crédits n'expirent jamais. Prenez votre temps.
    </p>
  `);
}

/**
 * Envoie l'email de bienvenue après inscription
 */
export async function sendWelcomeEmail(
  email: string,
  name?: string | null
): Promise<{ success: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) {
    console.warn('[Welcome Email] RESEND_API_KEY non configurée');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: '🏠 Bienvenue sur InstaDeco — 3 crédits offerts !',
      html: buildWelcomeEmail(name || 'là'),
    });

    if (error) {
      console.error('[Welcome Email] Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log(`[Welcome Email] ✅ Envoyé à ${email}`);
    return { success: true };
  } catch (err) {
    console.error('[Welcome Email] Erreur:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// ============================================
// 2. EMAIL POST-GÉNÉRATION
// ============================================
function buildGenerationCompleteEmail(
  name: string,
  style: string,
  roomType: string,
  referralCode: string | null,
): string {
  const referralSection = referralCode ? `
    <div style="background: linear-gradient(135deg, #FFF8F5, #FFF0EB); border-radius: 16px; padding: 24px; margin: 24px 0; border: 2px dashed #E07B54; text-align: center;">
      <p style="font-size: 16px; font-weight: 700; color: #1d1d1f; margin: 0 0 8px;">
        🎁 Parrainez un ami, gagnez 5 crédits
      </p>
      <p style="color: #6B6B6B; font-size: 14px; margin: 0 0 16px;">
        Partagez votre code de parrainage et recevez <strong style="color: #E07B54;">5 crédits gratuits</strong>
        pour chaque ami qui s'inscrit !
      </p>
      <div style="background: white; border: 2px solid #E07B54; border-radius: 12px; padding: 12px; display: inline-block;">
        <span style="font-size: 20px; font-weight: 800; color: #E07B54; letter-spacing: 2px;">${referralCode}</span>
      </div>
      <p style="color: #636366; font-size: 12px; margin: 12px 0 0;">
        Lien de parrainage : <a href="https://instadeco.app/signup?ref=${referralCode}" style="color: #E07B54;">instadeco.app/signup?ref=${referralCode}</a>
      </p>
    </div>
  ` : '';

  return emailWrapper(`
    <h2 style="color: #1d1d1f; font-size: 22px; margin: 0 0 16px; text-align: center;">
      Votre transformation est prête ! ✨
    </h2>
    
    <p style="color: #6B6B6B; line-height: 1.6; margin: 0 0 16px; text-align: center;">
      Bonjour ${name}, votre ${roomType} style <strong style="color: #E07B54;">${style}</strong> 
      est prête à être découverte !
    </p>

    <div style="text-align: center; margin: 24px 0;">
      <a href="https://instadeco.app/dashboard"
         style="display: inline-block; background: linear-gradient(135deg, #E07B54, #D4603C); color: white; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-weight: 700; font-size: 16px;">
        Voir mon résultat →
      </a>
    </div>

    <div style="background: #f5f5f7; border-radius: 12px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 4px; font-weight: 600; color: #1d1d1f; font-size: 14px;">💡 Astuce</p>
      <p style="margin: 0; color: #6B6B6B; font-size: 14px;">
        Essayez le même espace dans un style différent pour comparer ! 
        Vos crédits vous permettent d'explorer les 12 styles disponibles.
      </p>
    </div>

    <div style="text-align: center; margin: 16px 0;">
      <a href="https://instadeco.app/generate"
         style="display: inline-block; background: white; color: #E07B54; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-weight: 600; font-size: 14px; border: 2px solid #E07B54;">
        Essayer un autre style →
      </a>
    </div>

    ${referralSection}
  `);
}

/**
 * Envoie l'email de notification après une génération réussie
 */
export async function sendGenerationCompleteEmail(
  email: string,
  name: string | null,
  style: string,
  roomType: string,
  referralCode: string | null,
): Promise<{ success: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) {
    console.warn('[Generation Email] RESEND_API_KEY non configurée');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  // Traduire le style et roomType pour l'email
  const styleLabels: Record<string, string> = {
    modern: 'Moderne', scandinavian: 'Scandinave', industrial: 'Industriel',
    minimalist: 'Minimaliste', japandi: 'Japandi', bohemian: 'Bohème',
    mediterranean: 'Méditerranéen', art_deco: 'Art Déco', mid_century: 'Mid-Century',
    contemporary: 'Contemporain', rustic: 'Rustique', coastal: 'Côtier',
  };
  const roomLabels: Record<string, string> = {
    living_room: 'salon', bedroom: 'chambre', kitchen: 'cuisine',
    bathroom: 'salle de bain', office: 'bureau', dining_room: 'salle à manger',
    kids_room: 'chambre enfant', hallway: 'entrée', terrace: 'terrasse',
  };

  const displayStyle = styleLabels[style] || style;
  const displayRoom = roomLabels[roomType] || roomType;

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: `🎨 Votre ${displayRoom} ${displayStyle} est prête !`,
      html: buildGenerationCompleteEmail(
        name || 'là',
        displayStyle,
        displayRoom,
        referralCode,
      ),
    });

    if (error) {
      console.error('[Generation Email] Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log(`[Generation Email] ✅ Envoyé à ${email}`);
    return { success: true };
  } catch (err) {
    console.error('[Generation Email] Erreur:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// ============================================
// 3. EMAIL DE NOTIFICATION AU PARRAIN
// ============================================
function buildReferralNotificationEmail(
  name: string,
  creditsAwarded: number,
): string {
  return emailWrapper(`
    <h2 style="color: #1d1d1f; font-size: 22px; margin: 0 0 16px; text-align: center;">
      Bonne nouvelle ! 🎉
    </h2>
    
    <p style="color: #6B6B6B; line-height: 1.6; margin: 0 0 16px; text-align: center;">
      Bonjour ${name}, un ami vient de s'inscrire grâce à votre code de parrainage !
    </p>

    <div style="background: linear-gradient(135deg, #FFF8F5, #FFF0EB); border-radius: 16px; padding: 24px; margin: 0 0 24px; border: 2px solid #E07B54; text-align: center;">
      <p style="font-size: 36px; font-weight: 800; color: #E07B54; margin: 0 0 8px;">+${creditsAwarded}</p>
      <p style="font-size: 18px; font-weight: 600; color: #1d1d1f; margin: 0 0 4px;">crédits ajoutés à votre compte</p>
      <p style="color: #6B6B6B; font-size: 14px; margin: 0;">
        Utilisez-les pour transformer vos pièces !
      </p>
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="https://instadeco.app/generate"
         style="display: inline-block; background: linear-gradient(135deg, #E07B54, #D4603C); color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px;">
        Utiliser mes crédits →
      </a>
    </div>

    <div style="background: #f5f5f7; border-radius: 12px; padding: 16px; margin: 24px 0; text-align: center;">
      <p style="margin: 0; color: #636366; font-size: 14px;">
        💡 Continuez à partager votre code pour gagner encore plus de crédits !<br />
        <a href="https://instadeco.app/dashboard" style="color: #E07B54; text-decoration: none; font-weight: 500;">
          Voir mon code de parrainage →
        </a>
      </p>
    </div>
  `);
}

/**
 * Envoie un email de notification au parrain quand un filleul s'inscrit
 */
export async function sendReferralNotificationEmail(
  referrerEmail: string,
  referrerName: string | null,
  creditsAwarded: number,
): Promise<{ success: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) {
    console.warn('[Referral Email] RESEND_API_KEY non configurée');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [referrerEmail],
      subject: `🎁 +${creditsAwarded} crédits — Un ami a utilisé votre code !`,
      html: buildReferralNotificationEmail(referrerName || 'là', creditsAwarded),
    });

    if (error) {
      console.error('[Referral Email] Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log(`[Referral Email] ✅ Notification envoyée à ${referrerEmail}`);
    return { success: true };
  } catch (err) {
    console.error('[Referral Email] Erreur:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
