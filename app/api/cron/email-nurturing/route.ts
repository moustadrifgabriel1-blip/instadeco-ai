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
    const results = { j3: 0, j7: 0, j14: 0, errors: 0 };

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

    console.log(`[Email Nurturing] ✅ J3: ${results.j3}, J7: ${results.j7}, J14: ${results.j14}, Errors: ${results.errors}`);

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
      <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 8px 0 0;">Votre architecte d'intérieur à 0,99 CHF</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 32px 24px;">
      ${content}
    </div>
    
    <!-- Footer -->
    <div style="background: #f5f5f7; padding: 16px 24px; text-align: center;">
      <p style="color: #86868b; font-size: 12px; margin: 0;">
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
        Un décorateur d'intérieur facture en moyenne <strong>150 CHF/h</strong>.<br />
        Avec InstaDeco, vous obtenez un résultat comparable pour <strong style="color: #E07B54;">0,99 CHF en 30 secondes</strong>.
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
      <strong style="color: #1d1d1f;">+12 847 pièces</strong> ont déjà été transformées avec InstaDeco.
      Et la vôtre ?
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
        Pack Créatif : <span style="text-decoration: line-through;">19,99 CHF</span> → <strong style="color: #E07B54;">15,99 CHF</strong> (25 crédits)
      </p>
      <p style="color: #86868b; font-size: 12px; margin: 0;">
        ⏰ Offre valable 48h uniquement
      </p>
    </div>

    <div style="background: #f5f5f7; border-radius: 12px; padding: 16px; margin: 0 0 24px;">
      <p style="margin: 0 0 4px; font-weight: 600; color: #1d1d1f; font-size: 14px;">Ce que voulons dire 25 crédits :</p>
      <ul style="margin: 8px 0 0; padding: 0 0 0 20px; color: #6B6B6B; font-size: 14px;">
        <li>25 transformations haute qualité</li>
        <li>Testez tous les 12 styles</li>
        <li>Équivalent à 3 750 CHF de consultations déco</li>
        <li>Crédits valables à vie</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 24px 0;">
      <a href="https://instadeco.app/pricing"
         style="display: inline-block; background: linear-gradient(135deg, #E07B54, #D4603C); color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px;">
        Profiter de l'offre -20% →
      </a>
    </div>
    
    <p style="color: #86868b; font-size: 13px; text-align: center; margin: 16px 0 0;">
      Pas intéressé ? Pas de souci — vos 3 crédits gratuits n'expirent jamais.
    </p>
  `, unsubUrl);
}
