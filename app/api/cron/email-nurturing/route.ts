import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { buildUnsubscribeUrl } from '@/lib/utils/unsubscribe';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    const results = { j3: 0, j7: 0, j14: 0, quiz: 0, trial_j1: 0, trial_j3: 0, trial_j7: 0, errors: 0 };

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
        try {
          await resend.emails.send({
            from: FROM_EMAIL,
            to: [user.email],
            subject: '🏠 Votre pièce attend d\'être transformée !',
            html: buildJ3Email(user.full_name || 'là', user.email),
          });
          results.j3++;
        } catch {
          results.errors++;
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

      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: [user.email],
          subject: '✨ 3 transformations qui vont vous inspirer',
          html: buildJ7Email(user.full_name || 'là', user.email),
        });
        results.j7++;
      } catch {
        results.errors++;
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
        try {
          await resend.emails.send({
            from: FROM_EMAIL,
            to: [user.email],
            subject: '🎁 Offre exclusive : -20% sur votre premier pack',
            html: buildJ14Email(user.full_name || 'là', user.email),
          });
          results.j14++;
        } catch {
          results.errors++;
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
      .select('id, email, name, source, metadata')
      .eq('source', 'quiz_style_deco')
      .gte('created_at', oneDayAgoMin.toISOString())
      .lt('created_at', oneDayAgo.toISOString());

    for (const lead of (quizLeads || [])) {
      if (!lead.email) continue;

      // Extraire le style du quiz depuis les metadata
      const quizStyle = lead.metadata?.style || 'Moderne';

      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: [lead.email],
          subject: `🎨 Votre style ${quizStyle} vous attend — testez-le sur vos photos !`,
          html: buildQuizFollowUpEmail(lead.name || 'là', lead.email, quizStyle),
        });
        results.quiz++;
      } catch {
        results.errors++;
      }
    }

    // ========================================
    // TRIAL: J+1 — Rappel résultat + inscription
    // Leads qui ont fait l'essai il y a 1 jour et ne sont pas inscrits
    // ========================================
    const { data: trialJ1Leads } = await supabaseAdmin
      .from('leads')
      .select('id, email, name, source, metadata')
      .eq('source', 'trial_email_gate')
      .gte('created_at', oneDayAgoMin.toISOString())
      .lt('created_at', oneDayAgo.toISOString());

    for (const lead of (trialJ1Leads || [])) {
      if (!lead.email) continue;
      // Vérifier qu'ils ne se sont pas inscrits
      const { count: userCount } = await supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('email', lead.email);

      if ((userCount || 0) > 0) continue; // Déjà inscrit, skip

      const style = lead.metadata?.style || 'Moderne';
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: [lead.email],
          subject: '🏠 Votre transformation déco vous attend !',
          html: buildTrialJ1Email(lead.name || 'là', lead.email, style),
        });
        results.trial_j1++;
      } catch {
        results.errors++;
      }
    }

    // ========================================
    // TRIAL: J+3 — Inspiration + offre flash
    // ========================================
    const { data: trialJ3Leads } = await supabaseAdmin
      .from('leads')
      .select('id, email, name, source, metadata')
      .eq('source', 'trial_email_gate')
      .gte('created_at', threeDaysAgoMin.toISOString())
      .lt('created_at', threeDaysAgo.toISOString());

    for (const lead of (trialJ3Leads || [])) {
      if (!lead.email) continue;
      const { count: userCount } = await supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('email', lead.email);

      if ((userCount || 0) > 0) continue;

      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: [lead.email],
          subject: '✨ 3 crédits offerts — Transformez toutes vos pièces',
          html: buildTrialJ3Email(lead.name || 'là', lead.email),
        });
        results.trial_j3++;
      } catch {
        results.errors++;
      }
    }

    // ========================================
    // TRIAL: J+7 — Dernière chance + offre -20%
    // ========================================
    const { data: trialJ7Leads } = await supabaseAdmin
      .from('leads')
      .select('id, email, name, source, metadata')
      .eq('source', 'trial_email_gate')
      .gte('created_at', sevenDaysAgoMin.toISOString())
      .lt('created_at', sevenDaysAgo.toISOString());

    for (const lead of (trialJ7Leads || [])) {
      if (!lead.email) continue;
      const { count: userCount } = await supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('email', lead.email);

      if ((userCount || 0) > 0) continue;

      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: [lead.email],
          subject: '🎁 Dernière chance : -20% sur vos crédits déco',
          html: buildTrialJ7Email(lead.name || 'là', lead.email),
        });
        results.trial_j7++;
      } catch {
        results.errors++;
      }
    }

    console.log(`[Email Nurturing] ✅ J3: ${results.j3}, J7: ${results.j7}, J14: ${results.j14}, Quiz: ${results.quiz}, Trial-J1: ${results.trial_j1}, Trial-J3: ${results.trial_j3}, Trial-J7: ${results.trial_j7}, Errors: ${results.errors}`);

    return NextResponse.json({
      success: true,
      results,
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
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9f9f9;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #E07B54, #D4603C); padding: 32px 24px; text-align: center;">
      <img src="https://instadeco.app/images/logo-v3-house-sparkle.svg" alt="InstaDeco AI" width="48" height="48" style="border-radius: 12px; margin-bottom: 12px;" />
      <h1 style="color: white; font-size: 24px; margin: 0; font-weight: 700;">InstaDeco AI</h1>
      <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 8px 0 0;">Votre architecte d'intérieur à 0,99 €</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 32px 24px;">
      ${content}
    </div>
    
    <!-- Footer -->
    <div style="background: #f5f5f7; padding: 16px 24px; text-align: center;">
      <p style="color: #636366; font-size: 12px; margin: 0;">
        InstaDeco AI — Votre décoration par intelligence artificielle<br />
        <a href="https://instadeco.app" style="color: #E07B54; text-decoration: none;">instadeco.app</a>
      </p>
      <p style="color: #aaa; font-size: 11px; margin: 8px 0 0;">
        Vous recevez cet email car vous êtes inscrit sur InstaDeco AI.${unsubscribeUrl ? `<br />
        <a href="${unsubscribeUrl}" style="color: #aaa; text-decoration: underline;">Se désinscrire des emails marketing</a>` : ''}
      </p>
    </div>
  </div>
</body>
</html>`;
}

function buildJ3Email(name: string, email: string): string {
  const unsubUrl = buildUnsubscribeUrl(email);
  return emailWrapper(`
    <h2 style="color: #1d1d1f; font-size: 22px; margin: 0 0 16px;">Bonjour ${name} 👋</h2>
    
    <p style="color: #6B6B6B; line-height: 1.6; margin: 0 0 16px;">
      Vous avez créé votre compte il y a 3 jours, mais vous n'avez pas encore
      testé la magie d'InstaDeco !
    </p>
    
    <p style="color: #6B6B6B; line-height: 1.6; margin: 0 0 24px;">
      <strong style="color: #1d1d1f;">Vos 3 crédits gratuits vous attendent</strong> — prenez simplement
      une photo de votre pièce et découvrez-la transformée en 30 secondes.
    </p>

    <div style="background: #FFF8F5; border-radius: 12px; padding: 20px; margin: 0 0 24px; border: 1px solid #F5D5C8;">
      <p style="margin: 0 0 8px; font-weight: 600; color: #1d1d1f;">💡 Le saviez-vous ?</p>
      <p style="margin: 0; color: #6B6B6B; font-size: 14px;">
        Un décorateur d'intérieur facture en moyenne <strong>150 €/h</strong>.<br />
        Avec InstaDeco, vous obtenez un résultat comparable pour <strong style="color: #E07B54;">0,99 € en 30 secondes</strong>.
      </p>
    </div>
    
    <div style="text-align: center; margin: 24px 0;">
      <a href="https://instadeco.app/generate"
         style="display: inline-block; background: linear-gradient(135deg, #E07B54, #D4603C); color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px;">
        Transformer ma pièce maintenant →
      </a>
    </div>
  `, unsubUrl);
}

function buildJ7Email(name: string, email: string): string {
  const unsubUrl = buildUnsubscribeUrl(email);
  return emailWrapper(`
    <h2 style="color: #1d1d1f; font-size: 22px; margin: 0 0 16px;">Les transformations de la semaine ✨</h2>
    
    <p style="color: #6B6B6B; line-height: 1.6; margin: 0 0 24px;">
      Bonjour ${name}, voici les styles les plus demandés cette semaine par notre communauté :
    </p>

    <div style="margin: 0 0 24px;">
      <div style="background: #f5f5f7; border-radius: 12px; padding: 16px; margin: 0 0 12px;">
        <p style="margin: 0 0 4px; font-weight: 600; color: #1d1d1f;">🏠 Salon Moderne Minimaliste</p>
        <p style="margin: 0; color: #6B6B6B; font-size: 14px;">Le style le plus demandé — lignes épurées, tons neutres, espaces ouverts.</p>
      </div>
      <div style="background: #f5f5f7; border-radius: 12px; padding: 16px; margin: 0 0 12px;">
        <p style="margin: 0 0 4px; font-weight: 600; color: #1d1d1f;">🌿 Chambre Japandi</p>
        <p style="margin: 0; color: #6B6B6B; font-size: 14px;">Le mélange parfait entre zen japonais et hyggee scandinave.</p>
      </div>
      <div style="background: #f5f5f7; border-radius: 12px; padding: 16px;">
        <p style="margin: 0 0 4px; font-weight: 600; color: #1d1d1f;">🏭 Bureau Industriel</p>
        <p style="margin: 0; color: #6B6B6B; font-size: 14px;">Briques, métal et bois brut — le style qui booste la productivité.</p>
      </div>
    </div>
    
    <p style="color: #6B6B6B; line-height: 1.6; margin: 0 0 24px;">
      <strong style="color: #1d1d1f;">12 styles, 8 types de pièces, ~30 secondes</strong> — c'est tout ce qu'il faut pour visualiser votre intérieur autrement.
      Et votre pièce ?
    </p>
    
    <div style="text-align: center; margin: 24px 0;">
      <a href="https://instadeco.app/generate"
         style="display: inline-block; background: linear-gradient(135deg, #E07B54, #D4603C); color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px;">
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
    <h2 style="color: #1d1d1f; font-size: 22px; margin: 0 0 16px;">Une offre spéciale pour vous 🎁</h2>
    
    <p style="color: #6B6B6B; line-height: 1.6; margin: 0 0 16px;">
      Bonjour ${name}, cela fait 2 semaines que vous avez rejoint InstaDeco. 
      Nous avons une offre exclusive pour vous !
    </p>

    <div style="background: linear-gradient(135deg, #FFF8F5, #FFF0EB); border-radius: 16px; padding: 24px; margin: 0 0 24px; border: 2px solid #E07B54; text-align: center;">
      <p style="font-size: 36px; font-weight: 800; color: #E07B54; margin: 0 0 8px;">-20%</p>
      <p style="font-size: 18px; font-weight: 600; color: #1d1d1f; margin: 0 0 8px;">Sur votre premier pack de crédits</p>
      <p style="color: #6B6B6B; font-size: 14px; margin: 0 0 16px;">
        Pack Créatif : <span style="text-decoration: line-through;">19,90 €</span> → <strong style="color: #E07B54;">15,92 €</strong> (25 crédits)
      </p>
      <p style="color: #636366; font-size: 12px; margin: 0;">
        ⏰ Offre valable 48h uniquement
      </p>
    </div>

    <div style="background: #f5f5f7; border-radius: 12px; padding: 16px; margin: 0 0 24px;">
      <p style="margin: 0 0 4px; font-weight: 600; color: #1d1d1f; font-size: 14px;">Ce que représentent 25 crédits :</p>
      <ul style="margin: 8px 0 0; padding: 0 0 0 20px; color: #6B6B6B; font-size: 14px;">
        <li>25 transformations haute qualité</li>
        <li>Testez les 12 styles</li>
        <li>Équivalent à 3 750 € de consultations déco</li>
        <li>Crédits valables à vie</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 24px 0;">
      <a href="${pricingUrl}"
         style="display: inline-block; background: linear-gradient(135deg, #E07B54, #D4603C); color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px;">
        Profiter de l'offre -20% →
      </a>
    </div>
    
    <p style="color: #636366; font-size: 13px; text-align: center; margin: 16px 0 0;">
      Pas intéressé ? Pas de souci — vos 3 crédits gratuits n'expirent jamais.
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
    <h2 style="color: #1d1d1f; font-size: 22px; margin: 0 0 16px;">Votre style déco : ${styleName} 🎨</h2>
    
    <p style="color: #6B6B6B; line-height: 1.6; margin: 0 0 16px;">
      Bonjour ${name}, vous avez découvert que votre style de décoration idéal est le <strong style="color: #E07B54;">${styleName}</strong> ! 
      Et maintenant ?
    </p>

    <div style="background: #FFF8F5; border-radius: 16px; padding: 24px; margin: 0 0 24px; border: 1px solid #F5D5C8;">
      <p style="margin: 0 0 12px; font-weight: 700; color: #1d1d1f; font-size: 18px;">🏠 Passez de la théorie à la pratique</p>
      <p style="margin: 0 0 16px; color: #6B6B6B; font-size: 15px; line-height: 1.6;">
        Prenez une simple photo de votre pièce et découvrez-la transformée en style 
        <strong>${styleName}</strong> en seulement 30 secondes grâce à notre IA.
      </p>
      <ul style="margin: 0; padding: 0 0 0 20px; color: #6B6B6B; font-size: 14px; line-height: 1.8;">
        <li>📸 Prenez une photo de votre pièce</li>
        <li>🎨 Choisissez le style ${styleName}</li>
        <li>✨ Recevez votre transformation en 30 secondes</li>
        <li>💰 Première transformation 100% gratuite</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="https://instadeco.app/essai?style=${styleSlug}"
         style="display: inline-block; background: linear-gradient(135deg, #E07B54, #D4603C); color: white; text-decoration: none; padding: 16px 36px; border-radius: 50px; font-weight: 600; font-size: 16px;">
        Tester le style ${styleName} sur ma pièce →
      </a>
    </div>

    <div style="background: #f5f5f7; border-radius: 12px; padding: 16px; margin: 24px 0 0;">
      <p style="margin: 0; color: #636366; font-size: 13px; text-align: center;">
        📖 <a href="https://instadeco.app/style/${styleSlug}" style="color: #E07B54; text-decoration: none; font-weight: 500;">
          Lire le guide complet du style ${styleName}
        </a>
      </p>
    </div>
    
    <p style="color: #636366; font-size: 13px; text-align: center; margin: 16px 0 0;">
      Votre essai gratuit n'expire jamais.
    </p>
  `, unsubUrl);
}

// ============================================
// TRIAL EMAIL TEMPLATES (pour leads /essai)
// ============================================

function buildTrialJ1Email(name: string, email: string, style: string): string {
  const unsubUrl = buildUnsubscribeUrl(email);
  return emailWrapper(`
    <h2 style="color: #1d1d1f; font-size: 22px; margin: 0 0 16px;">Votre transformation vous attend 🏠</h2>
    
    <p style="color: #6B6B6B; line-height: 1.6; margin: 0 0 16px;">
      Bonjour ${name}, hier vous avez testé InstaDeco et découvert votre pièce en style <strong style="color: #E07B54;">${style}</strong>.
    </p>
    
    <p style="color: #6B6B6B; line-height: 1.6; margin: 0 0 24px;">
      Envie d'aller plus loin ? Créez votre compte gratuit et recevez 
      <strong style="color: #E07B54;">3 crédits offerts</strong> pour transformer d'autres pièces,
      essayer d'autres styles et télécharger vos images en HD.
    </p>

    <div style="background: #FFF8F5; border-radius: 12px; padding: 20px; margin: 0 0 24px; border: 1px solid #F5D5C8;">
      <p style="margin: 0 0 8px; font-weight: 600; color: #1d1d1f;">✨ Avec un compte gratuit :</p>
      <ul style="margin: 0; padding: 0 0 0 20px; color: #6B6B6B; font-size: 14px; line-height: 1.8;">
        <li>3 transformations supplémentaires offertes</li>
        <li>20+ styles de décoration (vs 6 en essai)</li>
        <li>Historique de vos créations</li>
        <li>Téléchargement HD</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 24px 0;">
      <a href="https://instadeco.app/signup"
         style="display: inline-block; background: linear-gradient(135deg, #E07B54, #D4603C); color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px;">
        Créer mon compte — 3 crédits offerts →
      </a>
    </div>
    
    <p style="color: #636366; font-size: 13px; text-align: center; margin: 16px 0 0;">
      Sans engagement • Sans carte bancaire • Inscription en 30 secondes
    </p>
  `, unsubUrl);
}

function buildTrialJ3Email(name: string, email: string): string {
  const unsubUrl = buildUnsubscribeUrl(email);
  return emailWrapper(`
    <h2 style="color: #1d1d1f; font-size: 22px; margin: 0 0 16px;">3 transformations vous attendent ✨</h2>
    
    <p style="color: #6B6B6B; line-height: 1.6; margin: 0 0 16px;">
      Bonjour ${name}, vous avez adoré votre essai gratuit sur InstaDeco il y a quelques jours.
    </p>

    <p style="color: #6B6B6B; line-height: 1.6; margin: 0 0 24px;">
      Saviez-vous que <strong style="color: #1d1d1f;">3 crédits gratuits</strong> vous attendent ?
      Créez votre compte en 30 secondes pour les utiliser.
    </p>

    <div style="margin: 0 0 24px;">
      <div style="background: #f5f5f7; border-radius: 12px; padding: 16px; margin: 0 0 12px;">
        <p style="margin: 0 0 4px; font-weight: 600; color: #1d1d1f;">🛋️ Idée 1 : Multi-style</p>
        <p style="margin: 0; color: #6B6B6B; font-size: 14px;">Testez la même pièce en Moderne, Scandinave et Japandi pour comparer.</p>
      </div>
      <div style="background: #f5f5f7; border-radius: 12px; padding: 16px; margin: 0 0 12px;">
        <p style="margin: 0 0 4px; font-weight: 600; color: #1d1d1f;">🏠 Idée 2 : Multi-pièce</p>
        <p style="margin: 0; color: #6B6B6B; font-size: 14px;">Transformez votre salon, chambre et cuisine dans le même style.</p>
      </div>
      <div style="background: #f5f5f7; border-radius: 12px; padding: 16px;">
        <p style="margin: 0 0 4px; font-weight: 600; color: #1d1d1f;">📱 Idée 3 : Home staging</p>
        <p style="margin: 0; color: #6B6B6B; font-size: 14px;">Vous vendez ? Meublez virtuellement pour accélérer la vente.</p>
      </div>
    </div>
    
    <div style="text-align: center; margin: 24px 0;">
      <a href="https://instadeco.app/signup"
         style="display: inline-block; background: linear-gradient(135deg, #E07B54, #D4603C); color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px;">
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
    <h2 style="color: #1d1d1f; font-size: 22px; margin: 0 0 16px;">Dernière chance : -20% pour vous 🎁</h2>
    
    <p style="color: #6B6B6B; line-height: 1.6; margin: 0 0 16px;">
      Bonjour ${name}, cela fait une semaine que vous avez découvert InstaDeco.
      Pour fêter ça, voici une offre exclusive :
    </p>

    <div style="background: linear-gradient(135deg, #FFF8F5, #FFF0EB); border-radius: 16px; padding: 24px; margin: 0 0 24px; border: 2px solid #E07B54; text-align: center;">
      <p style="font-size: 36px; font-weight: 800; color: #E07B54; margin: 0 0 8px;">-20%</p>
      <p style="font-size: 18px; font-weight: 600; color: #1d1d1f; margin: 0 0 8px;">sur votre premier pack</p>
      <p style="color: #6B6B6B; font-size: 14px; margin: 0 0 4px;">
        25 crédits : <span style="text-decoration: line-through;">19,90 €</span> → <strong style="color: #E07B54;">15,92 €</strong>
      </p>
      <p style="color: #636366; font-size: 12px; margin: 8px 0 0;">
        ⏰ Offre valable 48h uniquement
      </p>
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="https://instadeco.app/signup"
         style="display: inline-block; background: linear-gradient(135deg, #E07B54, #D4603C); color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px;">
        Créer mon compte + profiter du -20% →
      </a>
    </div>
    
    <div style="text-align: center; margin: 0 0 16px;">
      <a href="${pricingUrl}"
         style="display: inline-block; background: white; color: #E07B54; text-decoration: none; padding: 10px 24px; border-radius: 50px; font-weight: 600; font-size: 14px; border: 2px solid #E07B54;">
        Voir les tarifs →
      </a>
    </div>
    
    <p style="color: #636366; font-size: 13px; text-align: center; margin: 16px 0 0;">
      Pas intéressé ? Pas de souci — votre essai gratuit reste disponible sur inscription.
    </p>
  `, unsubUrl);
}
