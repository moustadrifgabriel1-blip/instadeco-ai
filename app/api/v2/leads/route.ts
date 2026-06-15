import { NextResponse } from 'next/server';
import { checkRateLimitDistributed, getClientIP } from '@/lib/security/rate-limiter';
import { z } from 'zod';
import { useCases } from '@/src/infrastructure/config/di-container';

const leadSchema = z.object({
  email: z.string().email('Email invalide'),
  source: z.string().optional().default('lead_capture'),
  name: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

/**
 * POST /api/v2/leads
 * Capture un lead (email) via CaptureLeadUseCase (DI). Rate limited : 3 req / 5 min par IP.
 */
export async function POST(req: Request) {
  try {
    // Rate limiting distribué
    const ip = getClientIP(req.headers);
    const rateLimit = await checkRateLimitDistributed(ip, {
      maxRequests: 3,
      windowSeconds: 300,
      prefix: 'leads',
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Réessayez plus tard.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter || 60) } }
      );
    }

    const body = await req.json();
    const parsed = leadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Données invalides' },
        { status: 400 }
      );
    }

    const { email, source, name, metadata } = parsed.data;

    const result = await useCases.captureLead.execute({ email, source, name, metadata });

    if (!result.success) {
      console.error('[Leads] error:', result.error.message);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    // Ne révèle pas si l'email était déjà enregistré (dédup silencieuse).
    return NextResponse.json({ success: true, message: 'Merci !' });
  } catch (error) {
    console.error('[Leads] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
