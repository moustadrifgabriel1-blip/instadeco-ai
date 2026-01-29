import { NextResponse } from 'next/server';
import { z } from 'zod';
import { useCases } from '@/src/infrastructure/config/di-container';
import { GenerationMapper } from '@/src/application/mappers/GenerationMapper';
import { DomainError } from '@/src/domain/errors/DomainError';
import { InsufficientCreditsError } from '@/src/domain/errors/InsufficientCreditsError';

/**
 * Schéma de validation pour la génération
 */
const generateRequestSchema = z.object({
  imageUrl: z.string().min(1, 'Image URL requise'),
  roomType: z.string().default('salon'),
  style: z.string().default('moderne'),
  userId: z.string().min(1, 'Authentification requise'),
  transformMode: z.string().default('full_redesign'),
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
 * Construit le prompt pour la génération basé sur le style, le type de pièce et le mode
 * IMPORTANT: Le prompt insiste sur la préservation de la structure architecturale
 */
function buildPrompt(style: string, roomType: string, transformMode: string = 'full_redesign'): string {
  const styleDescriptions: Record<string, string> = {
    original: 'keeping the same existing style, improving organization and aesthetics',
    moderne: 'modern minimalist design with clean lines, neutral colors, contemporary furniture',
    scandinave: 'Scandinavian design with light wood, white walls, cozy textiles, hygge atmosphere',
    industriel: 'industrial loft design with exposed brick, metal fixtures, raw materials',
    boheme: 'bohemian design with layered textiles, plants, warm colors, eclectic decor',
    minimaliste: 'ultra minimalist design with essential furniture only, monochrome palette',
    luxe: 'luxury design with premium materials, elegant furniture, sophisticated lighting',
    classique: 'classic French design with ornate details, rich fabrics, traditional elegance',
    contemporain: 'contemporary design with artistic elements, bold accents, designer pieces',
    japandi: 'Japandi design combining Japanese minimalism with Scandinavian warmth',
    artdeco: 'Art Deco design with geometric patterns, gold accents, glamorous atmosphere',
    farmhouse: 'modern farmhouse with rustic wood, shiplap, cozy textiles, country charm',
    coastal: 'coastal design with light blues, whites, natural textures, beachy atmosphere',
    midcentury: 'mid-century modern with organic shapes, teak wood, retro colors',
    ludique: 'playful kids room with vibrant colors, creative shapes, fun educational elements',
  };

  const roomDescriptions: Record<string, string> = {
    salon: 'living room',
    chambre: 'bedroom',
    'chambre-enfant': 'children bedroom, kids room, playful decor',
    cuisine: 'kitchen',
    'salle-de-bain': 'bathroom',
    bureau: 'home office',
    'salle-a-manger': 'dining room',
    entree: 'entryway',
    terrasse: 'terrace',
  };

  const styleDesc = styleDescriptions[style] || style;
  const roomDesc = roomDescriptions[roomType] || roomType;

  // Architecture constraints (same for all modes)
  const architectureConstraints = `ARCHITECTURAL CONSTRAINTS (NEVER CHANGE):
- Room dimensions, walls, ceiling height
- Window positions, sizes, shapes
- Door positions and sizes
- Built-in features (columns, beams, alcoves)`;

  // Specific room furniture requirements
  const roomFurnitureRequirements: Record<string, string> = {
    salon: 'This is a LIVING ROOM - must contain: sofa/couch, coffee table, seating area. NO beds.',
    chambre: 'This is a BEDROOM - must contain: bed with headboard, nightstands, bedside lamps. NO sofas or couches.',
    'chambre-enfant': 'This is a CHILDREN BEDROOM - must contain: child-sized bed or bunk bed, toy storage, playful furniture. NO adult beds or sofas.',
    cuisine: 'This is a KITCHEN - must contain: cabinets, countertops, sink, appliances. NO beds or sofas.',
    'salle-de-bain': 'This is a BATHROOM - must contain: sink, toilet, shower or bathtub. NO beds or sofas.',
    bureau: 'This is a HOME OFFICE - must contain: desk, office chair, shelving or storage. NO beds.',
    'salle-a-manger': 'This is a DINING ROOM - must contain: dining table, dining chairs. NO beds or sofas.',
    entree: 'This is an ENTRYWAY - must contain: console table, coat rack or hooks, mirror. NO beds.',
    terrasse: 'This is a TERRACE/PATIO - must contain: outdoor furniture, plants. NO indoor furniture.',
  };

  const roomFurniture = roomFurnitureRequirements[roomType] || `This is a ${roomDesc}.`;

  // SPECIAL CASE: Style "original" (Garder mon style) - keep existing furniture style
  if (style === 'original') {
    return `TASK: ENHANCE EXISTING ROOM - KEEP SAME STYLE

${roomFurniture}

${architectureConstraints}

CRITICAL REQUIREMENTS:
✓ Keep the SAME type of furniture (if there's a bed, keep a bed - if there's a sofa, keep a sofa)
✓ Keep SIMILAR furniture styles and colors to what's already there
✓ Keep the general layout and arrangement
✓ Improve organization, declutter, and enhance aesthetics
✓ Better lighting and atmosphere
✓ Add tasteful decorative elements that match existing style

DO NOT:
✗ Change a bedroom into a living room or vice versa
✗ Replace beds with sofas or sofas with beds
✗ Completely change the furniture style
✗ Change the room's primary function

The goal is to show how the SAME ROOM could look with better organization, lighting, and subtle improvements while keeping its identity.

Professional interior photography, natural lighting, photorealistic, magazine quality.`;
  }

  // Completely different prompts for each mode - no mixing
  switch (transformMode) {
    case 'rearrange':
      // MODE: SUGGEST A NEW FURNITURE ARRANGEMENT
      return `TASK: SUGGEST A NEW FURNITURE LAYOUT

${roomFurniture}

${architectureConstraints}

IMPORTANT GUIDELINES:
→ Use SIMILAR style furniture (same aesthetic, similar colors)
→ Create a DIFFERENT layout - move things around significantly
→ The sofa should be in a DIFFERENT position than the original
→ Tables and chairs should be rearranged
→ Create better flow and conversation areas
→ Make the room feel fresh and reorganized

KEEP THE SAME:
✓ The overall aesthetic and color palette
✓ The type of furniture (keep a sofa if there was a sofa, keep a bed if bedroom)
✓ Wall colors and flooring
✓ The cozy/modern/etc atmosphere

This is a "what if I reorganized my room" visualization.
Professional interior photography, natural lighting, photorealistic.`;

    case 'keep_layout':
      // MODE: SAME POSITIONS, NEW STYLE FURNITURE
      return `TASK: STYLE CHANGE WITH SAME LAYOUT

${roomFurniture}

Transform to ${styleDesc} style while keeping furniture in EXACT SAME POSITIONS.

${architectureConstraints}

CRITICAL - KEEP IDENTICAL:
✓ Every furniture position - sofa stays where sofa is, table stays where table is
✓ Layout and arrangement - nothing moves
✓ Room flow and spacing

YOUR TASK - REPLACE WITH ${style.toUpperCase()} STYLE:
→ Replace sofa with ${style} style sofa IN THE SAME SPOT
→ Replace table with ${style} style table IN THE SAME SPOT
→ Replace each piece with ${style} equivalent AT THE SAME LOCATION
→ Update wall colors to match ${style}
→ Add ${style} decor elements

The furniture layout must be a perfect overlay - only the style changes, not the arrangement.

Professional interior photography, ${styleDesc}, magazine quality.`;

    case 'decor_only':
      // MODE: SAME FURNITURE, ADD DECOR
      return `TASK: DECOR REFRESH ONLY

${roomFurniture}

Keep ALL furniture exactly as-is. Only add/change decorative elements.

${architectureConstraints}

CRITICAL - KEEP 100% IDENTICAL:
✓ ALL furniture pieces - exact same items in exact same positions
✓ Sofa, chairs, tables, bed, cabinets - UNCHANGED
✓ Furniture colors and materials - UNCHANGED

YOUR ONLY TASK - UPDATE DECOR TO ${style.toUpperCase()} STYLE:
→ Change wall color/texture
→ Add/replace cushions, throws, blankets
→ Add/replace plants and vases
→ Add/replace wall art and frames
→ Add/replace rugs and textiles
→ Update curtains/drapes
→ Add ${style} accessories and styling

The main furniture must be IDENTICAL to the original. Only small decor items and surfaces change.

Professional interior photography, ${styleDesc} decor styling.`;

    case 'full_redesign':
    default:
      // MODE: COMPLETE TRANSFORMATION
      return `TASK: COMPLETE INTERIOR REDESIGN

${roomFurniture}

Complete transformation to ${styleDesc} style.

${architectureConstraints}

YOU CAN CHANGE EVERYTHING EXCEPT ARCHITECTURE:
→ Replace ALL furniture with new ${styleDesc} pieces
→ New furniture arrangement and layout
→ New wall colors, textures, wallpaper
→ New flooring material or color
→ New lighting fixtures
→ Complete ${style} decor: rugs, art, plants, accessories
→ New color palette matching ${style}

Create a stunning ${style} interior that looks like a professional design project.
The room structure stays the same, but everything inside transforms.

Professional interior design photography, ${styleDesc}, architectural digest quality, 8k, photorealistic.`;
  }
}
