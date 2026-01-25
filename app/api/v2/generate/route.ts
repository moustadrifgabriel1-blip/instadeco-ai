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

    const { imageUrl, roomType, style, userId } = validation.data;

    console.log('[Generate V2] 🎨 Building prompt...');
    // Construire le prompt basé sur le style et le type de pièce
    const prompt = buildPrompt(style, roomType);

    console.log('[Generate V2] 🚀 Executing use case...');
    // Exécuter le Use Case
    const result = await useCases.generateDesign.execute({
      userId,
      styleSlug: style,
      roomType,
      imageBase64: imageUrl, // Le storage service gère base64 et URL
      prompt,
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
 * Construit le prompt pour la génération basé sur le style et le type de pièce
 * IMPORTANT: Le prompt insiste sur la préservation de la structure architecturale
 */
function buildPrompt(style: string, roomType: string): string {
  const styleDescriptions: Record<string, string> = {
    moderne: 'modern minimalist design with clean lines, neutral colors, contemporary furniture',
    scandinave: 'Scandinavian design with light wood, white walls, cozy textiles, hygge atmosphere',
    industriel: 'industrial loft design with exposed brick, metal fixtures, raw materials',
    boheme: 'bohemian design with layered textiles, plants, warm colors, eclectic decor',
    minimaliste: 'ultra minimalist design with essential furniture only, monochrome palette',
    luxe: 'luxury design with premium materials, elegant furniture, sophisticated lighting',
    classique: 'classic French design with ornate details, rich fabrics, traditional elegance',
    contemporain: 'contemporary design with artistic elements, bold accents, designer pieces',
    japandi: 'Japandi design combining Japanese minimalism with Scandinavian warmth',
    'art-deco': 'Art Deco design with geometric patterns, gold accents, glamorous atmosphere',
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

  return `Redesign this ${roomDesc} with ${styleDesc}.

CRITICAL CONSTRAINTS - MUST PRESERVE:
- Keep EXACT same room dimensions and proportions
- Keep ALL windows in their EXACT positions, sizes, and shapes
- Keep ALL doors in their EXACT positions and sizes  
- Keep ALL walls in their EXACT positions - DO NOT add, remove, or modify any walls
- Keep the ceiling height and floor area unchanged
- Keep any built-in architectural features (columns, beams, alcoves)

ONLY CHANGE:
- Replace furniture with new ${styleDesc} pieces
- Change wall colors/textures (but keep walls in place)
- Add decorative elements (rugs, curtains, plants, art)
- Update lighting fixtures
- Change flooring material/color

The architectural shell of the room must remain IDENTICAL to the original photo. Only the interior design elements (furniture, decor, materials) should change to match the ${style} style.

Professional interior design photography, natural lighting, photorealistic, magazine quality.`;
}
