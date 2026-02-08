import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkRateLimit, getClientIP } from '@/lib/security/rate-limiter';
import { z } from 'zod';

const leadSchema = z.object({
  email: z.string().email('Email invalide'),
  source: z.string().optional().default('lead_capture'),
});

/**
 * POST /api/v2/leads
 * Capture un lead (email) et l'enregistre dans Supabase.
 * Rate limited : 3 requêtes / 5 minutes par IP.
 */
export async function POST(req: Request) {
  try {
    // Rate limiting
    const ip = getClientIP(req.headers);
    const rateLimit = checkRateLimit(ip, {
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

    const { email, source } = parsed.data;

    // Vérifier si le lead existe déjà
    const { data: existing } = await supabaseAdmin
      .from('leads')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      // Pas d'erreur - on ne révèle pas si l'email est déjà enregistré
      return NextResponse.json({ success: true, message: 'Merci !' });
    }

    // Insérer le nouveau lead
    const { error } = await supabaseAdmin
      .from('leads')
      .insert({
        email: email.toLowerCase(),
        source,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[Leads] Insert error:', error);
      return NextResponse.json(
        { error: 'Erreur serveur' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Merci !' });
  } catch (error) {
    console.error('[Leads] Error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
