/**
 * Service: Marketing Emails (Welcome + Post-Generation)
 *
 * Emails transactionnels envoyés automatiquement :
 * - Email de bienvenue à l'inscription
 * - Email après génération avec CTA de partage + parrainage
 *
 * Direction artistique : prestige (nuit + or), cohérente avec le site.
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
// PALETTE PRESTIGE (cohérente avec le site)
// ============================================
const INK = '#0c0a09';
const INK_DEEP = '#0a0807';
const SURFACE = '#1c1917';
const GOLD = '#c8a24d';
const IVORY = '#faf8f4';
const MIST = '#b3a89a';
const MIST_DIM = '#8c8478';
const LINE = 'rgba(200,162,77,0.28)';
const SERIF = "Georgia, 'Times New Roman', serif";

// ============================================
// EMAIL WRAPPER (design prestige, table email-safe)
// ============================================
function emailWrapper(content: string, preheader = ''): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
</head>
<body style="margin:0; padding:0; background-color:${INK_DEEP}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  ${preheader ? `<div style="display:none; max-height:0; overflow:hidden; opacity:0; color:${INK_DEEP};">${preheader}</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${INK_DEEP};">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:${INK}; border:1px solid ${LINE}; border-radius:18px; overflow:hidden;">
        <!-- Header -->
        <tr><td style="padding:34px 32px 26px; text-align:center; border-bottom:1px solid rgba(200,162,77,0.18);">
          <img src="https://instadeco.app/images/logo-prestige.svg" alt="InstaDeco AI" width="44" height="44" style="display:inline-block; margin-bottom:14px;" />
          <div style="font-family:${SERIF}; font-size:13px; letter-spacing:0.34em; text-transform:uppercase; color:${GOLD};">InstaDeco&nbsp;AI</div>
        </td></tr>
        <!-- Content -->
        <tr><td style="padding:36px 32px; color:${MIST};">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background-color:${INK_DEEP}; padding:24px 32px; text-align:center; border-top:1px solid rgba(200,162,77,0.18);">
          <div style="font-family:${SERIF}; font-size:12px; letter-spacing:0.28em; text-transform:uppercase; color:${MIST_DIM}; margin-bottom:8px;">Home staging virtuel par IA</div>
          <p style="color:${MIST_DIM}; font-size:12px; line-height:1.7; margin:0;">
            <a href="https://instadeco.app" style="color:${GOLD}; text-decoration:none;">instadeco.app</a><br />
            Vous recevez cet email car vous avez un compte InstaDeco AI.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Bouton or pleine confiance (CTA principal)
function primaryButton(href: string, label: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr><td style="border-radius:999px; background-color:${GOLD};">
        <a href="${href}" style="display:inline-block; padding:15px 38px; font-size:14px; font-weight:700; letter-spacing:0.02em; color:${INK}; text-decoration:none; border-radius:999px;">${label}</a>
      </td></tr>
    </table>`;
}

// Bouton secondaire (contour or)
function ghostButton(href: string, label: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr><td style="border-radius:999px; border:1px solid ${GOLD};">
        <a href="${href}" style="display:inline-block; padding:12px 30px; font-size:13px; font-weight:600; color:${GOLD}; text-decoration:none; border-radius:999px;">${label}</a>
      </td></tr>
    </table>`;
}

// ============================================
// 1. EMAIL DE BIENVENUE
// ============================================
function buildWelcomeEmail(name: string): string {
  const step = (n: string, title: string, desc: string) => `
    <tr>
      <td width="40" style="padding:10px 14px 10px 0; vertical-align:top;">
        <div style="background-color:${GOLD}; color:${INK}; width:30px; height:30px; border-radius:50%; text-align:center; line-height:30px; font-weight:700; font-size:14px;">${n}</div>
      </td>
      <td style="padding:10px 0; color:${MIST}; font-size:14px; line-height:1.5;">
        <strong style="color:${IVORY}; font-weight:600;">${title}</strong><br />
        <span style="color:${MIST};">${desc}</span>
      </td>
    </tr>`;

  return emailWrapper(`
    <h1 style="font-family:${SERIF}; color:${IVORY}; font-size:28px; line-height:1.25; margin:0 0 16px; text-align:center; font-weight:normal;">
      Bienvenue${name ? `, ${name}` : ''}.
    </h1>

    <p style="color:${MIST}; line-height:1.7; font-size:15px; margin:0 0 26px; text-align:center;">
      Votre compte est prêt. Vous disposez de
      <strong style="color:${GOLD};">3 crédits offerts</strong> pour découvrir
      la transformation de vos pièces par intelligence artificielle.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${SURFACE}; border:1px solid ${LINE}; border-radius:14px; padding:22px; margin:0 0 28px;">
      <tr><td>
        <p style="font-family:${SERIF}; color:${IVORY}; margin:0 0 14px; text-align:center; font-size:17px;">Trois gestes, rien de plus</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${step('1', 'Prenez une photo', 'Photographiez votre pièce avec votre smartphone.')}
          ${step('2', 'Choisissez un style', '12 styles : Moderne, Scandinave, Japandi et plus.')}
          ${step('3', 'Découvrez le rendu', 'En quelques secondes, la pièce apparaît mise en scène.')}
        </table>
      </td></tr>
    </table>

    <div style="text-align:center; margin:26px 0 18px;">
      ${primaryButton('https://instadeco.app/generate', 'Transformer ma pièce')}
    </div>

    <p style="color:${MIST_DIM}; font-size:13px; text-align:center; margin:16px 0 0;">
      Vos 3 crédits n'expirent jamais. Prenez votre temps.
    </p>
  `, 'Votre compte InstaDeco est prêt, avec 3 crédits offerts.');
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
      subject: 'Bienvenue sur InstaDeco, 3 crédits vous attendent',
      html: buildWelcomeEmail(name || ''),
    });

    if (error) {
      console.error('[Welcome Email] Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log(`[Welcome Email] Envoyé à ${email}`);
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
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${SURFACE}; border:1px dashed ${GOLD}; border-radius:14px; padding:24px; margin:28px 0 0; text-align:center;">
      <tr><td>
        <p style="font-family:${SERIF}; font-size:18px; color:${IVORY}; margin:0 0 8px;">Parrainez, gagnez 5 crédits</p>
        <p style="color:${MIST}; font-size:14px; line-height:1.6; margin:0 0 16px;">
          Partagez votre code et recevez <strong style="color:${GOLD};">5 crédits</strong>
          pour chaque ami qui s'inscrit.
        </p>
        <div style="background-color:${INK}; border:1px solid ${GOLD}; border-radius:12px; padding:12px 18px; display:inline-block;">
          <span style="font-size:20px; font-weight:800; color:${GOLD}; letter-spacing:3px;">${referralCode}</span>
        </div>
        <p style="color:${MIST_DIM}; font-size:12px; margin:14px 0 0;">
          <a href="https://instadeco.app/signup?ref=${referralCode}" style="color:${GOLD}; text-decoration:none;">instadeco.app/signup?ref=${referralCode}</a>
        </p>
      </td></tr>
    </table>
  ` : '';

  return emailWrapper(`
    <h1 style="font-family:${SERIF}; color:${IVORY}; font-size:26px; line-height:1.25; margin:0 0 16px; text-align:center; font-weight:normal;">
      Votre transformation est prête.
    </h1>

    <p style="color:${MIST}; line-height:1.7; font-size:15px; margin:0 0 26px; text-align:center;">
      Bonjour ${name || ''}, votre ${roomType} en style
      <strong style="color:${GOLD};">${style}</strong> vous attend.
    </p>

    <div style="text-align:center; margin:26px 0;">
      ${primaryButton('https://instadeco.app/dashboard', 'Voir mon résultat')}
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${SURFACE}; border:1px solid ${LINE}; border-radius:12px; padding:18px; margin:26px 0;">
      <tr><td>
        <p style="margin:0 0 6px; font-weight:600; color:${IVORY}; font-size:14px;">Le conseil</p>
        <p style="margin:0; color:${MIST}; font-size:14px; line-height:1.6;">
          Essayez le même espace dans un autre style pour comparer. Vos crédits ouvrent les 12 ambiances.
        </p>
      </td></tr>
    </table>

    <div style="text-align:center; margin:18px 0;">
      ${ghostButton('https://instadeco.app/generate', 'Essayer un autre style')}
    </div>

    ${referralSection}
  `, 'Votre rendu InstaDeco est prêt à découvrir.');
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
      subject: `Votre ${displayRoom} en style ${displayStyle} est prête`,
      html: buildGenerationCompleteEmail(
        name || '',
        displayStyle,
        displayRoom,
        referralCode,
      ),
    });

    if (error) {
      console.error('[Generation Email] Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log(`[Generation Email] Envoyé à ${email}`);
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
    <h1 style="font-family:${SERIF}; color:${IVORY}; font-size:26px; line-height:1.25; margin:0 0 16px; text-align:center; font-weight:normal;">
      Bonne nouvelle.
    </h1>

    <p style="color:${MIST}; line-height:1.7; font-size:15px; margin:0 0 26px; text-align:center;">
      Bonjour ${name || ''}, un ami vient de s'inscrire grâce à votre code de parrainage.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${SURFACE}; border:1px solid ${GOLD}; border-radius:14px; padding:28px; margin:0 0 26px; text-align:center;">
      <tr><td>
        <p style="font-family:${SERIF}; font-size:40px; font-weight:700; color:${GOLD}; margin:0 0 6px;">+${creditsAwarded}</p>
        <p style="font-size:17px; font-weight:600; color:${IVORY}; margin:0 0 4px;">crédits ajoutés à votre compte</p>
        <p style="color:${MIST}; font-size:14px; margin:0;">Prêts à transformer vos pièces.</p>
      </td></tr>
    </table>

    <div style="text-align:center; margin:26px 0;">
      ${primaryButton('https://instadeco.app/generate', 'Utiliser mes crédits')}
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${SURFACE}; border:1px solid ${LINE}; border-radius:12px; padding:18px; margin:26px 0 0; text-align:center;">
      <tr><td>
        <p style="margin:0; color:${MIST}; font-size:14px; line-height:1.6;">
          Continuez à partager votre code pour gagner plus de crédits.<br />
          <a href="https://instadeco.app/dashboard" style="color:${GOLD}; text-decoration:none; font-weight:500;">Voir mon code de parrainage</a>
        </p>
      </td></tr>
    </table>
  `, `Un ami a utilisé votre code, +${creditsAwarded} crédits.`);
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
      subject: `+${creditsAwarded} crédits, un ami a utilisé votre code`,
      html: buildReferralNotificationEmail(referrerName || '', creditsAwarded),
    });

    if (error) {
      console.error('[Referral Email] Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log(`[Referral Email] Notification envoyée à ${referrerEmail}`);
    return { success: true };
  } catch (err) {
    console.error('[Referral Email] Erreur:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// ============================================
// 4. CONFIRMATION D'ACHAT DE CRÉDITS
// ============================================
function buildCreditsPurchaseEmail(credits: number): string {
  return emailWrapper(`
    <h1 style="font-family:${SERIF}; color:${IVORY}; font-size:26px; line-height:1.25; margin:0 0 16px; text-align:center; font-weight:normal;">
      Paiement confirmé.
    </h1>
    <p style="color:${MIST}; line-height:1.7; font-size:15px; margin:0 0 26px; text-align:center;">
      Merci pour votre achat. Vos crédits sont déjà disponibles sur votre compte.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${SURFACE}; border:1px solid ${GOLD}; border-radius:14px; padding:28px; margin:0 0 26px; text-align:center;">
      <tr><td>
        <p style="font-family:${SERIF}; font-size:40px; font-weight:700; color:${GOLD}; margin:0 0 6px;">+${credits}</p>
        <p style="font-size:17px; font-weight:600; color:${IVORY}; margin:0;">crédits ajoutés</p>
      </td></tr>
    </table>
    <div style="text-align:center; margin:26px 0;">
      ${primaryButton('https://instadeco.app/generate', 'Transformer une pièce')}
    </div>
    <p style="color:${MIST_DIM}; font-size:13px; text-align:center; margin:16px 0 0;">
      Une facture est disponible depuis votre espace, onglet Abonnement.
    </p>
  `, `Paiement confirmé, ${credits} crédits ajoutés.`);
}

/** Email de confirmation après un achat de crédits réussi. */
export async function sendCreditsPurchaseEmail(
  email: string,
  credits: number,
): Promise<{ success: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) return { success: false, error: 'RESEND_API_KEY not configured' };
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: `Paiement confirmé, vos ${credits} crédits sont prêts`,
      html: buildCreditsPurchaseEmail(credits),
    });
    if (error) return { success: false, error: error.message };
    console.log(`[Purchase Email] Confirmation envoyée à ${email}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// ============================================
// 5. CONFIRMATION D'ABONNEMENT
// ============================================
function buildSubscriptionEmail(planName: string): string {
  return emailWrapper(`
    <h1 style="font-family:${SERIF}; color:${IVORY}; font-size:26px; line-height:1.25; margin:0 0 16px; text-align:center; font-weight:normal;">
      Bienvenue dans ${planName}.
    </h1>
    <p style="color:${MIST}; line-height:1.7; font-size:15px; margin:0 0 26px; text-align:center;">
      Votre abonnement <strong style="color:${GOLD};">${planName}</strong> est actif. Vous pouvez dès maintenant
      transformer vos biens vides en intérieurs qui se vendent.
    </p>
    <div style="text-align:center; margin:26px 0;">
      ${primaryButton('https://instadeco.app/generate', 'Commencer maintenant')}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${SURFACE}; border:1px solid ${LINE}; border-radius:12px; padding:18px; margin:26px 0 0; text-align:center;">
      <tr><td>
        <p style="margin:0; color:${MIST}; font-size:14px; line-height:1.6;">
          Gérez votre formule, votre carte et vos factures à tout moment.<br />
          <a href="https://instadeco.app/dashboard" style="color:${GOLD}; text-decoration:none; font-weight:500;">Espace abonnement</a>
        </p>
      </td></tr>
    </table>
  `, `Votre abonnement ${planName} est actif.`);
}

/** Email de confirmation après activation d'un abonnement. */
export async function sendSubscriptionConfirmationEmail(
  email: string,
  planName: string,
): Promise<{ success: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) return { success: false, error: 'RESEND_API_KEY not configured' };
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: `Votre abonnement ${planName} est activé`,
      html: buildSubscriptionEmail(planName),
    });
    if (error) return { success: false, error: error.message };
    console.log(`[Subscription Email] Confirmation envoyée à ${email}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
