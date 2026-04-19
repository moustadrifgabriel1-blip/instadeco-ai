/**
 * API Route: /api/cron/seo-health-check
 *
 * Vérification complète de la santé SEO d'InstaDeco.
 * Exécuté tous les 14 jours (1er et 15 du mois à 7h UTC).
 *
 * Score global /100 + rapport détaillé envoyé par email + webhook.
 *
 * Contrôles :
 *  1. Sitemap accessible et non vide
 *  2. robots.txt accessible
 *  3. RSS feed valide
 *  4. Pages clés (home, /blog, /pricing, /generate) → 200
 *  5. Top 20 articles blog → 200 (pas de 404)
 *  6. Échantillon pages villes → 200
 *  7. Nb articles publiés les 14 derniers jours (doit être ≥ 14)
 *  8. Doublons de titres dans le blog
 *  9. IndexNow key accessible à /<key>.txt
 * 10. Core Web Vitals via PageSpeed API (home + 1 article)
 * 11. Score /100 + sauvegarde en base pour historique
 */

import { NextRequest, NextResponse } from 'next/server';
import { SEO_CONFIG } from '@/lib/seo/config';

export const runtime = 'nodejs';
export const maxDuration = 300; // PageSpeed peut être lent
export const dynamic = 'force-dynamic';

// ============================================================
// TYPES
// ============================================================

interface CheckResult {
  name: string;
  category: 'critical' | 'high' | 'medium' | 'low';
  status: 'pass' | 'warn' | 'fail';
  detail: string;
  scoreImpact: number; // points perdus si fail (0 si pass)
}

interface HealthReport {
  timestamp: string;
  scoreOut100: number;
  verdict: 'excellent' | 'good' | 'warning' | 'critical';
  summary: {
    passed: number;
    warnings: number;
    failures: number;
    totalChecks: number;
  };
  checks: CheckResult[];
  coreWebVitals?: {
    home: { mobile: number | null; desktop: number | null };
    article: { mobile: number | null; desktop: number | null };
  };
  recommendations: string[];
}

// ============================================================
// AUTH
// ============================================================

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  if (authHeader === `Bearer ${cronSecret}`) return true;
  const vercelSignature = request.headers.get('x-vercel-signature');
  return !!vercelSignature;
}

// ============================================================
// HELPERS
// ============================================================

const BASE_URL = SEO_CONFIG.siteUrl.replace(/\/$/, '');
const FETCH_TIMEOUT_MS = 10_000;

async function fetchWithTimeout(url: string, ms = FETCH_TIMEOUT_MS): Promise<Response> {
  return fetch(url, {
    signal: AbortSignal.timeout(ms),
    headers: { 'User-Agent': 'InstaDeco-SEO-HealthCheck/1.0' },
    cache: 'no-store',
  });
}

function pass(name: string, detail: string, category: CheckResult['category'] = 'medium'): CheckResult {
  return { name, category, status: 'pass', detail, scoreImpact: 0 };
}

function warn(name: string, detail: string, category: CheckResult['category'], scoreImpact: number): CheckResult {
  return { name, category, status: 'warn', detail, scoreImpact };
}

function fail(name: string, detail: string, category: CheckResult['category'], scoreImpact: number): CheckResult {
  return { name, category, status: 'fail', detail, scoreImpact };
}

// ============================================================
// CHECKS INDIVIDUELS
// ============================================================

async function checkSitemap(): Promise<CheckResult> {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/sitemap.xml`);
    if (!res.ok) {
      return fail('Sitemap accessible', `HTTP ${res.status} sur /sitemap.xml`, 'critical', 15);
    }
    const text = await res.text();
    const urlCount = (text.match(/<url>/g) || []).length;
    if (urlCount < 50) {
      return warn('Sitemap accessible', `Seulement ${urlCount} URLs (attendu > 50)`, 'high', 5);
    }
    return pass('Sitemap accessible', `${urlCount} URLs dans le sitemap`, 'critical');
  } catch (e) {
    return fail('Sitemap accessible', (e as Error).message, 'critical', 15);
  }
}

async function checkRobots(): Promise<CheckResult> {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/robots.txt`);
    if (!res.ok) return fail('robots.txt accessible', `HTTP ${res.status}`, 'critical', 10);
    const text = await res.text();
    if (!text.toLowerCase().includes('sitemap')) {
      return warn('robots.txt accessible', 'robots.txt ne référence pas le sitemap', 'medium', 3);
    }
    return pass('robots.txt accessible', `${text.length} octets, sitemap référencé`, 'critical');
  } catch (e) {
    return fail('robots.txt accessible', (e as Error).message, 'critical', 10);
  }
}

async function checkRss(): Promise<CheckResult> {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/api/rss`);
    if (!res.ok) return fail('RSS feed valide', `HTTP ${res.status}`, 'medium', 3);
    const text = await res.text();
    if (!text.includes('<rss') && !text.includes('<feed')) {
      return fail('RSS feed valide', 'Format RSS/Atom invalide', 'medium', 3);
    }
    const itemCount = (text.match(/<item>/g) || []).length;
    return pass('RSS feed valide', `${itemCount} items dans le feed`, 'medium');
  } catch (e) {
    return fail('RSS feed valide', (e as Error).message, 'medium', 3);
  }
}

async function checkKeyPages(): Promise<CheckResult[]> {
  const pages = [
    { path: '/', name: 'Home' },
    { path: '/blog', name: 'Blog index' },
    { path: '/pricing', name: 'Pricing' },
    { path: '/generate', name: 'Generate' },
    { path: '/exemples', name: 'Exemples' },
    { path: '/architecte-interieur', name: 'Architecte intérieur' },
  ];
  const results: CheckResult[] = [];
  for (const p of pages) {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}${p.path}`);
      if (res.status === 200) {
        results.push(pass(`Page ${p.name}`, `HTTP 200`, 'high'));
      } else {
        results.push(fail(`Page ${p.name}`, `HTTP ${res.status} sur ${p.path}`, 'high', 5));
      }
    } catch (e) {
      results.push(fail(`Page ${p.name}`, (e as Error).message, 'high', 5));
    }
  }
  return results;
}

async function checkArticleFrequency(): Promise<CheckResult> {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const { count, error } = await supabase
      .from('blog_articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('published_at', fourteenDaysAgo);

    if (error) return fail('Fréquence publication', `DB: ${error.message}`, 'high', 8);
    const nb = count || 0;

    if (nb >= 14) return pass('Fréquence publication', `${nb} articles publiés en 14j (objectif ≥14)`, 'high');
    if (nb >= 7) return warn('Fréquence publication', `${nb} articles en 14j (objectif 14, cron ralenti ?)`, 'high', 5);
    return fail('Fréquence publication', `Seulement ${nb} articles en 14j ! Cron generate-articles en panne ?`, 'high', 12);
  } catch (e) {
    return fail('Fréquence publication', (e as Error).message, 'high', 8);
  }
}

async function checkDuplicateTitles(): Promise<CheckResult> {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data } = await supabase
      .from('blog_articles')
      .select('title')
      .eq('status', 'published')
      .limit(1000);

    if (!data) return pass('Pas de titres doublons', 'Aucun article publié', 'medium');

    const normalized = data.map((a) => a.title.toLowerCase().trim());
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    for (const t of normalized) {
      if (seen.has(t)) duplicates.add(t);
      seen.add(t);
    }
    if (duplicates.size === 0) {
      return pass('Pas de titres doublons', `${data.length} titres uniques`, 'medium');
    }
    return warn('Pas de titres doublons', `${duplicates.size} doublons détectés`, 'medium', 4);
  } catch (e) {
    return warn('Pas de titres doublons', (e as Error).message, 'medium', 2);
  }
}

async function checkTopArticles(): Promise<CheckResult> {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data } = await supabase
      .from('blog_articles')
      .select('slug')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(20);

    if (!data || data.length === 0) {
      return warn('Top 20 articles accessibles', 'Aucun article en base', 'medium', 3);
    }

    let failures = 0;
    const failedSlugs: string[] = [];
    // Vérif en parallèle limité
    const results = await Promise.allSettled(
      data.map((a) => fetchWithTimeout(`${BASE_URL}/blog/${a.slug}`, 8000))
    );
    results.forEach((r, i) => {
      if (r.status === 'rejected' || (r.status === 'fulfilled' && r.value.status !== 200)) {
        failures++;
        failedSlugs.push(data[i].slug);
      }
    });

    if (failures === 0) return pass('Top 20 articles accessibles', `${data.length}/20 en HTTP 200`, 'high');
    if (failures <= 2) return warn('Top 20 articles accessibles', `${failures} erreurs: ${failedSlugs.join(', ')}`, 'high', 4);
    return fail('Top 20 articles accessibles', `${failures} articles en erreur ! ${failedSlugs.slice(0, 3).join(', ')}...`, 'high', 10);
  } catch (e) {
    return warn('Top 20 articles accessibles', (e as Error).message, 'high', 4);
  }
}

async function checkCities(): Promise<CheckResult> {
  try {
    const { CITIES } = await import('@/src/shared/constants/cities');
    const sample = CITIES.slice(0, 5); // Échantillon 5 villes
    let failures = 0;
    for (const city of sample) {
      try {
        const res = await fetchWithTimeout(`${BASE_URL}/architecte-interieur/${city.slug}`, 8000);
        if (res.status !== 200) failures++;
      } catch {
        failures++;
      }
    }
    if (failures === 0) return pass('Pages villes (échantillon)', `5/5 villes OK`, 'medium');
    return warn('Pages villes (échantillon)', `${failures}/5 en erreur`, 'medium', failures * 2);
  } catch (e) {
    return warn('Pages villes (échantillon)', (e as Error).message, 'medium', 2);
  }
}

async function checkIndexNowKey(): Promise<CheckResult> {
  const key = SEO_CONFIG.indexNowKey;
  if (!key) return warn('IndexNow key configurée', 'INDEXNOW_KEY non définie (articles pas signalés instantanément à Bing/Yandex)', 'medium', 4);
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/${key}.txt`);
    if (!res.ok) return fail('IndexNow key servie', `HTTP ${res.status} sur /${key}.txt`, 'medium', 5);
    const text = (await res.text()).trim();
    if (text !== key) return fail('IndexNow key servie', `Contenu ${text.slice(0, 20)} ≠ clé`, 'medium', 5);
    return pass('IndexNow key servie', `Clé accessible à /${key.slice(0, 8)}...txt`, 'medium');
  } catch (e) {
    return fail('IndexNow key servie', (e as Error).message, 'medium', 5);
  }
}

async function checkPageSpeed(url: string, strategy: 'mobile' | 'desktop'): Promise<number | null> {
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!apiKey) return null;
  try {
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&category=performance&key=${apiKey}`;
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(60_000) });
    if (!res.ok) return null;
    const json = await res.json();
    const score = json?.lighthouseResult?.categories?.performance?.score;
    return typeof score === 'number' ? Math.round(score * 100) : null;
  } catch {
    return null;
  }
}

async function checkCoreWebVitals(): Promise<{
  checks: CheckResult[];
  vitals: HealthReport['coreWebVitals'];
}> {
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!apiKey) {
    return {
      checks: [warn('Core Web Vitals', 'PAGESPEED_API_KEY non configurée', 'medium', 3)],
      vitals: undefined,
    };
  }

  // Home
  const homeMobile = await checkPageSpeed(BASE_URL, 'mobile');
  const homeDesktop = await checkPageSpeed(BASE_URL, 'desktop');

  // 1 article récent
  let articleMobile: number | null = null;
  let articleDesktop: number | null = null;
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data } = await supabase
      .from('blog_articles')
      .select('slug')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.slug) {
      articleMobile = await checkPageSpeed(`${BASE_URL}/blog/${data.slug}`, 'mobile');
      articleDesktop = await checkPageSpeed(`${BASE_URL}/blog/${data.slug}`, 'desktop');
    }
  } catch {}

  const checks: CheckResult[] = [];

  if (homeMobile !== null) {
    if (homeMobile >= 75) checks.push(pass('Performance Home (mobile)', `Score ${homeMobile}/100`, 'high'));
    else if (homeMobile >= 50) checks.push(warn('Performance Home (mobile)', `Score ${homeMobile}/100 (cible ≥75)`, 'high', 5));
    else checks.push(fail('Performance Home (mobile)', `Score ${homeMobile}/100 ! Core Web Vitals à risque`, 'high', 10));
  }
  if (homeDesktop !== null) {
    if (homeDesktop >= 85) checks.push(pass('Performance Home (desktop)', `Score ${homeDesktop}/100`, 'medium'));
    else if (homeDesktop >= 70) checks.push(warn('Performance Home (desktop)', `Score ${homeDesktop}/100 (cible ≥85)`, 'medium', 3));
    else checks.push(fail('Performance Home (desktop)', `Score ${homeDesktop}/100`, 'medium', 6));
  }
  if (articleMobile !== null) {
    if (articleMobile >= 70) checks.push(pass('Performance Article (mobile)', `Score ${articleMobile}/100`, 'medium'));
    else checks.push(warn('Performance Article (mobile)', `Score ${articleMobile}/100 (cible ≥70)`, 'medium', 4));
  }

  return {
    checks,
    vitals: {
      home: { mobile: homeMobile, desktop: homeDesktop },
      article: { mobile: articleMobile, desktop: articleDesktop },
    },
  };
}

// ============================================================
// NOTIFICATIONS (Webhook + Email)
// ============================================================

async function sendWebhookReport(report: HealthReport): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const emoji =
    report.verdict === 'excellent' ? '🟢' :
    report.verdict === 'good' ? '🟢' :
    report.verdict === 'warning' ? '🟡' : '🔴';

  const criticalIssues = report.checks
    .filter((c) => c.status === 'fail' && (c.category === 'critical' || c.category === 'high'))
    .slice(0, 5)
    .map((c) => `• ${c.name} — ${c.detail}`)
    .join('\n');

  const message = [
    `${emoji} *Rapport SEO Health Check — InstaDeco*`,
    `*Score :* ${report.scoreOut100}/100 (${report.verdict})`,
    `✅ ${report.summary.passed} | ⚠️ ${report.summary.warnings} | ❌ ${report.summary.failures}`,
    criticalIssues ? `\n*À corriger en priorité :*\n${criticalIssues}` : '\nAucun incident critique.',
    `\n🔍 Rapport complet : ${BASE_URL}/api/cron/seo-health-check (avec Bearer CRON_SECRET)`,
  ].join('\n');

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message, content: message }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Ne pas faire échouer le cron si le webhook échoue
  }
}

async function sendEmailReport(report: HealthReport): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.SEO_REPORT_EMAIL;
  const from = process.env.EMAIL_FROM || 'InstaDeco <noreply@instadeco.app>';
  if (!apiKey || !to) return;

  const emoji = report.verdict === 'critical' ? '🔴' : report.verdict === 'warning' ? '🟡' : '🟢';

  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; color: #1d1d1f;">
      <h1 style="font-size: 24px; margin: 0 0 8px;">${emoji} Rapport SEO InstaDeco</h1>
      <p style="color: #6e6e73; margin: 0 0 24px; font-size: 14px;">${new Date(report.timestamp).toLocaleString('fr-FR')}</p>
      <div style="background: linear-gradient(135deg, #E07B54 0%, #f59e0b 100%); color: white; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
        <div style="font-size: 56px; font-weight: 800; line-height: 1;">${report.scoreOut100}</div>
        <div style="font-size: 14px; opacity: 0.9; margin-top: 4px;">sur 100 — ${report.verdict}</div>
      </div>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;">
        <div style="background: #ecfdf5; padding: 12px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; font-weight: 700; color: #059669;">${report.summary.passed}</div>
          <div style="font-size: 12px; color: #047857;">Validés</div>
        </div>
        <div style="background: #fffbeb; padding: 12px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; font-weight: 700; color: #d97706;">${report.summary.warnings}</div>
          <div style="font-size: 12px; color: #92400e;">Alertes</div>
        </div>
        <div style="background: #fef2f2; padding: 12px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; font-weight: 700; color: #dc2626;">${report.summary.failures}</div>
          <div style="font-size: 12px; color: #991b1b;">Échecs</div>
        </div>
      </div>
      <h2 style="font-size: 18px; margin: 24px 0 12px;">Détails des vérifications</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        ${report.checks.map((c) => `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 8px;">${c.status === 'pass' ? '✅' : c.status === 'warn' ? '⚠️' : '❌'}</td>
            <td style="padding: 10px 8px;"><strong>${c.name}</strong><br><span style="color: #6e6e73; font-size: 12px;">${c.detail}</span></td>
          </tr>
        `).join('')}
      </table>
      ${report.recommendations.length > 0 ? `
        <h2 style="font-size: 18px; margin: 24px 0 12px;">Recommandations</h2>
        <ul style="color: #374151; font-size: 14px; line-height: 1.6;">
          ${report.recommendations.map((r) => `<li>${r}</li>`).join('')}
        </ul>
      ` : ''}
      <p style="color: #9ca3af; font-size: 12px; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
        Rapport généré automatiquement tous les 14 jours. Pour désactiver, retire <code>SEO_REPORT_EMAIL</code> des variables d'environnement.
      </p>
    </div>
  `;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `${emoji} SEO Health Check InstaDeco — ${report.scoreOut100}/100`,
        html,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    // Silence: le rapport reste disponible via l'endpoint
  }
}

// ============================================================
// HANDLER
// ============================================================

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // Exécuter les checks en séquence (simpler pour tracer les erreurs)
    const checks: CheckResult[] = [];
    checks.push(await checkSitemap());
    checks.push(await checkRobots());
    checks.push(await checkRss());
    checks.push(...(await checkKeyPages()));
    checks.push(await checkArticleFrequency());
    checks.push(await checkDuplicateTitles());
    checks.push(await checkTopArticles());
    checks.push(await checkCities());
    checks.push(await checkIndexNowKey());

    const cwv = await checkCoreWebVitals();
    checks.push(...cwv.checks);

    // Calcul score
    const totalImpact = checks.reduce((sum, c) => sum + c.scoreImpact, 0);
    const scoreOut100 = Math.max(0, Math.min(100, 100 - totalImpact));

    const summary = {
      passed: checks.filter((c) => c.status === 'pass').length,
      warnings: checks.filter((c) => c.status === 'warn').length,
      failures: checks.filter((c) => c.status === 'fail').length,
      totalChecks: checks.length,
    };

    const verdict: HealthReport['verdict'] =
      scoreOut100 >= 90 ? 'excellent' :
      scoreOut100 >= 75 ? 'good' :
      scoreOut100 >= 55 ? 'warning' : 'critical';

    // Recommandations auto
    const recommendations: string[] = [];
    checks.filter((c) => c.status === 'fail').forEach((c) => {
      if (c.name.includes('Fréquence publication')) recommendations.push('Vérifier que le cron /api/cron/generate-articles s\'exécute 3x/jour dans Vercel.');
      if (c.name.includes('Sitemap')) recommendations.push('Vérifier que le sitemap dynamique se génère sans erreur Supabase.');
      if (c.name.includes('IndexNow')) recommendations.push(`Générer une clé IndexNow (openssl rand -hex 16), la mettre dans INDEXNOW_KEY et créer /public/<key>.txt.`);
      if (c.name.includes('Performance Home (mobile)')) recommendations.push('Auditer les images LCP de la home et réduire le JavaScript tiers (GA, Meta Pixel).');
    });
    if (summary.warnings > 3) recommendations.push(`${summary.warnings} alertes à examiner de près pour éviter une dégradation.`);

    const report: HealthReport = {
      timestamp: new Date().toISOString(),
      scoreOut100,
      verdict,
      summary,
      checks,
      coreWebVitals: cwv.vitals,
      recommendations,
    };

    // Notifications
    await Promise.allSettled([
      sendWebhookReport(report),
      sendEmailReport(report),
    ]);

    // Sauvegarde historique en base (best-effort, table optionnelle)
    try {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();
      await supabase.from('seo_health_reports').insert({
        score: scoreOut100,
        verdict,
        passed: summary.passed,
        warnings: summary.warnings,
        failures: summary.failures,
        report: report as unknown as Record<string, unknown>,
      });
    } catch {
      // La table est optionnelle, on ignore si elle n'existe pas
    }

    return NextResponse.json(
      { ...report, durationMs: Date.now() - startTime },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[SEO Health Check] Fatal error:', error);
    return NextResponse.json(
      { error: 'Health check failed', detail: (error as Error).message },
      { status: 500 }
    );
  }
}
