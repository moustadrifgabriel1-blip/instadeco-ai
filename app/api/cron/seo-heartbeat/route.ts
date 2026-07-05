/**
 * API Route: /api/cron/seo-heartbeat
 *
 * Heartbeat du moteur SEO (seo-engine sur le VPS Hetzner). Rend visible le fait
 * que les crons tournent encore, alors que leurs rapports sont gitignores et
 * restent sur le VPS (cause de mort n°2 du pre-mortem : moteur qui meurt en
 * silence).
 *
 * POST : appele par scripts/seo-engine/run-seo-engine.sh apres CHAQUE job.
 *        Corps { job, status: 'ok'|'error', detail? }. Upsert une ligne par job
 *        dans seo_engine_heartbeats (on ne garde que la derniere execution).
 *
 * GET  : health check lisible d'un coup d'oeil. Renvoie chaque job avec son age
 *        et un flag `stale` selon la cadence attendue, plus un verdict global
 *        `alive` (au moins un job quotidien a tourne dans les 2 jours).
 *
 * Securise par CRON_SECRET (verifyCronAuth), comme les autres routes cron.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyCronAuth, unauthorizedResponse } from '@/src/infrastructure/middleware/cronAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Cadence attendue par job (en heures) : au-dela, le job est repute perime.
// gsc_daily / drift_check tournent chaque jour, rank_tracker / ctr_optimizer
// chaque lundi. On tolere une marge (48h pour le quotidien, 8j pour l'hebdo).
const JOB_MAX_AGE_HOURS: Record<string, number> = {
  gsc_daily: 48,
  drift_check: 48,
  rank_tracker: 192,
  ctr_optimizer: 192,
  competitor_diff: 192,
  citation_batch: 792, // mensuel
};

const KNOWN_JOBS = Object.keys(JOB_MAX_AGE_HOURS);

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(request: NextRequest) {
  const { authorized, error } = verifyCronAuth(request);
  if (!authorized) {
    return unauthorizedResponse(error);
  }

  const body = (await request.json().catch(() => null)) as
    | { job?: string; status?: string; detail?: unknown }
    | null;

  const job = typeof body?.job === 'string' ? body.job.trim() : '';
  const status = body?.status === 'error' ? 'error' : 'ok';

  if (!job || !KNOWN_JOBS.includes(job)) {
    return NextResponse.json(
      { success: false, error: `job inconnu ou absent (attendus: ${KNOWN_JOBS.join(', ')})` },
      { status: 400 },
    );
  }

  const supabase = serviceClient();
  const now = new Date().toISOString();
  const { error: upsertError } = await supabase.from('seo_engine_heartbeats').upsert(
    {
      job,
      status,
      ran_at: now,
      updated_at: now,
      detail: body?.detail ?? null,
    },
    { onConflict: 'job' },
  );

  if (upsertError) {
    console.error('[seo-heartbeat] upsert échoué:', upsertError);
    return NextResponse.json({ success: false, error: 'Écriture heartbeat échouée' }, { status: 500 });
  }

  return NextResponse.json({ success: true, job, status, ran_at: now });
}

export async function GET(request: NextRequest) {
  const { authorized, error } = verifyCronAuth(request);
  if (!authorized) {
    return unauthorizedResponse(error);
  }

  const supabase = serviceClient();
  const { data, error: selectError } = await supabase
    .from('seo_engine_heartbeats')
    .select('job, status, ran_at, detail')
    .order('ran_at', { ascending: false });

  if (selectError) {
    return NextResponse.json({ success: false, error: 'Lecture heartbeat échouée' }, { status: 500 });
  }

  const nowMs = Date.now();
  const jobs = (data ?? []).map((row) => {
    const ageHours = (nowMs - new Date(row.ran_at).getTime()) / 3_600_000;
    const maxAge = JOB_MAX_AGE_HOURS[row.job] ?? 48;
    return {
      job: row.job,
      status: row.status,
      ran_at: row.ran_at,
      age_hours: Math.round(ageHours * 10) / 10,
      stale: ageHours > maxAge,
      last_error: row.status === 'error',
    };
  });

  // Vivant si au moins un job quotidien a tourne dans sa fenetre de fraicheur.
  const daily = jobs.filter((j) => j.job === 'gsc_daily' || j.job === 'drift_check');
  const alive = daily.some((j) => !j.stale);
  const staleJobs = jobs.filter((j) => j.stale).map((j) => j.job);

  return NextResponse.json({
    success: true,
    alive,
    checked_at: new Date(nowMs).toISOString(),
    stale_jobs: staleJobs,
    jobs,
  });
}
