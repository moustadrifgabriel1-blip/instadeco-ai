/**
 * ⚠️⚠️⚠️ FICHIER CRITIQUE — NE PAS MODIFIER SANS RAISON MAJEURE ⚠️⚠️⚠️
 * 
 * POST /api/v2/generate — Génération authentifiée (avec crédits).
 * Appelle GenerateDesignUseCase qui utilise fal.run() SYNCHRONE.
 * 
 * FLUX : Auth → Validation → GenerateDesignUseCase.execute() → result complet (status=completed)
 * Le résultat inclut déjà l'outputImageUrl — pas besoin de polling.
 * 
 * Lire docs/GENERATION_ARCHITECTURE.md pour l'architecture complète.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { useCases } from '@/src/infrastructure/config/di-container';
import { GenerationMapper } from '@/src/application/mappers/GenerationMapper';
import { DomainError } from '@/src/domain/errors/DomainError';
import { InsufficientCreditsError } from '@/src/domain/errors/InsufficientCreditsError';
import { checkRateLimit, getClientIP, RATE_LIMIT_CONFIGS } from '@/lib/security/rate-limiter';
import { logRateLimitExceeded, logGenerationCreated, logAuditEvent } from '@/lib/security/audit-logger';
import { createClient } from '@/lib/supabase/server';

/**
 * Schéma de validation pour la génération
 */
const generateRequestSchema = z.object({
  imageUrl: z.string().min(1, 'Image URL requise').refine(
    (url) => url.startsWith('data:image/') || /^https:\/\//.test(url),
    'Seules les URLs HTTPS ou les data URIs image sont acceptés'
  ),
  roomType: z.string().max(50).regex(/^[a-z0-9-]+$/, 'Format invalide').default('salon'),
  style: z.string().max(50).regex(/^[a-z0-9-]+$/, 'Format invalide').default('moderne'),
  userId: z.string().uuid('ID utilisateur invalide').optional(), // Optionnel : on prend l'userId de la session si absent
  transformMode: z.enum(['full_redesign', 'keep_layout', 'decor_only']).default('full_redesign'),
});

export const maxDuration = 60; // Set max duration to 60 seconds (Hobby limit usually 10s, Pro 300s)
export const dynamic = 'force-dynamic';

/**
 * POST /api/v2/generate
 * 
 * Démarre une nouvelle génération d'image via l'architecture hexagonale
 * Utilise le Use Case GenerateDesignUseCase
 */
export async function POST(req: Request) {
  const startTime = Date.now();
  console.log('[Generate V2] 🚀 Starting generation request');
  
  // Rate limiting
  const clientIP = getClientIP(req.headers);
  const rateLimitResult = checkRateLimit(clientIP, RATE_LIMIT_CONFIGS.generate);
  
  if (!rateLimitResult.success) {
    console.warn(`[Generate V2] ⛔ Rate limit exceeded for IP: ${clientIP}`);
    // Log l'abus
    await logRateLimitExceeded(clientIP, '/api/v2/generate');
    return NextResponse.json(
      { 
        error: 'Trop de requêtes. Veuillez réessayer plus tard.',
        retryAfter: rateLimitResult.retryAfter,
      },
      { 
        status: 429,
        headers: {
          'Retry-After': String(rateLimitResult.retryAfter),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateLimitResult.resetAt),
        },
      }
    );
  }
  
  try {
    // 🔒 Authentification serveur obligatoire
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.warn('[Generate V2] ⛔ Non authentifié');
      return NextResponse.json(
        { error: 'Authentification requise', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log('[Generate V2] 📦 Request received', { 
      userId: user.id,
      style: body.style,
      roomType: body.roomType 
    });

    // Validation avec Zod
    const validation = generateRequestSchema.safeParse(body);
    
    if (!validation.success) {
      console.warn('[Generate V2] ⚠️ Validation failed', validation.error.flatten());
      return NextResponse.json(
        { 
          error: 'Validation échouée',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Toujours utiliser l'userId de la session (jamais du body)
    const { imageUrl, roomType, style, transformMode } = validation.data;
    const userId = user.id;

    console.log('[Generate V2] 🎨 Building prompt with mode:', transformMode);
    // Construire le prompt basé sur le style, le type de pièce et le mode
    const prompt = buildPrompt(style, roomType, transformMode);

    console.log('[Generate V2] 🚀 Executing use case...');
    // Exécuter le Use Case
    const result = await useCases.generateDesign.execute({
      userId,
      styleSlug: style,
      roomType,
      imageBase64: imageUrl, // Le storage service gère base64 et URL
      prompt,
      transformMode: transformMode as 'full_redesign' | 'keep_layout' | 'decor_only',
    });
    
    const duration = Date.now() - startTime;
    console.log(`[Generate V2] 🏁 Use case finished in ${duration}ms`, { success: result.success });

    // Gérer le résultat
    if (!result.success) {
      const error = result.error;

      // Erreur de crédits insuffisants
      if (error instanceof InsufficientCreditsError) {
        return NextResponse.json(
          {
            error: 'Crédits insuffisants',
            message: 'Vous n\'avez plus de crédits. Rechargez votre compte pour continuer.',
            code: 'INSUFFICIENT_CREDITS',
            currentCredits: error.currentCredits,
            requiredCredits: error.requiredCredits,
          },
          { status: 402 }
        );
      }

      // Autres erreurs domain
      if (error instanceof DomainError) {
        return NextResponse.json(
          { error: error.message, code: error.code },
          { status: error.statusCode }
        );
      }

      // Erreur générique
      console.error('[Generate V2] ❌ Domain error:', result.error);
      return NextResponse.json(
        { 
          error: `Échec de la génération d'image: ${result.error.message}`,
          code: result.error.code || 'IMAGE_GENERATION_FAILED',
          details: result.error.message,
        },
        { status: 500 }
      );
    }

    // Succès - retourner la génération
    const { generation, creditsRemaining } = result.data;

    // Log audit de la génération réussie
    await logGenerationCreated(userId, generation.id, clientIP);

    return NextResponse.json({
      success: true,
      generation: GenerationMapper.toDTO(generation),
      creditsRemaining,
      message: 'Génération démarrée avec succès',
    });

  } catch (error) {
    // Log complet même en production (visible dans Vercel Functions logs)
    console.error('[Generate V2] ❌ Erreur non-catchée:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : typeof error,
    });

    return NextResponse.json(
      {
        error: 'Erreur serveur critique',
        code: 'INTERNAL_ERROR',
        // En prod, on donne quand même le type d'erreur (pas le stack)
        details: error instanceof Error ? error.message : 'Une erreur interne est survenue.',
      },
      { status: 500 }
    );
  }
}

/**
 * ============================================================================
 * SYSTÈME DE PROMPTS — NIVEAU AGENCE
 * ============================================================================
 * 
 * PHILOSOPHIE :
 * Les modèles de diffusion ne comprennent pas les INSTRUCTIONS ("Replace X", "NEVER change Y").
 * Ils comprennent des DESCRIPTIONS VISUELLES de ce que l'image finale doit être.
 * → Chaque prompt décrit le RÉSULTAT FINAL comme s'il existait déjà.
 * → Les interdictions vont dans le NEGATIVE PROMPT (géré par FalService).
 * → Concis et front-loaded : les 50 premiers tokens sont les plus importants.
 * 
 * MATRICE : 3 modes × 12 styles × 9 pièces = 324 combinaisons
 */
function buildPrompt(style: string, roomType: string, transformMode: string = 'full_redesign'): string {
  
  // ============================================================================
  // 1. DESCRIPTIONS DE STYLE — ultra-spécifiques, matériaux réels, textures précises
  // ============================================================================
  
  const styleDescriptions: Record<string, string> = {
    original: 'the current design direction, refined and elevated to premium designer quality',
    moderne: 'contemporary modern interior, clean architectural lines, matte white walls, warm neutral upholstery, light hardwood floors, sculptural low-profile furniture, recessed LED and geometric pendant lighting, minimal curated accessories',
    minimaliste: 'ultra-minimalist interior, pure white space with warm wood accents, essential furniture only, generous negative space, hidden storage, monochrome palette with organic textures, Japanese-inspired serene simplicity, soft diffused natural light',
    japandi: 'Japandi interior, wabi-sabi handcrafted ceramics, light ash wood furniture, dried pampas grass arrangements, neutral linen and raw cotton textiles, paper lantern pendants, muted earth tones, organic natural textures throughout',
    haussmannien: 'classic Parisian Haussmannian interior, ornate plaster crown moldings, herringbone oak parquet floor, white marble fireplace mantel, floor-to-ceiling French windows, crystal chandelier, navy velvet upholstery, gilded frames, polished brass hardware',
    artdeco: 'Art Deco interior, bold geometric patterns and brass inlays, emerald green velvet tufted seating, black lacquered surfaces, sunburst mirrors, terrazzo accents, dramatic pendant lighting, jewel tones with polished gold and chrome',
    midcentury: 'mid-century modern interior, Eames and Noguchi-inspired organic forms, warm teak and walnut wood, tapered legs, mustard yellow and olive green palette, Nelson bubble pendant, bold abstract art on walls, clean functional lines',
    scandinave: 'Scandinavian hygge interior, warm white textured walls, light oak plank floors, bouclé upholstery, sheepskin throws draped over furniture, clustered white candles, woven wool area rug, pendant globe lights, soft cream and blush palette',
    boheme: 'bohemian interior, layered Persian and kilim rugs, macramé wall hangings, abundant trailing indoor plants on shelves, rattan and wicker furniture, terracotta and ochre palette, vintage brass lanterns, collected global textiles and embroidered cushions',
    industriel: 'industrial loft interior, exposed red brick accent wall, black steel frame elements, Edison filament bulb pendant cluster, raw concrete or dark reclaimed wood floor, aged brown leather Chesterfield sofa, matte black pipe shelving, galvanized metal accents',
    coastal: 'coastal interior, ocean blue and sandy white palette, whitewashed shiplap wood paneling, woven seagrass pendant fixtures, natural linen slipcover sofa, weathered driftwood coffee table, blue-white striped textiles, sisal area rug, sheer white linen curtains billowing',
    luxe: 'luxury interior, book-matched Calacatta marble surfaces, polished brass hardware and fixtures, deep emerald or navy velvet upholstery, crystal pendant chandelier, champagne gold accents, plush mohair throws, sculptural art objects, warm indirect LED cove lighting',
  };

  const roomDescriptions: Record<string, string> = {
    salon: 'living room',
    chambre: 'bedroom',
    'chambre-enfant': 'children bedroom',
    cuisine: 'kitchen',
    'salle-de-bain': 'bathroom',
    bureau: 'home office',
    'salle-a-manger': 'dining room',
    entree: 'entryway',
    terrasse: 'terrace',
  };

  // ============================================================================
  // 2. DESCRIPTIONS DE MOBILIER PAR PIÈCE — langage descriptif, pas impératif
  // ============================================================================
  
  // Pour full_redesign : décrit les meubles du résultat final
  const roomFurniture: Record<string, string> = {
    salon: 'designer sofa with accent armchair, sculptural coffee table, media console or bookshelf, cozy reading corner with floor lamp',
    chambre: 'upholstered king bed with layered premium bedding, designer nightstands with ceramic table lamps, elegant wardrobe',
    'chambre-enfant': 'playful child bed with cozy patterned bedding, creative toy storage, colorful study desk with chair, whimsical wall art',
    cuisine: 'premium handleless cabinetry, stone countertops, integrated appliances, kitchen island with designer pendant lighting above',
    'salle-de-bain': 'designer floating vanity with integrated basin, large backlit mirror, walk-in rainfall shower behind glass, premium fixtures',
    bureau: 'executive writing desk, ergonomic designer chair, floor-to-ceiling open shelving with curated objects, focused task lamp',
    'salle-a-manger': 'large dining table set for six, designer dining chairs, elegant sideboard with decorative objects, dramatic overhead pendant',
    entree: 'slim console table with large decorative mirror above, designer wall hooks, accent pendant, curated small accessories',
    terrasse: 'weather-resistant lounge sofa and armchairs, lush potted plants and Mediterranean greenery, outdoor dining area, string lights',
  };

  // Pour keep_layout et decor_only : identifie les pièces à préserver
  const roomKeyPieces: Record<string, string> = {
    salon: 'sofa, armchairs, and coffee table',
    chambre: 'bed, nightstands, and wardrobe',
    'chambre-enfant': 'child bed, desk, and storage',
    cuisine: 'cabinets, countertops, and appliances',
    'salle-de-bain': 'vanity, shower, and fixtures',
    bureau: 'desk, chair, and shelving',
    'salle-a-manger': 'dining table and chairs',
    entree: 'console table and mirror',
    terrasse: 'outdoor seating and planters',
  };

  // ============================================================================
  // 3. RÉSOLUTION DES VARIABLES
  // ============================================================================
  
  const styleDesc = styleDescriptions[style] || style;
  const roomDesc = roomDescriptions[roomType] || roomType;
  const furniture = roomFurniture[roomType] || 'beautiful designer furniture appropriate for the room';
  const keyPieces = roomKeyPieces[roomType] || 'all furniture pieces';
  const isOriginalStyle = style === 'original';

  // ============================================================================
  // 4. PROMPTS PAR MODE — descriptifs, visuels, concis (~60-80 mots)
  //    Chaque prompt décrit le RÉSULTAT FINAL, pas un processus de transformation.
  //    Pas d'emojis, pas de bullet points — du langage naturel dense en tokens visuels.
  // ============================================================================

  // ----- MODE: FULL_REDESIGN -----
  if (transformMode === 'full_redesign') {
    if (isOriginalStyle) {
      return `This ${roomDesc} elevated to luxury interior magazine standard, same design direction professionally refined by a top decorator. Premium ${roomDesc} furniture in the same style family, harmonized tonal palette, decluttered and beautifully staged. Refined materials, rich textures, and elevated finishes on every surface. Layered warm ambient and accent lighting. Curated coffee table books, fresh greenery in ceramic vessels, quality throw textiles. A polished, aspirational version ready for Elle Décoration.`;
    } else {
      return `Stunning ${style} ${roomDesc}, award-winning complete interior redesign. ${styleDesc}. Fully furnished with ${furniture}. Cohesive ${style} design language on every surface — walls, flooring, textiles, and light fixtures. Warm inviting atmosphere with layered ambient and accent lighting. Beautifully styled with curated decorative objects, fresh greenery in artisan vessels, and coordinated designer textiles throughout. Published in Architectural Digest.`;
    }
  }

  // ----- MODE: KEEP_LAYOUT -----
  if (transformMode === 'keep_layout') {
    if (isOriginalStyle) {
      return `This ${roomDesc} with every furniture piece in its exact current position, elevated to professional interior photography standards. Identical spatial arrangement with ${keyPieces} unmoved. Refined materials and finishes, warm balanced lighting, professionally staged with quality accessories, fresh greenery, and coordinated textiles. Same room, same layout, polished to magazine-quality presentation.`;
    } else {
      return `${style} ${roomDesc} interior with furniture in the exact same spatial arrangement as the source photo — identical positions for ${keyPieces}. ${styleDesc}. Complete material and color transformation applied over the existing layout. Each piece replaced with its ${style} equivalent in the same location and same approximate size. ${style} wall treatment, coordinated textiles, matching light fixtures, and curated ${style} accessories filling the space.`;
    }
  }

  // ----- MODE: DECOR_ONLY -----
  if (transformMode === 'decor_only') {
    if (isOriginalStyle) {
      return `This ${roomDesc} with all existing furniture completely preserved — identical ${keyPieces}, same positions, same upholstery, same materials and finishes. Only decorative accents refined and elevated: fresh coordinated throw pillows and blankets, quality area rug, curated framed wall art, trailing indoor plants in ceramic pots, updated curtains, warm candles and small sculptural accessories on surfaces. A polished, professionally styled decor refresh.`;
    } else {
      return `This ${roomDesc} with all existing furniture completely preserved — identical ${keyPieces}, same positions, same upholstery, same wood finish, same materials. Only decorative accents refreshed in ${style} style: ${style} wall color, coordinated ${style} throw pillows and blankets, ${style} area rug, curated ${style} wall art and frames, fresh plants in ${style} vessels, ${style} curtains, candles and small accessories on surfaces. A subtle but visually striking ${style} decor layer over unchanged furniture.`;
    }
  }

  // ----- FALLBACK -----
  return `Beautiful ${roomDesc} interior design, ${styleDesc}, photorealistic, 8k, award-winning interior photography.`;
}

