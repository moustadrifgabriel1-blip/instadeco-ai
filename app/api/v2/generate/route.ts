import { NextResponse } from 'next/server';
import { z } from 'zod';
import { useCases } from '@/src/infrastructure/config/di-container';
import { GenerationMapper } from '@/src/application/mappers/GenerationMapper';
import { DomainError } from '@/src/domain/errors/DomainError';
import { InsufficientCreditsError } from '@/src/domain/errors/InsufficientCreditsError';
import { checkRateLimit, getClientIP, RATE_LIMIT_CONFIGS } from '@/lib/security/rate-limiter';
import { logRateLimitExceeded, logGenerationCreated, logAuditEvent } from '@/lib/security/audit-logger';

/**
 * Schéma de validation pour la génération
 */
const generateRequestSchema = z.object({
  imageUrl: z.string().min(1, 'Image URL requise'),
  roomType: z.string().max(50).regex(/^[a-z0-9-]+$/, 'Format invalide').default('salon'),
  style: z.string().max(50).regex(/^[a-z0-9-]+$/, 'Format invalide').default('moderne'),
  userId: z.string().uuid('ID utilisateur invalide'),
  transformMode: z.enum(['full_redesign', 'rearrange', 'keep_layout', 'decor_only']).default('full_redesign'),
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
    const body = await req.json();
    console.log('[Generate V2] 📦 Request received', { 
      userId: body.userId || 'anonymous',
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

    const { imageUrl, roomType, style, userId, transformMode } = validation.data;

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
      transformMode: transformMode as 'full_redesign' | 'rearrange' | 'keep_layout' | 'decor_only',
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
    console.error('[Generate V2] ❌ Erreur:', error);

    // DEBUG: Retourner l'erreur détaillée pour comprendre le problème
    return NextResponse.json(
      {
        error: 'Erreur serveur critique',
        details: error instanceof Error ? error.message : String(error),
        // Ne pas exposer la stack trace en production sauf si nécessaire pour debug
        // stack: error instanceof Error ? error.stack : undefined 
      },
      { status: 500 }
    );
  }
}

/**
 * ============================================================================
 * SYSTÈME DE PROMPTS - GESTION DE TOUTES LES COMBINAISONS
 * ============================================================================
 * 
 * MATRICE DES COMBINAISONS:
 * - 4 modes: full_redesign, rearrange, keep_layout, decor_only
 * - 9 types de pièce: salon, chambre, chambre-enfant, cuisine, salle-de-bain, bureau, salle-a-manger, entree, terrasse
 * - 12+ styles: original, moderne, minimaliste, boheme, industriel, classique, japandi, midcentury, coastal, farmhouse, artdeco, ludique
 * 
 * RÈGLES CLÉS:
 * 1. Le TYPE DE PIÈCE doit TOUJOURS être respecté (chambre = lit, salon = canapé)
 * 2. Le STYLE s'applique différemment selon le mode
 * 3. Le MODE définit ce qui peut changer et ce qui doit rester
 */
function buildPrompt(style: string, roomType: string, transformMode: string = 'full_redesign'): string {
  
  // ============================================================================
  // 1. DICTIONNAIRES DE BASE
  // ============================================================================
  
  const styleDescriptions: Record<string, string> = {
    // Tendances
    original: 'the existing style, enhanced and improved',
    moderne: 'modern minimalist with clean lines, neutral colors, contemporary furniture',
    minimaliste: 'ultra minimalist with essential furniture only, monochrome palette, zen simplicity',
    japandi: 'Japandi combining Japanese zen minimalism with Scandinavian warmth and hygge',
    
    // Classiques
    haussmannien: 'Parisian Haussmann style with ornate crown moldings, herringbone parquet floors, marble fireplaces, high ceilings, classic French windows',
    classique: 'classic French elegance with rich fabrics, carved wood furniture, chandeliers, refined traditional decor',
    artdeco: 'Art Deco with geometric patterns, gold and brass accents, velvet fabrics, glamorous 1920s atmosphere',
    midcentury: 'mid-century modern with organic curves, teak and walnut wood, iconic 50s-60s designer furniture',
    
    // Chaleureux
    scandinave: 'Scandinavian with light oak wood, white walls, cozy wool textiles, candles, hygge atmosphere',
    boheme: 'bohemian with layered textiles, macramé, indoor plants, warm terracotta colors, eclectic global decor',
    provencal: 'Provençal French country with lavender accents, terracotta tiles, whitewashed walls, wrought iron, olive wood',
    chalet: 'Alpine chalet style with warm wood paneling, stone fireplace, sheepskin rugs, mountain lodge atmosphere',
    
    // Urbains
    industriel: 'industrial loft with exposed brick walls, black metal fixtures, Edison bulbs, raw concrete, leather accents',
    contemporain: 'contemporary design with bold artistic elements, statement pieces, cutting-edge designer furniture',
    loft: 'New York loft style with high ceilings, large windows, open space, urban sophistication, metal and glass',
    
    // Nature & Détente  
    coastal: 'coastal with ocean blues, sandy whites, driftwood, nautical accents, breezy seaside atmosphere',
    farmhouse: 'modern farmhouse with rustic reclaimed wood, shiplap walls, linen textiles, vintage charm',
    nature: 'biophilic design with abundant plants, natural wood, stone, organic shapes, earth tones, botanical prints',
    zen: 'zen sanctuary with bamboo, water elements, meditation space, natural materials, peaceful minimalism',
    
    // Luxe & Audace
    luxe: 'luxury design with marble, brass, velvet, premium materials, elegant proportions, sophisticated lighting',
    baroque: 'opulent baroque with gilded mirrors, rich velvet, crystal chandeliers, dramatic ornate details',
    eclectique: 'eclectic bold mix with contrasting styles, statement art, unexpected color combinations, curated chaos',
    
    // Spécialisés
    ludique: 'playful children space with vibrant colors, creative shapes, fun patterns, safe and stimulating design',
    ado: 'modern teen room with cool aesthetics, personal expression, gaming/study zones, trendy urban style',
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
  // 2. CONTRAINTES PAR TYPE DE PIÈCE (meubles obligatoires)
  // ============================================================================
  
  const roomConstraints: Record<string, { mustHave: string; mustNot: string; keyFurniture: string }> = {
    salon: {
      mustHave: 'sofa/couch, coffee table, seating area, TV console or bookshelf',
      mustNot: 'beds, cribs, kitchen appliances',
      keyFurniture: 'sofa and armchairs'
    },
    chambre: {
      mustHave: 'adult bed with headboard, nightstands, wardrobe or dresser',
      mustNot: 'sofas, dining tables, office desks as main furniture',
      keyFurniture: 'bed with bedding'
    },
    'chambre-enfant': {
      mustHave: 'child bed or bunk bed, toy storage, playful furniture, desk for homework',
      mustNot: 'adult-sized beds, bar furniture, office equipment',
      keyFurniture: 'child-sized bed and play area'
    },
    cuisine: {
      mustHave: 'kitchen cabinets, countertops, sink, stove/oven, refrigerator',
      mustNot: 'beds, sofas, bathroom fixtures',
      keyFurniture: 'kitchen island or dining counter'
    },
    'salle-de-bain': {
      mustHave: 'sink with vanity, toilet, shower or bathtub, mirror',
      mustNot: 'beds, sofas, kitchen appliances, dining furniture',
      keyFurniture: 'vanity and shower/tub'
    },
    bureau: {
      mustHave: 'desk, office chair, bookshelves or storage, good lighting',
      mustNot: 'beds as main furniture, kitchen appliances',
      keyFurniture: 'desk and ergonomic chair'
    },
    'salle-a-manger': {
      mustHave: 'dining table, dining chairs (4-8), sideboard or buffet',
      mustNot: 'beds, sofas as main seating, bathroom fixtures',
      keyFurniture: 'dining table with chairs'
    },
    entree: {
      mustHave: 'console table, mirror, coat hooks or rack, shoe storage',
      mustNot: 'beds, large sofas, kitchen appliances',
      keyFurniture: 'entryway console and mirror'
    },
    terrasse: {
      mustHave: 'outdoor furniture, plants, weather-resistant materials',
      mustNot: 'indoor upholstered furniture, beds, kitchen appliances',
      keyFurniture: 'outdoor seating and plants'
    },
  };

  // ============================================================================
  // 3. CONSTRUCTION DES ÉLÉMENTS DU PROMPT
  // ============================================================================
  
  const styleDesc = styleDescriptions[style] || style;
  const roomDesc = roomDescriptions[roomType] || roomType;
  const constraints = roomConstraints[roomType] || {
    mustHave: 'appropriate furniture for the room type',
    mustNot: 'furniture inappropriate for this room',
    keyFurniture: 'main furniture pieces'
  };

  const isOriginalStyle = style === 'original';

  // Contraintes architecturales (communes à tous les modes)
  const architectureBlock = `
🏗️ ARCHITECTURE (NEVER CHANGE):
- Room dimensions, walls, ceiling height
- Window positions, sizes, shapes  
- Door positions and sizes
- Built-in features (columns, beams, alcoves)`;

  // Contraintes de type de pièce (communes à tous les modes)
  const roomTypeBlock = `
🏠 ROOM TYPE: ${roomDesc.toUpperCase()}
✓ MUST INCLUDE: ${constraints.mustHave}
✗ MUST NOT INCLUDE: ${constraints.mustNot}
🔑 KEY FURNITURE: ${constraints.keyFurniture}`;

  // ============================================================================
  // 4. GÉNÉRATION DU PROMPT SELON MODE + STYLE
  // ============================================================================

  // ----- MODE: FULL_REDESIGN -----
  if (transformMode === 'full_redesign') {
    if (isOriginalStyle) {
      // full_redesign + original = améliorer sans changer de style
      return `TASK: ENHANCE AND IMPROVE THIS ${roomDesc.toUpperCase()}

Keep the existing style but make it look professionally designed and organized.

${roomTypeBlock}
${architectureBlock}

WHAT TO DO:
✓ Keep the same general style and color palette
✓ Upgrade furniture to higher quality versions of similar style
✓ Improve organization and declutter
✓ Better lighting and atmosphere
✓ Add tasteful decorative elements
✓ Make the space feel more polished and intentional

WHAT NOT TO DO:
✗ Don't change the fundamental style (modern stays modern, rustic stays rustic)
✗ Don't change room function (bedroom stays bedroom)
✗ Don't remove key furniture pieces, upgrade them

Result: The same room, but looking like a professional interior designer organized and upgraded it.
Professional photography, natural lighting, magazine quality, 8k.`;
    } else {
      // full_redesign + specific style = transformation complète
      return `TASK: COMPLETE ${style.toUpperCase()} TRANSFORMATION

Transform this ${roomDesc} into a stunning ${styleDesc} design.

${roomTypeBlock}
${architectureBlock}

COMPLETE TRANSFORMATION:
→ Replace ALL furniture with ${style} style pieces
→ New furniture arrangement optimized for the space
→ Wall colors and textures matching ${style} aesthetic
→ Flooring update if needed (wood, tiles, carpet)
→ ${style} lighting fixtures
→ Complete ${style} decor: rugs, art, plants, textiles
→ Color palette: typical ${style} colors

Create a magazine-worthy ${style} ${roomDesc}.
Professional interior photography, ${styleDesc}, architectural digest quality, 8k, photorealistic.`;
    }
  }

  // ----- MODE: REARRANGE -----
  if (transformMode === 'rearrange') {
    // rearrange = nouvelle disposition, le style influence peu
    return `TASK: NEW FURNITURE ARRANGEMENT FOR THIS ${roomDesc.toUpperCase()}

Show a completely different furniture layout while keeping similar style furniture.

${roomTypeBlock}
${architectureBlock}

YOUR TASK - REARRANGE:
→ Move the ${constraints.keyFurniture} to a DIFFERENT position/wall
→ Create a completely new layout
→ Optimize traffic flow and functionality
→ Make the room feel fresh and reorganized

KEEP THE SAME:
✓ Similar style and aesthetic (${isOriginalStyle ? 'match existing style' : 'inspired by ' + style})
✓ Similar furniture types (${constraints.keyFurniture})
✓ General color palette
✓ Wall colors and flooring

DO NOT:
✗ Keep furniture in the same positions - MOVE EVERYTHING
✗ Change room type (${roomDesc} must stay a ${roomDesc})

This shows "what if I reorganized my ${roomDesc}" with furniture in new positions.
Professional photography, natural lighting, realistic.`;
  }

  // ----- MODE: KEEP_LAYOUT -----
  if (transformMode === 'keep_layout') {
    if (isOriginalStyle) {
      // keep_layout + original = pas de changement majeur (améliorer qualité)
      return `TASK: ENHANCE THIS ${roomDesc.toUpperCase()} - KEEP EXACT LAYOUT

Improve the room while keeping everything in the exact same position.

${roomTypeBlock}
${architectureBlock}

KEEP 100% IDENTICAL:
✓ Every furniture position - nothing moves
✓ Furniture types and general style
✓ Room layout and arrangement

SUBTLE IMPROVEMENTS ALLOWED:
→ Better lighting quality
→ Cleaner, more organized look
→ Higher quality textures and materials
→ Professional staging and styling

Result: Same room, same layout, but photographed like a professional interior shoot.
Professional photography, perfect lighting, magazine quality.`;
    } else {
      // keep_layout + specific style = même positions, nouveau style
      return `TASK: ${style.toUpperCase()} STYLE - SAME LAYOUT

Transform this ${roomDesc} to ${styleDesc} while keeping furniture in EXACT SAME POSITIONS.

${roomTypeBlock}
${architectureBlock}

CRITICAL - POSITIONS DON'T MOVE:
✓ ${constraints.keyFurniture} stays in exact same spot
✓ Every piece of furniture keeps its position
✓ Layout and spacing remain identical

STYLE TRANSFORMATION:
→ Replace each furniture with ${style} style equivalent IN SAME POSITION
→ Sofa → ${style} style sofa (same spot)
→ Table → ${style} style table (same spot)
→ Wall colors updated to ${style} palette
→ ${style} decor elements added

The layout is a perfect overlay of the original - only the style changes.
Professional photography, ${styleDesc}, magazine quality.`;
    }
  }

  // ----- MODE: DECOR_ONLY -----
  if (transformMode === 'decor_only') {
    const decorStyle = isOriginalStyle ? 'matching the existing aesthetic' : `in ${style} style`;
    
    return `TASK: DECOR REFRESH ONLY - ${roomDesc.toUpperCase()}

Keep ALL furniture exactly as-is. Only update decorative elements ${decorStyle}.

${roomTypeBlock}
${architectureBlock}

🚫 DO NOT CHANGE (KEEP 100% IDENTICAL):
- ${constraints.keyFurniture} - same items, same positions
- All major furniture pieces
- Furniture colors and materials
- Furniture arrangement

✅ ONLY CHANGE THESE DECOR ELEMENTS:
→ Wall color/paint ${isOriginalStyle ? '(subtle refresh)' : '(to match ' + style + ')'}
→ Throw pillows and blankets
→ Plants and vases
→ Wall art and frames
→ Rugs and textiles
→ Curtains/drapes
→ Decorative accessories
→ Table styling (books, candles, trays)

The main furniture is IDENTICAL. Only styling and decor items change.
Professional photography, beautiful styling, ${isOriginalStyle ? 'enhanced version' : styleDesc + ' decor'}.`;
  }

  // ----- FALLBACK (should not reach here) -----
  return `Professional ${roomDesc} interior design, ${styleDesc}, photorealistic, 8k quality.`;
}

