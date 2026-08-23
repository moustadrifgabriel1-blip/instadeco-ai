import { NextResponse } from 'next/server';
import { checkRateLimitDistributed, getClientIP, RATE_LIMIT_CONFIGS } from '@/lib/security/rate-limiter';
import { useCases } from '@/src/infrastructure/config/di-container';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v2/payments/session-status?session_id=cs_…
 *
 * Statut PUBLIC d'une session de paiement, pour la page de succès d'un
 * acheteur sans compte (il revient de Stripe sans session Supabase, aucune
 * route authentifiée ne peut lui répondre). Renvoie uniquement : payé ou non,
 * crédits, pack, montant, et un email masqué.
 *
 * L'identifiant Stripe (cs_…) est long, aléatoire et connu du seul acheteur.
 * Rate-limité comme le checkout pour décourager toute énumération.
 */
export async function GET(req: Request) {
  const clientIP = getClientIP(req.headers);
  const rl = await checkRateLimitDistributed(clientIP, RATE_LIMIT_CONFIGS.checkout);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Réessayez dans un instant.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const sessionId = new URL(req.url).searchParams.get('session_id') || '';
  const result = await useCases.getCheckoutSessionStatus.execute(sessionId);

  if (!result.success) {
    const status = result.error.name === 'ValidationError' ? 400 : 404;
    return NextResponse.json({ error: result.error.message }, { status });
  }

  return NextResponse.json(
    { success: true, data: result.data },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
