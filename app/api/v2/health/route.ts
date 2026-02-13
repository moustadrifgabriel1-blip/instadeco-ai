import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v2/health
 * 
 * Endpoint de diagnostic pour vérifier que tous les services
 * sont correctement configurés en production.
 * 
 * Utilisation : curl https://instadeco.app/api/v2/health
 */
export async function GET(req: Request) {
  const checks: Record<string, { ok: boolean; detail?: string }> = {};

  // 1. Variables d'environnement critiques
  const envVars = [
    'FAL_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_APP_URL',
    'STRIPE_PRICE_STARTER',
    'STRIPE_PRICE_PRO',
    'STRIPE_PRICE_UNLIMITED',
  ];

  for (const key of envVars) {
    const value = process.env[key];
    checks[`env:${key}`] = {
      ok: !!value && value.length > 0,
      detail: value ? `set (${value.length} chars)` : 'MISSING',
    };
  }

  // 2. NEXT_PUBLIC_APP_URL ne doit PAS être localhost en production
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  checks['env:APP_URL_not_localhost'] = {
    ok: !appUrl.includes('localhost'),
    detail: appUrl.includes('localhost') 
      ? `PROBLEM: "${appUrl}" — Les webhooks Fal.ai ne fonctionneront pas !` 
      : appUrl,
  };

  // 3. Supabase connection
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    checks['supabase:connection'] = {
      ok: !error,
      detail: error ? error.message : `Connected (found ${data?.length ?? 0} row)`,
    };
  } catch (e) {
    checks['supabase:connection'] = {
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
    };
  }

  // 4. Supabase Storage bucket "input-images"
  try {
    const { createClient: createAdmin } = await import('@supabase/supabase-js');
    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const { data: buckets, error } = await admin.storage.listBuckets();
    const inputBucket = buckets?.find(b => b.name === 'input-images');
    checks['supabase:bucket:input-images'] = {
      ok: !!inputBucket,
      detail: inputBucket ? 'EXISTS' : 'MISSING — Upload de photos échouera (500)',
    };

    const outputBucket = buckets?.find(b => b.name === 'output-images');
    checks['supabase:bucket:output-images'] = {
      ok: !!outputBucket,
      detail: outputBucket ? 'EXISTS' : 'MISSING — Sauvegarde des résultats échouera',
    };
  } catch (e) {
    checks['supabase:storage'] = {
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
    };
  }

  // 5. Supabase RPC deduct_credits fonctionne
  try {
    const { createClient: createAdmin } = await import('@supabase/supabase-js');
    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    // Test avec un UUID inexistant — on s'attend à une erreur "User not found", pas une erreur de fonction
    const { error } = await admin.rpc('deduct_credits', {
      user_id_input: '00000000-0000-0000-0000-000000000000',
      amount_input: 1,
    });
    checks['supabase:rpc:deduct_credits'] = {
      ok: !error || error.message.includes('User not found') || error.message.includes('not found'),
      detail: error ? error.message : 'Function exists and callable',
    };
  } catch (e) {
    checks['supabase:rpc:deduct_credits'] = {
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
    };
  }

  // 6. Fal.ai key format
  const falKey = process.env.FAL_KEY || process.env.FAL_API_KEY;
  checks['fal:key_format'] = {
    ok: !!falKey && falKey.includes(':'),
    detail: falKey ? `Format OK (contains separator)` : 'MISSING',
  };

  // 7. Vercel environment
  checks['vercel:region'] = {
    ok: true,
    detail: process.env.VERCEL_REGION || 'local',
  };
  checks['vercel:env'] = {
    ok: true,
    detail: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
  };

  // Résumé
  const allOk = Object.values(checks).every(c => c.ok);
  const failedChecks = Object.entries(checks)
    .filter(([, c]) => !c.ok)
    .map(([name, c]) => `${name}: ${c.detail}`);

  return NextResponse.json({
    status: allOk ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    failedChecks: failedChecks.length > 0 ? failedChecks : undefined,
    checks,
  }, { status: allOk ? 200 : 503 });
}
