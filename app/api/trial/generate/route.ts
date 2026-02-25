/**
 * ⚠️⚠️⚠️ FICHIER CRITIQUE — NE PAS MODIFIER SANS RAISON MAJEURE ⚠️⚠️⚠️
 * 
 * POST /api/trial/generate — Essai gratuit sans authentification.
 * Utilise fal.run() en mode SYNCHRONE (10-20s).
 * 
 * FLUX : Image base64 → fal.storage.upload() → fal.run() → imageUrl retournée directement
 * 
 * ANTI-ABUS : 3 couches (mémoire rate limit + Supabase IP/fingerprint + localStorage)
 * 
 * RÈGLES :
 * 1. TOUJOURS fal.storage.upload() avant fal.run()
 * 2. JAMAIS fal.queue.submit() (re-exécute le modèle)
 * 3. JAMAIS de polling/webhook (tout est synchrone)
 * 
 * Lire docs/GENERATION_ARCHITECTURE.md pour l'architecture complète.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { fal } from '@fal-ai/client';
import { checkRateLimit, getClientIP, isDevBypass } from '@/lib/security/rate-limiter';
import { supabaseAdmin } from '@/lib/supabase/admin';

const MODEL_PATH = 'fal-ai/flux-general/image-to-image';

/**
 * Schéma de validation pour l'essai gratuit
 */
const trialRequestSchema = z.object({
  imageBase64: z.string().min(100, 'Image requise').refine(
    (val) => val.startsWith('data:image/'),
    'Seuls les data URIs image sont acceptés'
  ),
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

    // Configurer fal.ai
    const falKey = process.env.FAL_KEY || process.env.FAL_API_KEY;
    if (!falKey) {
      console.error('[Trial] ❌ FAL_KEY manquant');
      return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 });
    }
    fal.config({ credentials: falKey });

    // Construire un prompt simple
    const prompt = buildTrialPrompt(style, roomType);

    // Extraire les dimensions pour déterminer le format
    const imageSize = guessImageSize(imageBase64);

    // Upload l'image sur le storage fal.ai (les data URIs base64 ne fonctionnent pas en queue)
    console.log(`[Trial] 📤 Uploading image to fal.ai storage...`);
    let uploadedImageUrl: string;
    try {
      const base64Data = imageBase64.split(',')[1];
      const mimeType = imageBase64.split(';')[0].split(':')[1] || 'image/jpeg';
      const buffer = Buffer.from(base64Data, 'base64');
      const blob = new Blob([buffer], { type: mimeType });
      uploadedImageUrl = await fal.storage.upload(blob);
      console.log(`[Trial] ✅ Image uploaded: ${uploadedImageUrl.substring(0, 60)}...`);
    } catch (uploadError: any) {
      console.error('[Trial] ❌ Image upload failed:', uploadError?.message);
      return NextResponse.json({ error: 'Erreur lors de l\'upload de l\'image' }, { status: 500 });
    }

    console.log(`[Trial] 🎨 Running fal.ai (synchronous)... style=${style}, room=${roomType}, imageSize=${imageSize}`);

    // Appel SYNCHRONE à fal.ai — retourne le résultat directement
    // Pas de queue/polling, car fal.queue.result() ré-exécute le modèle
    // et l'image uploadée expire entre-temps
    // NOTE: easycontrols depth désactivé le 14/02/2026 — erreur tenseur côté fal.ai
    // "The size of tensor a (3072) must match the size of tensor b (4096)"
    // Compensation : strength recalibré + guidance_scale élevé.
    // Réactiver quand fal.ai corrige le bug (tester avec scripts/test-fal-ab.js)
    const result = await fal.run(MODEL_PATH, {
      input: {
        prompt,
        image_url: uploadedImageUrl,
        strength: 0.72,
        negative_prompt: 'different room shape, modified walls, moved windows, changed doors, different ceiling height, altered room proportions, different camera angle, different perspective, empty unfurnished room, construction site, unfinished renovation, blurry, low quality, watermark, text overlay, deformed, cartoon, painting, illustration, 3d render',
        image_size: imageSize,
        num_inference_steps: 30,
        guidance_scale: 5.5,
        nag_scale: 4,
        nag_end: 0.35,
        enable_safety_checker: true,
        output_format: 'jpeg',
      } as any,
    }) as any;

    const imageUrl = result?.data?.images?.[0]?.url
      || result?.images?.[0]?.url
      || result?.data?.image?.url;

    if (!imageUrl) {
      console.error('[Trial] ❌ No image URL in result:', JSON.stringify(result).substring(0, 500));
      return NextResponse.json({ error: 'Image introuvable dans le résultat' }, { status: 500 });
    }

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

/**
 * Prompt simplifié pour l'essai
 */
function buildTrialPrompt(style: string, roomType: string): string {
  const styleDescriptions: Record<string, string> = {
    moderne: 'contemporary modern interior, clean architectural lines, matte white walls, warm neutral upholstery, light hardwood floors, sculptural low-profile furniture, recessed LED and geometric pendant lighting',
    scandinave: 'Scandinavian hygge interior, warm white textured walls, light oak plank floors, bouclé upholstery, sheepskin throws draped over furniture, clustered white candles, woven wool area rug, pendant globe lights, soft cream palette',
    boheme: 'bohemian interior, layered Persian and kilim rugs, macramé wall hangings, abundant trailing indoor plants, rattan and wicker furniture, terracotta and ochre palette, vintage brass lanterns, embroidered cushions',
    japandi: 'Japandi interior, wabi-sabi handcrafted ceramics, light ash wood furniture, dried pampas grass, neutral linen textiles, paper lantern pendants, muted earth tones, organic natural textures',
    industriel: 'industrial loft interior, exposed red brick accent wall, black steel frame elements, Edison filament bulb pendant cluster, raw concrete floor, aged brown leather Chesterfield sofa, matte black pipe shelving',
    minimaliste: 'ultra-minimalist interior, pure white space with warm wood accents, essential furniture only, generous negative space, monochrome palette, Japanese-inspired serenity, soft diffused light',
    haussmannien: 'classic Parisian Haussmannian interior, ornate plaster crown moldings, herringbone oak parquet, white marble fireplace, floor-to-ceiling French windows, crystal chandelier, navy velvet upholstery',
    artdeco: 'Art Deco interior, bold geometric patterns and brass inlays, emerald green velvet tufted seating, black lacquered surfaces, sunburst mirrors, dramatic pendant lighting, jewel tones with gold',
    midcentury: 'mid-century modern interior, Eames-inspired organic forms, warm teak and walnut wood, tapered legs, mustard and olive palette, Nelson bubble pendant, bold abstract art on walls',
    coastal: 'coastal interior, ocean blue and sandy white palette, whitewashed shiplap paneling, woven seagrass pendants, natural linen slipcovers, weathered driftwood accents, sisal rug, sheer curtains',
    luxe: 'luxury interior, book-matched Calacatta marble surfaces, polished brass fixtures, deep velvet upholstery, crystal chandelier, champagne gold accents, plush mohair throws, sculptural art objects',
  };

  const roomDescriptions: Record<string, string> = {
    salon: 'living room',
    chambre: 'bedroom',
    cuisine: 'kitchen',
    'salle-de-bain': 'bathroom',
    bureau: 'home office',
    'salle-a-manger': 'dining room',
  };

  const roomFurniture: Record<string, string> = {
    salon: 'designer sofa, sculptural coffee table, accent armchair, bookshelf, floor lamp',
    chambre: 'upholstered bed with layered bedding, nightstands with lamps, elegant wardrobe',
    cuisine: 'premium cabinetry, stone countertops, integrated appliances, pendant-lit island',
    'salle-de-bain': 'floating vanity, backlit mirror, rainfall shower, premium fixtures',
    bureau: 'executive desk, ergonomic chair, open shelving, task and ambient lighting',
    'salle-a-manger': 'dining table set for six, designer chairs, sideboard, overhead pendant',
  };

  const styleDesc = styleDescriptions[style] || 'modern minimalist interior, clean lines, neutral tones, contemporary furniture';
  const roomDesc = roomDescriptions[roomType] || 'living room';
  const furniture = roomFurniture[roomType] || 'beautiful designer furniture';

  return `Stunning ${style} ${roomDesc}, award-winning complete interior redesign. ${styleDesc}. Fully furnished with ${furniture}. Cohesive ${style} design language on every surface — walls, flooring, textiles, and light fixtures. Warm inviting atmosphere with layered ambient and accent lighting. Beautifully styled with curated objects, fresh greenery, and designer textiles. Published in Architectural Digest.
Editorial interior design photography, photorealistic, hyperdetailed textures and materials, natural daylight, 8k.`;
}

/**
 * Deviner la taille d'image à partir du base64 (simplifié)
 */
function guessImageSize(base64: string): string {
  // Par défaut landscape_4_3 car la plupart des photos sont en paysage
  return 'landscape_4_3';
}
