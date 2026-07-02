import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { buildUnsubscribeUrl } from '@/lib/utils/unsubscribe';
import { supabaseAdmin } from '@/lib/supabase/admin-client';

export const dynamic = 'force-dynamic';

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'InstaDeco AI <contact@instadeco.app>';

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

/**
 * CRON: Email nurturing automatisé
 * 
 * Séquences:
 * - J+0  : Bienvenue (géré à l'inscription)
 * - J+3  : Relance si pas de génération
 * - J+7  : Inspiration (before/after)
 * - J+14 : Offre spéciale -20% si pas d'achat
 */
export async function GET(req: Request) {
  try {
    // Vérifier le secret CRON
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resend = getResend();
    if (!resend) {
      return NextResponse.json({ message: 'RESEND_API_KEY not configured' });
    }

    const now = new Date();
    const results = { j3: 0, j7: 0, j14: 0, quiz: 0, trial_j1: 0, trial_j3: 0, trial_j7: 0, avis: 0, errors: 0 };

    // ========================================
    // CAP QUOTIDIEN GLOBAL D'ENVOIS (cost-004)
    // Resend free tier = 100 emails/jour. On plafonne sous ce seuil
    // pour ne jamais basculer sur la facturation payante (~20$/mois).
    // Configurable via RESEND_DAILY_CAP (defaut 90).
    // ========================================
    const DAILY_EMAIL_CAP = (() => {
      const raw = Number(process.env.RESEND_DAILY_CAP);
      return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 90;
    })();
    let sentCount = 0;
    let deferredCount = 0;

    /**
     * Envoie un email si le cap quotidien n'est pas atteint.
     * Retourne 'sent' | 'deferred' | 'error'.
     * Quand le cap est atteint, l'envoi est reporte au prochain run du cron
     * (les utilisateurs restent dans la fenetre de selection au run suivant).
     */
    const sendCapped = async (
      payload: Parameters<NonNullable<typeof resend>['emails']['send']>[0]
    ): Promise<'sent' | 'deferred' | 'error'> => {
      if (sentCount >= DAILY_EMAIL_CAP) {
        deferredCount++;
        return 'deferred';
      }
      try {
        await resend.emails.send(payload);
        sentCount++;
        return 'sent';
      } catch {
        results.errors++;
        return 'error';
      }
    };

    // ========================================
    // J+3 : Relance "Votre pièce attend"
    // ========================================
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const threeDaysAgoMin = new Date(threeDaysAgo.getTime() - 24 * 60 * 60 * 1000);

    const { data: j3Users } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, credits, consent_marketing')
      .gte('created_at', threeDaysAgoMin.toISOString())
      .lt('created_at', threeDaysAgo.toISOString());

    for (const user of (j3Users || [])) {
      // Vérifier le consentement marketing (RGPD: opt-in strict)
      if (user.consent_marketing === false) continue;

      // Vérifier s'ils ont fait une génération
      const { count } = await supabaseAdmin
        .from('generations')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if ((count || 0) === 0) {
        if (await sendCapped({
          from: FROM_EMAIL,
          to: [user.email],
          subject: '🏠 Votre pièce attend d\'être transformée !',
          html: buildJ3Email(user.full_name || 'là', user.email),
        }) === 'sent') {
          results.j3++;
        }
      }
    }

    // ========================================
    // J+7 : Inspiration before/after
    // ========================================
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgoMin = new Date(sevenDaysAgo.getTime() - 24 * 60 * 60 * 1000);

    const { data: j7Users } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, consent_marketing')
      .gte('created_at', sevenDaysAgoMin.toISOString())
      .lt('created_at', sevenDaysAgo.toISOString());

    for (const user of (j7Users || [])) {
      // Vérifier le consentement marketing (RGPD: opt-in strict)
      if (user.consent_marketing === false) continue;

      if (await sendCapped({
        from: FROM_EMAIL,
        to: [user.email],
        subject: '✨ 3 transformations qui vont vous inspirer',
        html: buildJ7Email(user.full_name || 'là', user.email),
      }) === 'sent') {
        results.j7++;
      }
    }

    // ========================================
    // J+14 : Offre spéciale si pas d'achat
    // ========================================
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgoMin = new Date(fourteenDaysAgo.getTime() - 24 * 60 * 60 * 1000);

    const { data: j14Users } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, credits, consent_marketing')
      .gte('created_at', fourteenDaysAgoMin.toISOString())
      .lt('created_at', fourteenDaysAgo.toISOString());

    for (const user of (j14Users || [])) {
      // Vérifier le consentement marketing (RGPD: opt-in strict)
      if (user.consent_marketing === false) continue;

      // Vérifier s'ils ont acheté (plus de 3 crédits = achat)
      const { count } = await supabaseAdmin
        .from('credit_transactions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('type', 'purchase');

      if ((count || 0) === 0) {
        if (await sendCapped({
          from: FROM_EMAIL,
          to: [user.email],
          subject: '🎁 Offre exclusive : -20% sur votre premier pack',
          html: buildJ14Email(user.full_name || 'là', user.email),
        }) === 'sent') {
          results.j14++;
        }
      }
    }

    // ========================================
    // QUIZ: Email nurturing post-quiz (J+1)
    // Leads qui ont fait le quiz il y a 1 jour
    // ========================================
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    const oneDayAgoMin = new Date(oneDayAgo.getTime() - 24 * 60 * 60 * 1000);

    const { data: quizLeads } = await supabaseAdmin
      .from('leads')
      .select('id, email, name, source, metadata, unsubscribed')
      .eq('source', 'quiz_style_deco')
      .gte('created_at', oneDayAgoMin.toISOString())
      .lt('created_at', oneDayAgo.toISOString());

    for (const lead of (quizLeads || [])) {
      if (!lead.email) continue;
      // RGPD: respecter la désinscription
      if (lead.unsubscribed === true) continue;

      // Extraire le style du quiz depuis les metadata
      const quizStyle = lead.metadata?.style || 'Moderne';

      if (await sendCapped({
        from: FROM_EMAIL,
        to: [lead.email],
        subject: `🎨 Votre style ${quizStyle} vous attend, testez-le sur vos photos !`,
        html: buildQuizFollowUpEmail(lead.name || 'là', lead.email, quizStyle),
      }) === 'sent') {
        results.quiz++;
      }
    }

    // ========================================
    // TRIAL: J+1, Rappel résultat + inscription
    // Leads qui ont fait l'essai il y a 1 jour et ne sont pas inscrits
    // ========================================
    const { data: trialJ1Leads } = await supabaseAdmin
      .from('leads')
      .select('id, email, name, source, metadata, unsubscribed')
      .eq('source', 'trial_email_gate')
      .gte('created_at', oneDayAgoMin.toISOString())
      .lt('created_at', oneDayAgo.toISOString());

    for (const lead of (trialJ1Leads || [])) {
      if (!lead.email) continue;
      // RGPD: respecter la désinscription
      if (lead.unsubscribed === true) continue;
      // Vérifier qu'ils ne se sont pas inscrits
      const { count: userCount } = await supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('email', lead.email);

      if ((userCount || 0) > 0) continue; // Déjà inscrit, skip

      const style = lead.metadata?.style || 'Moderne';
      if (await sendCapped({
        from: FROM_EMAIL,
        to: [lead.email],
        subject: '🏠 Votre transformation déco vous attend !',
        html: buildTrialJ1Email(lead.name || 'là', lead.email, style),
      }) === 'sent') {
        results.trial_j1++;
      }
    }

    // ========================================
    // TRIAL: J+3, Inspiration + offre flash
    // ========================================
    const { data: trialJ3Leads } = await supabaseAdmin
      .from('leads')
      .select('id, email, name, source, metadata, unsubscribed')
      .eq('source', 'trial_email_gate')
      .gte('created_at', threeDaysAgoMin.toISOString())
      .lt('created_at', threeDaysAgo.toISOString());

    for (const lead of (trialJ3Leads || [])) {
      if (!lead.email) continue;
      // RGPD: respecter la désinscription
      if (lead.unsubscribed === true) continue;
      const { count: userCount } = await supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('email', lead.email);

      if ((userCount || 0) > 0) continue;

      if (await sendCapped({
        from: FROM_EMAIL,
        to: [lead.email],
        subject: '✨ 3 crédits offerts, Transformez toutes vos pièces',
        html: buildTrialJ3Email(lead.name || 'là', lead.email),
      }) === 'sent') {
        results.trial_j3++;
      }
    }

    // ========================================
    // TRIAL: J+7, Dernière chance + offre -20%
    // ========================================
    const { data: trialJ7Leads } = await supabaseAdmin
      .from('leads')
      .select('id, email, name, source, metadata, unsubscribed')
      .eq('source', 'trial_email_gate')
      .gte('created_at', sevenDaysAgoMin.toISOString())
      .lt('created_at', sevenDaysAgo.toISOString());

    for (const lead of (trialJ7Leads || [])) {
      if (!lead.email) continue;
      // RGPD: respecter la désinscription
      if (lead.unsubscribed === true) continue;
      const { count: userCount } = await supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('email', lead.email);

      if ((userCount || 0) > 0) continue;

      if (await sendCapped({
        from: FROM_EMAIL,
        to: [lead.email],
        subject: '🎁 Dernière chance : -20% sur vos crédits déco',
        html: buildTrialJ7Email(lead.name || 'là', lead.email),
      }) === 'sent') {
        results.trial_j7++;
      }
    }

    // ========================================
    // AVIS : demande de notation J+2 a J+7 apres une generation reussie
    // Alimente generation_ratings (preuve sociale, prerequis AggregateRating).
    // Un SEUL envoi par utilisateur a vie (profiles.rating_request_sent_at).
    // ========================================
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    // Cohorte RGPD : les comptes crees avant le 11/02/2026 ont un consent_marketing
    // DEFAULT true jamais confirme (re-consentement en attente) : on les exclut.
    const CONSENT_COHORT_START = '2026-02-11T00:00:00Z';

    const { data: recentGens } = await supabaseAdmin
      .from('generations')
      .select('user_id, created_at')
      .eq('status', 'completed')
      .gte('created_at', sevenDaysAgo.toISOString())
      .lt('created_at', twoDaysAgo.toISOString())
      .limit(200);

    const candidateUserIds = [...new Set((recentGens || []).map((g) => g.user_id).filter(Boolean))].slice(0, 40);

    for (const userId of candidateUserIds) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, consent_marketing, rating_request_sent_at, created_at')
        .eq('id', userId)
        .maybeSingle();

      if (!profile?.email) continue;
      // RGPD : opt-in strict + cohorte au consentement explicite uniquement.
      if (profile.consent_marketing !== true) continue;
      if (profile.created_at && profile.created_at < CONSENT_COHORT_START) continue;
      // Idempotence : jamais deux demandes d'avis au meme utilisateur.
      if (profile.rating_request_sent_at) continue;

      // Deja note spontanement ? Rien a demander.
      const { count: ratingCount } = await supabaseAdmin
        .from('generation_ratings')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      if ((ratingCount || 0) > 0) {
        // On marque quand meme pour ne plus jamais re-evaluer ce profil.
        await supabaseAdmin.from('profiles').update({ rating_request_sent_at: now.toISOString() }).eq('id', userId);
        continue;
      }

      if (await sendCapped({
        from: FROM_EMAIL,
        to: [profile.email],
        subject: 'Vos rendus déco valent-ils le coup ? Dites-le en 2 clics',
        html: buildRatingRequestEmail(profile.full_name || 'là', profile.email),
      }) === 'sent') {
        results.avis++;
        // Marquage APRES envoi reussi : un echec d'envoi laisse le profil re-eligible.
        await supabaseAdmin.from('profiles').update({ rating_request_sent_at: now.toISOString() }).eq('id', userId);
      }
    }

    console.log(`[Email Nurturing] ✅ J3: ${results.j3}, J7: ${results.j7}, J14: ${results.j14}, Quiz: ${results.quiz}, Trial-J1: ${results.trial_j1}, Trial-J3: ${results.trial_j3}, Trial-J7: ${results.trial_j7}, Avis: ${results.avis}, Errors: ${results.errors}`);
    console.log(`[Email Nurturing] 📊 Envoyes: ${sentCount}/${DAILY_EMAIL_CAP} (cap quotidien). Reportes au prochain run: ${deferredCount}`);
    if (deferredCount > 0) {
      console.warn(`[Email Nurturing] ⚠️ Cap quotidien Resend atteint (${DAILY_EMAIL_CAP}). ${deferredCount} email(s) reporte(s) au prochain run pour rester sur le free tier.`);
    }

    return NextResponse.json({
      success: true,
      results,
      cap: { limit: DAILY_EMAIL_CAP, sent: sentCount, deferred: deferredCount },
      executedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('[Email Nurturing] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// ============================================
// EMAIL TEMPLATES
// ============================================

function emailWrapper(content: string, unsubscribeUrl?: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="dark"></head>
<body style="margin:0; padding:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; background-color:#0a0807;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0807;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#0c0a09; border:1px solid rgba(200,162,77,0.28); border-radius:18px; overflow:hidden;">
        <!-- Header -->
        <tr><td style="padding:34px 32px 24px; text-align:center; border-bottom:1px solid rgba(200,162,77,0.18);">
          <img src="https://instadeco.app/images/logo-prestige.svg" alt="InstaDeco AI" width="44" height="44" style="display:inline-block; margin-bottom:12px;" />
          <div style="font-family:Georgia,'Times New Roman',serif; font-size:13px; letter-spacing:0.34em; text-transform:uppercase; color:#c8a24d;">InstaDeco&nbsp;AI</div>
        </td></tr>
        <!-- Content -->
        <tr><td style="padding:34px 32px; color:#b3a89a;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background-color:#0a0807; padding:22px 32px; text-align:center; border-top:1px solid rgba(200,162,77,0.18);">
          <p style="color:#8c8478; font-size:12px; line-height:1.7; margin:0;">
            InstaDeco AI, home staging virtuel par intelligence artificielle<br />
            <a href="https://instadeco.app" style="color:#c8a24d; text-decoration:none;">instadeco.app</a>
          </p>
          <p style="color:#6b655c; font-size:11px; margin:8px 0 0;">
            Vous recevez cet email car vous êtes inscrit sur InstaDeco AI.${unsubscribeUrl ? `<br /><a href="${unsubscribeUrl}" style="color:#6b655c; text-decoration:underline;">Se désinscrire des emails marketing</a>` : ''}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildJ3Email(name: string, email: string): string {
  const unsubUrl = buildUnsubscribeUrl(email);
  return emailWrapper(`
    <h2 style="color: #faf8f4; font-size: 22px; margin: 0 0 16px;">Bonjour ${name} 👋</h2>
    
    <p style="color: #b3a89a; line-height: 1.6; margin: 0 0 16px;">
      Vous avez créé votre compte il y a 3 jours, mais vous n'avez pas encore
      testé la magie d'InstaDeco !
    </p>
    
    <p style="color: #b3a89a; line-height: 1.6; margin: 0 0 24px;">
      <strong style="color: #faf8f4;">Vos 3 crédits gratuits vous attendent</strong>, prenez simplement
      une photo de votre pièce et découvrez-la transformée en 30 secondes.
    </p>

    <div style="background: #1c1917; border-radius: 12px; padding: 20px; margin: 0 0 24px; border: 1px solid rgba(200,162,77,0.28);">
      <p style="margin: 0 0 8px; font-weight: 600; color: #faf8f4;">💡 Le saviez-vous ?</p>
      <p style="margin: 0; color: #b3a89a; font-size: 14px;">
        Un décorateur d'intérieur facture en moyenne <strong>150 €/h</strong>.<br />
        Avec InstaDeco, vous obtenez un résultat comparable pour <strong style="color: #c8a24d;">0,99 € en 30 secondes</strong>.
      </p>
    </div>
    
    <div style="text-align: center; margin: 24px 0;">
      <a href="https://instadeco.app/generate"
         style="display: inline-block; background: linear-gradient(135deg, #c8a24d, #a8842f); color: #0c0a09; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px;">
        Transformer ma pièce maintenant →
      </a>
    </div>
  `, unsubUrl);
}

function buildJ7Email(name: string, email: string): string {
  const unsubUrl = buildUnsubscribeUrl(email);
  return emailWrapper(`
    <h2 style="color: #faf8f4; font-size: 22px; margin: 0 0 16px;">Les transformations de la semaine ✨</h2>
    
    <p style="color: #b3a89a; line-height: 1.6; margin: 0 0 24px;">
      Bonjour ${name}, voici les styles les plus demandés cette semaine par notre communauté :
    </p>

    <div style="margin: 0 0 24px;">
      <div style="background: #1c1917; border-radius: 12px; padding: 16px; margin: 0 0 12px;">
        <p style="margin: 0 0 4px; font-weight: 600; color: #faf8f4;">🏠 Salon Moderne Minimaliste</p>
        <p style="margin: 0; color: #b3a89a; font-size: 14px;">Le style le plus demandé, lignes épurées, tons neutres, espaces ouverts.</p>
      </div>
      <div style="background: #1c1917; border-radius: 12px; padding: 16px; margin: 0 0 12px;">
        <p style="margin: 0 0 4px; font-weight: 600; color: #faf8f4;">🌿 Chambre Japandi</p>
        <p style="margin: 0; color: #b3a89a; font-size: 14px;">Le mélange parfait entre zen japonais et hyggee scandinave.</p>
      </div>
      <div style="background: #1c1917; border-radius: 12px; padding: 16px;">
        <p style="margin: 0 0 4px; font-weight: 600; color: #faf8f4;">🏭 Bureau Industriel</p>
        <p style="margin: 0; color: #b3a89a; font-size: 14px;">Briques, métal et bois brut, le style qui booste la productivité.</p>
      </div>
    </div>
    
    <p style="color: #b3a89a; line-height: 1.6; margin: 0 0 24px;">
      <strong style="color: #faf8f4;">12 styles, 8 types de pièces, ~30 secondes</strong>, c'est tout ce qu'il faut pour visualiser votre intérieur autrement.
      Et votre pièce ?
    </p>
    
    <div style="text-align: center; margin: 24px 0;">
      <a href="https://instadeco.app/generate"
         style="display: inline-block; background: linear-gradient(135deg, #c8a24d, #a8842f); color: #0c0a09; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px;">
        Essayer un nouveau style →
      </a>
    </div>
  `, unsubUrl);
}

function buildJ14Email(name: string, email: string): string {
  const unsubUrl = buildUnsubscribeUrl(email);
  const couponId = process.env.STRIPE_COUPON_20_PERCENT || '';
  const pricingUrl = couponId
    ? `https://instadeco.app/pricing?coupon=${couponId}`
    : 'https://instadeco.app/pricing';

  return emailWrapper(`
    <h2 style="color: #faf8f4; font-size: 22px; margin: 0 0 16px;">Une offre spéciale pour vous 🎁</h2>
    
    <p style="color: #b3a89a; line-height: 1.6; margin: 0 0 16px;">
      Bonjour ${name}, cela fait 2 semaines que vous avez rejoint InstaDeco. 
      Nous avons une offre exclusive pour vous !
    </p>

    <div style="background: linear-gradient(135deg, #1c1917, #1c1917); border-radius: 16px; padding: 24px; margin: 0 0 24px; border: 2px solid #c8a24d; text-align: center;">
      <p style="font-size: 36px; font-weight: 800; color: #c8a24d; margin: 0 0 8px;">-20%</p>
      <p style="font-size: 18px; font-weight: 600; color: #faf8f4; margin: 0 0 8px;">Sur votre premier pack de crédits</p>
      <p style="color: #b3a89a; font-size: 14px; margin: 0 0 16px;">
        Pack Créatif : <span style="text-decoration: line-through;">19,90 €</span> → <strong style="color: #c8a24d;">15,92 €</strong> (25 crédits)
      </p>
      <p style="color: #8c8478; font-size: 12px; margin: 0;">
        ⏰ Offre valable 48h uniquement
      </p>
    </div>

    <div style="background: #1c1917; border-radius: 12px; padding: 16px; margin: 0 0 24px;">
      <p style="margin: 0 0 4px; font-weight: 600; color: #faf8f4; font-size: 14px;">Ce que représentent 25 crédits :</p>
      <ul style="margin: 8px 0 0; padding: 0 0 0 20px; color: #b3a89a; font-size: 14px;">
        <li>25 transformations haute qualité</li>
        <li>Testez les 12 styles</li>
        <li>Équivalent à 3 750 € de consultations déco</li>
        <li>Crédits valables à vie</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 24px 0;">
      <a href="${pricingUrl}"
         style="display: inline-block; background: linear-gradient(135deg, #c8a24d, #a8842f); color: #0c0a09; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px;">
        Profiter de l'offre -20% →
      </a>
    </div>
    
    <p style="color: #8c8478; font-size: 13px; text-align: center; margin: 16px 0 0;">
      Pas intéressé ? Pas de souci, vos 3 crédits gratuits n'expirent jamais.
    </p>
  `, unsubUrl);
}

// Mapping des styles vers des slugs pour les liens
const STYLE_SLUG_MAP: Record<string, string> = {
  'Moderne': 'moderne', 'Scandinave': 'scandinave', 'Industriel': 'industriel',
  'Bohème': 'boheme', 'Minimaliste': 'minimaliste', 'Japandi': 'japandi',
  'Art Déco': 'art-deco', 'Contemporain': 'contemporain', 'Rustique': 'rustique',
  'Coastal': 'coastal', 'Mid-Century Modern': 'mid-century', 'Luxe': 'luxe',
};

function buildQuizFollowUpEmail(name: string, email: string, styleName: string): string {
  const unsubUrl = buildUnsubscribeUrl(email);
  const styleSlug = STYLE_SLUG_MAP[styleName] || 'moderne';
  
  return emailWrapper(`
    <h2 style="color: #faf8f4; font-size: 22px; margin: 0 0 16px;">Votre style déco : ${styleName} 🎨</h2>
    
    <p style="color: #b3a89a; line-height: 1.6; margin: 0 0 16px;">
      Bonjour ${name}, vous avez découvert que votre style de décoration idéal est le <strong style="color: #c8a24d;">${styleName}</strong> ! 
      Et maintenant ?
    </p>

    <div style="background: #1c1917; border-radius: 16px; padding: 24px; margin: 0 0 24px; border: 1px solid rgba(200,162,77,0.28);">
      <p style="margin: 0 0 12px; font-weight: 700; color: #faf8f4; font-size: 18px;">🏠 Passez de la théorie à la pratique</p>
      <p style="margin: 0 0 16px; color: #b3a89a; font-size: 15px; line-height: 1.6;">
        Prenez une simple photo de votre pièce et découvrez-la transformée en style 
        <strong>${styleName}</strong> en seulement 30 secondes grâce à notre IA.
      </p>
      <ul style="margin: 0; padding: 0 0 0 20px; color: #b3a89a; font-size: 14px; line-height: 1.8;">
        <li>📸 Prenez une photo de votre pièce</li>
        <li>🎨 Choisissez le style ${styleName}</li>
        <li>✨ Recevez votre transformation en 30 secondes</li>
        <li>💰 Première transformation 100% gratuite</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="https://instadeco.app/essai?style=${styleSlug}"
         style="display: inline-block; background: linear-gradient(135deg, #c8a24d, #a8842f); color: #0c0a09; text-decoration: none; padding: 16px 36px; border-radius: 50px; font-weight: 600; font-size: 16px;">
        Tester le style ${styleName} sur ma pièce →
      </a>
    </div>

    <div style="background: #1c1917; border-radius: 12px; padding: 16px; margin: 24px 0 0;">
      <p style="margin: 0; color: #8c8478; font-size: 13px; text-align: center;">
        📖 <a href="https://instadeco.app/style/${styleSlug}" style="color: #c8a24d; text-decoration: none; font-weight: 500;">
          Lire le guide complet du style ${styleName}
        </a>
      </p>
    </div>
    
    <p style="color: #8c8478; font-size: 13px; text-align: center; margin: 16px 0 0;">
      Votre essai gratuit n'expire jamais.
    </p>
  `, unsubUrl);
}

function buildRatingRequestEmail(name: string, email: string): string {
  const unsubUrl = buildUnsubscribeUrl(email);
  return emailWrapper(`
    <h2 style="color: #faf8f4; font-size: 22px; margin: 0 0 16px;">Un avis sur vos rendus, ${name} ?</h2>

    <p style="color: #b3a89a; line-height: 1.6; margin: 0 0 16px;">
      Vous avez transformé une ou plusieurs pièces avec InstaDeco ces derniers jours.
      Le rendu vous a plu ? Il vous a déçu ? Dans les deux cas, votre note nous aide
      vraiment : c'est elle qui guide l'amélioration du moteur.
    </p>

    <p style="color: #b3a89a; line-height: 1.6; margin: 0 0 24px;">
      Deux clics suffisent : ouvrez votre tableau de bord et notez vos créations avec les étoiles,
      directement sous chaque image.
    </p>

    <div style="text-align: center; margin: 24px 0;">
      <a href="https://instadeco.app/fr/dashboard"
         style="display: inline-block; background: linear-gradient(135deg, #c8a24d, #a8842f); color: #0c0a09; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px;">
        Noter mes créations →
      </a>
    </div>

    <p style="color: #8c8478; font-size: 13px; text-align: center; margin: 16px 0 0;">
      Une remarque plus détaillée ? Répondez simplement à cet email, il arrive directement chez nous.
    </p>
  `, unsubUrl);
}

// ============================================
// TRIAL EMAIL TEMPLATES (pour leads /essai)
// ============================================

function buildTrialJ1Email(name: string, email: string, style: string): string {
  const unsubUrl = buildUnsubscribeUrl(email);
  return emailWrapper(`
    <h2 style="color: #faf8f4; font-size: 22px; margin: 0 0 16px;">Votre transformation vous attend 🏠</h2>
    
    <p style="color: #b3a89a; line-height: 1.6; margin: 0 0 16px;">
      Bonjour ${name}, hier vous avez testé InstaDeco et découvert votre pièce en style <strong style="color: #c8a24d;">${style}</strong>.
    </p>
    
    <p style="color: #b3a89a; line-height: 1.6; margin: 0 0 24px;">
      Envie d'aller plus loin ? Créez votre compte gratuit et recevez 
      <strong style="color: #c8a24d;">3 crédits offerts</strong> pour transformer d'autres pièces,
      essayer d'autres styles et télécharger vos images en HD.
    </p>

    <div style="background: #1c1917; border-radius: 12px; padding: 20px; margin: 0 0 24px; border: 1px solid rgba(200,162,77,0.28);">
      <p style="margin: 0 0 8px; font-weight: 600; color: #faf8f4;">✨ Avec un compte gratuit :</p>
      <ul style="margin: 0; padding: 0 0 0 20px; color: #b3a89a; font-size: 14px; line-height: 1.8;">
        <li>3 transformations supplémentaires offertes</li>
        <li>12 styles de décoration (vs 6 en essai)</li>
        <li>Historique de vos créations</li>
        <li>Téléchargement HD</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 24px 0;">
      <a href="https://instadeco.app/signup"
         style="display: inline-block; background: linear-gradient(135deg, #c8a24d, #a8842f); color: #0c0a09; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px;">
        Créer mon compte, 3 crédits offerts →
      </a>
    </div>
    
    <p style="color: #8c8478; font-size: 13px; text-align: center; margin: 16px 0 0;">
      Sans engagement • Sans carte bancaire • Inscription en 30 secondes
    </p>
  `, unsubUrl);
}

function buildTrialJ3Email(name: string, email: string): string {
  const unsubUrl = buildUnsubscribeUrl(email);
  return emailWrapper(`
    <h2 style="color: #faf8f4; font-size: 22px; margin: 0 0 16px;">3 transformations vous attendent ✨</h2>
    
    <p style="color: #b3a89a; line-height: 1.6; margin: 0 0 16px;">
      Bonjour ${name}, vous avez adoré votre essai gratuit sur InstaDeco il y a quelques jours.
    </p>

    <p style="color: #b3a89a; line-height: 1.6; margin: 0 0 24px;">
      Saviez-vous que <strong style="color: #faf8f4;">3 crédits gratuits</strong> vous attendent ?
      Créez votre compte en 30 secondes pour les utiliser.
    </p>

    <div style="margin: 0 0 24px;">
      <div style="background: #1c1917; border-radius: 12px; padding: 16px; margin: 0 0 12px;">
        <p style="margin: 0 0 4px; font-weight: 600; color: #faf8f4;">🛋️ Idée 1 : Multi-style</p>
        <p style="margin: 0; color: #b3a89a; font-size: 14px;">Testez la même pièce en Moderne, Scandinave et Japandi pour comparer.</p>
      </div>
      <div style="background: #1c1917; border-radius: 12px; padding: 16px; margin: 0 0 12px;">
        <p style="margin: 0 0 4px; font-weight: 600; color: #faf8f4;">🏠 Idée 2 : Multi-pièce</p>
        <p style="margin: 0; color: #b3a89a; font-size: 14px;">Transformez votre salon, chambre et cuisine dans le même style.</p>
      </div>
      <div style="background: #1c1917; border-radius: 12px; padding: 16px;">
        <p style="margin: 0 0 4px; font-weight: 600; color: #faf8f4;">📱 Idée 3 : Home staging</p>
        <p style="margin: 0; color: #b3a89a; font-size: 14px;">Vous vendez ? Meublez virtuellement pour accélérer la vente.</p>
      </div>
    </div>
    
    <div style="text-align: center; margin: 24px 0;">
      <a href="https://instadeco.app/signup"
         style="display: inline-block; background: linear-gradient(135deg, #c8a24d, #a8842f); color: #0c0a09; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px;">
        Récupérer mes 3 crédits gratuits →
      </a>
    </div>
  `, unsubUrl);
}

function buildTrialJ7Email(name: string, email: string): string {
  const unsubUrl = buildUnsubscribeUrl(email);
  const pricingUrl = process.env.STRIPE_COUPON_20_PERCENT
    ? `https://instadeco.app/pricing?coupon=${process.env.STRIPE_COUPON_20_PERCENT}`
    : 'https://instadeco.app/pricing';

  return emailWrapper(`
    <h2 style="color: #faf8f4; font-size: 22px; margin: 0 0 16px;">Dernière chance : -20% pour vous 🎁</h2>
    
    <p style="color: #b3a89a; line-height: 1.6; margin: 0 0 16px;">
      Bonjour ${name}, cela fait une semaine que vous avez découvert InstaDeco.
      Pour fêter ça, voici une offre exclusive :
    </p>

    <div style="background: linear-gradient(135deg, #1c1917, #1c1917); border-radius: 16px; padding: 24px; margin: 0 0 24px; border: 2px solid #c8a24d; text-align: center;">
      <p style="font-size: 36px; font-weight: 800; color: #c8a24d; margin: 0 0 8px;">-20%</p>
      <p style="font-size: 18px; font-weight: 600; color: #faf8f4; margin: 0 0 8px;">sur votre premier pack</p>
      <p style="color: #b3a89a; font-size: 14px; margin: 0 0 4px;">
        25 crédits : <span style="text-decoration: line-through;">19,90 €</span> → <strong style="color: #c8a24d;">15,92 €</strong>
      </p>
      <p style="color: #8c8478; font-size: 12px; margin: 8px 0 0;">
        ⏰ Offre valable 48h uniquement
      </p>
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="https://instadeco.app/signup"
         style="display: inline-block; background: linear-gradient(135deg, #c8a24d, #a8842f); color: #0c0a09; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px;">
        Créer mon compte + profiter du -20% →
      </a>
    </div>
    
    <div style="text-align: center; margin: 0 0 16px;">
      <a href="${pricingUrl}"
         style="display: inline-block; background: transparent; color: #c8a24d; text-decoration: none; padding: 10px 24px; border-radius: 50px; font-weight: 600; font-size: 14px; border: 2px solid #c8a24d;">
        Voir les tarifs →
      </a>
    </div>
    
    <p style="color: #8c8478; font-size: 13px; text-align: center; margin: 16px 0 0;">
      Pas intéressé ? Pas de souci, votre essai gratuit reste disponible sur inscription.
    </p>
  `, unsubUrl);
}
