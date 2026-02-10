import { NextResponse } from 'next/server';
import { z } from 'zod';
import { fal } from '@fal-ai/client';
import { checkRateLimit, getClientIP } from '@/lib/security/rate-limiter';

const MODEL_PATH = 'fal-ai/flux-general';

/**
 * Schéma de validation pour l'essai gratuit
 */
const trialRequestSchema = z.object({
  imageBase64: z.string().min(100, 'Image requise'),
  roomType: z.string().max(50).regex(/^[a-z0-9-]+$/).default('salon'),
  style: z.string().max(50).regex(/^[a-z0-9-]+$/).default('moderne'),
});

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * POST /api/trial/generate
 * 
 * Essai gratuit sans authentification.
 * Rate limité à 1 génération par IP toutes les 24h.
 */
export async function POST(req: Request) {
  console.log('[Trial] 🚀 Starting trial generation');

  // Rate limiting strict : 1 essai par IP par 24h
  const clientIP = getClientIP(req.headers);
  const rateLimitResult = checkRateLimit(clientIP, {
    maxRequests: 1,
    windowSeconds: 86400, // 24h
    prefix: 'trial',
  });

  if (!rateLimitResult.success) {
    console.warn(`[Trial] ⛔ Rate limit exceeded for IP: ${clientIP}`);
    return NextResponse.json(
      {
        error: 'Vous avez déjà utilisé votre essai gratuit. Créez un compte pour continuer !',
        code: 'TRIAL_USED',
        retryAfter: rateLimitResult.retryAfter,
      },
      { status: 429 }
    );
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

    const { imageBase64, roomType, style } = validation.data;

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

    console.log('[Trial] 🎨 Submitting to Fal.ai...', { style, roomType });

    // Submit à fal.ai (queue)
    const { request_id } = await fal.queue.submit(MODEL_PATH, {
      input: {
        prompt,
        easycontrols: [
          {
            control_method_url: 'depth',
            image_url: imageBase64,
            image_control_type: 'spatial',
            scale: 0.7,
          },
        ],
        image_size: imageSize,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        enable_safety_checker: true,
        output_format: 'jpeg',
      } as any,
    });

    console.log('[Trial] ✅ Job submitted:', request_id);

    return NextResponse.json({
      requestId: request_id,
      message: 'Génération lancée',
    });
  } catch (error: any) {
    console.error('[Trial] ❌ Error:', error?.message || error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération. Réessayez.' },
      { status: 500 }
    );
  }
}

/**
 * Prompt simplifié pour l'essai
 */
function buildTrialPrompt(style: string, roomType: string): string {
  const styleDescriptions: Record<string, string> = {
    moderne: 'modern minimalist with clean lines, neutral colors, contemporary furniture',
    scandinave: 'Scandinavian with light oak wood, white walls, cozy wool textiles, hygge atmosphere',
    boheme: 'bohemian with layered textiles, macramé, indoor plants, warm terracotta colors',
    japandi: 'Japandi combining Japanese zen minimalism with Scandinavian warmth',
    industriel: 'industrial loft with exposed brick walls, black metal fixtures, Edison bulbs',
    classique: 'classic French elegance with rich fabrics, carved wood furniture, chandeliers',
  };

  const roomDescriptions: Record<string, string> = {
    salon: 'living room',
    chambre: 'bedroom',
    cuisine: 'kitchen',
    'salle-de-bain': 'bathroom',
    bureau: 'home office',
    'salle-a-manger': 'dining room',
  };

  const styleDesc = styleDescriptions[style] || 'modern minimalist, clean lines, neutral colors';
  const roomDesc = roomDescriptions[roomType] || 'living room';

  return `TASK: COMPLETE TRANSFORMATION

Transform this ${roomDesc} into a stunning ${styleDesc} design.

🏗️ ARCHITECTURE (NEVER CHANGE):
- Room dimensions, walls, ceiling height
- Window positions, sizes, shapes  
- Door positions and sizes

COMPLETE TRANSFORMATION:
→ Replace ALL furniture with ${style} style pieces
→ New furniture arrangement optimized for the space
→ Wall colors and textures matching ${style} aesthetic
→ ${style} lighting fixtures and decor elements

Create a magazine-worthy ${style} ${roomDesc}.
Professional interior photography, ${styleDesc}, architectural digest quality, 8k, photorealistic.

Professional architectural photograph, shot on 50mm lens, f/2.8, ISO 200, realistic textures, natural lighting, 8k resolution, photorealistic, highly detailed.`;
}

/**
 * Deviner la taille d'image à partir du base64 (simplifié)
 */
function guessImageSize(base64: string): string {
  // Par défaut landscape_4_3 car la plupart des photos sont en paysage
  return 'landscape_4_3';
}
