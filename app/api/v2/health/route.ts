import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v2/health
 *
 * Endpoint de diagnostic.
 *
 * - PUBLIC : renvoie uniquement un statut global (healthy/unhealthy) + code HTTP,
 *   sans aucun detail (pas de longueur de secret, ni nom de table/bucket/RPC, ni
 *   message d'erreur). Suffisant pour un monitoring d'uptime, zero reconnaissance.
 * - AUTHENTIFIE (Authorization: Bearer CRON_SECRET) : diagnostic complet, y compris
 *   les checks lourds (storage, RPC) qui ne tournent que dans ce cas.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const isAuthed =
    !!process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;

  const checks: Record<string, { ok: boolean; detail?: string }> = {};

  // 1. Variables d'environnement critiques (presence seule, jamais la longueur).
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
      detail: value ? 'set' : 'MISSING',
    };
  }

  // 2. NEXT_PUBLIC_APP_URL ne doit PAS être localhost en production.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  checks['env:APP_URL_not_localhost'] = {
    ok: !appUrl.includes('localhost'),
    detail: appUrl.includes('localhost') ? 'PROBLEM: localhost en prod' : 'ok',
  };

  // 3. Connexion Supabase (check leger, toujours execute).
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('profiles').select('id').limit(1);
    checks['supabase:connection'] = {
      ok: !error,
      detail: error ? 'error' : 'connected',
    };
  } catch {
    checks['supabase:connection'] = { ok: false, detail: 'error' };
  }

  // Checks lourds (storage, RPC) : seulement pour un appelant authentifie,
  // pour eviter qu'un anonyme declenche des appels admin a volonte.
  if (isAuthed) {
    try {
      const { createClient: createAdmin } = await import('@supabase/supabase-js');
      const admin = createAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      );
      const { data: buckets } = await admin.storage.listBuckets();
      checks['supabase:bucket:input-images'] = {
        ok: !!buckets?.find((b) => b.name === 'input-images'),
        detail: buckets?.find((b) => b.name === 'input-images') ? 'EXISTS' : 'MISSING',
      };
      checks['supabase:bucket:output-images'] = {
        ok: !!buckets?.find((b) => b.name === 'output-images'),
        detail: buckets?.find((b) => b.name === 'output-images') ? 'EXISTS' : 'MISSING',
      };
    } catch (e) {
      checks['supabase:storage'] = {
        ok: false,
        detail: e instanceof Error ? e.message : String(e),
      };
    }

    try {
      const { createClient: createAdmin } = await import('@supabase/supabase-js');
      const admin = createAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      );
      const { error } = await admin.rpc('deduct_credits', {
        user_id_input: '00000000-0000-0000-0000-000000000000',
        amount_input: 1,
      });
      checks['supabase:rpc:deduct_credits'] = {
        ok: !error || /not found/i.test(error.message),
        detail: error ? error.message : 'callable',
      };
    } catch (e) {
      checks['supabase:rpc:deduct_credits'] = {
        ok: false,
        detail: e instanceof Error ? e.message : String(e),
      };
    }

    const falKey = process.env.FAL_KEY || process.env.FAL_API_KEY;
    checks['fal:key_format'] = {
      ok: !!falKey && falKey.includes(':'),
      detail: falKey ? 'ok' : 'MISSING',
    };

    checks['vercel:region'] = { ok: true, detail: process.env.VERCEL_REGION || 'local' };
    checks['vercel:env'] = {
      ok: true,
      detail: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
    };
  }

  const allOk = Object.values(checks).every((c) => c.ok);
  const httpStatus = allOk ? 200 : 503;
  const status = allOk ? 'healthy' : 'unhealthy';
  const timestamp = new Date().toISOString();

  // Public : statut nu, aucun detail.
  if (!isAuthed) {
    return NextResponse.json({ status, timestamp }, { status: httpStatus });
  }

  // Authentifie : diagnostic complet.
  const failedChecks = Object.entries(checks)
    .filter(([, c]) => !c.ok)
    .map(([name, c]) => `${name}: ${c.detail}`);

  return NextResponse.json(
    {
      status,
      timestamp,
      failedChecks: failedChecks.length > 0 ? failedChecks : undefined,
      checks,
    },
    { status: httpStatus },
  );
}
