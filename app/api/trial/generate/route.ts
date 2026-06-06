/**
 * ⚠️⚠️⚠️ FICHIER CRITIQUE — NE PAS MODIFIER SANS RAISON MAJEURE ⚠️⚠️⚠️
 *
 * POST /api/trial/generate — Essai gratuit sans authentification.
 *
 * La GÉNÉRATION passe désormais par la clean architecture :
 *   route → TrialGenerateUseCase → IImageGeneratorService (provider factory).
 * Le provider (Flux / Gemini) est choisi par IMAGE_PROVIDER. Le comportement
 * reste SYNCHRONE (le service Fal fait fal.storage.upload() + fal.run(), JAMAIS
 * de queue/polling — voir FalImageGeneratorService).
 *
 * Cette route ne garde que ses préoccupations TRANSPORT / ANTI-ABUS :
 *   1. Rate limit mémoire (1 essai/IP/24h)
 *   2. Supabase trial_usage (IP + fingerprint) — persistant
 *   3. localStorage côté client — UX immédiate (hors backend)
 *
 * Lire docs/GENERATION_ARCHITECTURE.md pour l'architecture complète.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, getClientIP, isDevBypass } from '@/lib/security/rate-limiter';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { isSupportedImageBase64 } from '@/src/shared/utils/image-size';
import { useCases } from '@/src/infrastructure/config/di-container';

/**
 * Schéma de validation pour l'essai gratuit
 */
const trialRequestSchema = z.object({
  imageBase64: z
    .string()
    .min(100, 'Image requise')
    // ~10 Mo de base64 ≈ 7.5 Mo binaire — borne anti-DoS / bombe de payload (route non authentifiée)
    .max(10_000_000, 'Image trop volumineuse (max ~7,5 Mo)')
    .refine((val) => val.startsWith('data:image/'), 'Seuls les data URIs image sont acceptés')
    // Validation par MAGIC BYTES (le préfixe data:image/ est falsifiable)
    .refine(isSupportedImageBase64, 'Format non supporté (JPEG, PNG ou WEBP uniquement)'),
  roomType: z.string().max(50).regex(/^[a-z0-9-]+$/).default('salon'),
  style: z.string().max(50).regex(/^[a-z0-9-]+$/).default('moderne'),
  fingerprint: z.string().max(64).optional(),
});

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * Vérifie si un essai a déjà été effectué via Supabase (persistant).
 * Regarde l'IP ET le fingerprint navigateur.
 */
async function hasTrialBeenUsed(ip: string, fingerprint?: string): Promise<boolean> {
  try {
    // Vérifier par IP (dernières 48h)
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    console.log(`[Trial] 🔍 Checking trial usage for IP: ${ip}, fingerprint: ${fingerprint?.substring(0, 8) || 'none'}`);

    const { data: ipMatch, error: ipError } = await supabaseAdmin
      .from('trial_usage')
      .select('id')
      .eq('ip_address', ip)
      .gte('created_at', since)
      .limit(1);

    if (ipError) {
      console.warn(`[Trial] ⚠️ Supabase IP check error (table may not exist):`, ipError.message, ipError.code);
      return false; // Fallback: pas de blocage si table absente
    }

    if (ipMatch && ipMatch.length > 0) {
      console.log(`[Trial] ⛔ IP ${ip} already used trial`);
      return true;
    }

    // Vérifier par fingerprint (si fourni) — toutes dates confondues
    if (fingerprint) {
      const { data: fpMatch, error: fpError } = await supabaseAdmin
        .from('trial_usage')
        .select('id')
        .eq('fingerprint', fingerprint)
        .limit(1);

      if (fpError) {
        console.warn(`[Trial] ⚠️ Supabase fingerprint check error:`, fpError.message);
        return false;
      }

      if (fpMatch && fpMatch.length > 0) {
        console.log(`[Trial] ⛔ Fingerprint ${fingerprint.substring(0, 8)} already used trial`);
        return true;
      }
    }

    console.log(`[Trial] ✅ No previous trial found`);
    return false;
  } catch (error: any) {
    // En cas d'erreur DB (ex: table n'existe pas encore), on fallback sur le rate limiter mémoire
    console.warn('[Trial] ⚠️ DB check failed, falling back to memory rate limiter:', error?.message || error);
    return false;
  }
}

/**
 * Enregistre un essai dans Supabase pour persistance.
 */
async function recordTrialUsage(ip: string, fingerprint?: string, style?: string, roomType?: string): Promise<void> {
  try {
    console.log(`[Trial] 💾 Recording trial usage: IP=${ip}, fp=${fingerprint?.substring(0, 8) || 'none'}`);
    const { error } = await supabaseAdmin
      .from('trial_usage')
      .insert({
        ip_address: ip,
        fingerprint: fingerprint || null,
        style,
        room_type: roomType,
      });

    if (error) {
      console.warn(`[Trial] ⚠️ Failed to record trial (table may not exist):`, error.message, error.code);
      // Ne pas bloquer la génération si l'enregistrement échoue
    } else {
      console.log(`[Trial] ✅ Trial usage recorded successfully`);
    }
  } catch (error: any) {
    console.warn('[Trial] ⚠️ Failed to record trial usage:', error?.message || error);
    // Ne pas bloquer la génération si l'enregistrement échoue
  }
}

/**
 * POST /api/trial/generate
 *
 * Essai gratuit sans authentification.
 * Anti-abus multi-couche :
 *  1. Rate limit mémoire (1 essai/IP/24h) — protection immédiate
 *  2. Supabase trial_usage (IP + fingerprint) — protection persistante
 *  3. localStorage côté client — UX immédiate
 */
export async function POST(req: Request) {
  console.log('[Trial] 🚀 Starting trial generation');

  const clientIP = getClientIP(req.headers);
  const devMode = isDevBypass(req.headers);

  if (devMode) {
    console.log(`[Trial] 🔓 Dev bypass actif — skip rate limits`);
  }

  // Couche 1 : Rate limit mémoire (protection même si DB down)
  if (!devMode) {
    const rateLimitResult = checkRateLimit(clientIP, {
      maxRequests: 1,
      windowSeconds: 86400, // 24h
      prefix: 'trial',
    });

    if (!rateLimitResult.success) {
      console.warn(`[Trial] ⛔ Memory rate limit exceeded for IP: ${clientIP}`);
      return NextResponse.json(
        {
          error: 'Vous avez déjà utilisé votre essai gratuit. Créez un compte pour continuer !',
          code: 'TRIAL_USED',
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429 }
      );
    }
  }

  try {
    const body = await req.json();
    const validation = trialRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { imageBase64, roomType, style, fingerprint } = validation.data;

    // Couche 2 : Vérification persistante Supabase (IP + fingerprint)
    const alreadyUsed = devMode ? false : await hasTrialBeenUsed(clientIP, fingerprint);
    if (alreadyUsed) {
      console.warn(`[Trial] ⛔ Persistent check: trial already used for IP: ${clientIP}, fp: ${fingerprint?.substring(0, 8)}...`);
      return NextResponse.json(
        {
          error: 'Vous avez déjà utilisé votre essai gratuit. Créez un compte pour continuer !',
          code: 'TRIAL_USED',
        },
        { status: 429 }
      );
    }

    // Génération SYNCHRONE déléguée au use case (provider sélectionné par IMAGE_PROVIDER).
    console.log(`[Trial] 🎨 Generating (synchronous via use case)... style=${style}, room=${roomType}`);
    const result = await useCases.trialGenerate.execute({ imageBase64, style, roomType });

    if (!result.success) {
      console.error('[Trial] ❌ Generation failed:', (result.error as Error)?.message);
      return NextResponse.json(
        { error: 'Erreur lors de la génération. Réessayez.', detail: (result.error as Error)?.message },
        { status: 500 }
      );
    }

    const { imageUrl } = result.data;
    console.log(`[Trial] ✅ Image generated: ${imageUrl.substring(0, 60)}...`);

    // Enregistrer l'essai dans Supabase (persistant entre redéploiements)
    if (!devMode) {
      await recordTrialUsage(clientIP, fingerprint, style, roomType);
    } else {
      console.log(`[Trial] 🔓 Dev bypass — skip recordTrialUsage`);
    }

    return NextResponse.json({
      imageUrl,
      message: 'Génération terminée',
    });
  } catch (error: any) {
    console.error('[Trial] ❌ Unhandled error:', error?.message || error, error?.stack?.split('\n').slice(0, 3).join(' | '));
    return NextResponse.json(
      { error: 'Erreur lors de la génération. Réessayez.', detail: error?.message },
      { status: 500 }
    );
  }
}
