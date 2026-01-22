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

/**
 * POST /api/v2/generate
 * 
 * Démarre une nouvelle génération d'image via l'architecture hexagonale
 * Utilise le Use Case GenerateDesignUseCase
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validation avec Zod
    const validation = generateRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation échouée',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { imageUrl, roomType, style, userId } = validation.data;

    // Construire le prompt basé sur le style et le type de pièce
    const prompt = buildPrompt(style, roomType);

    // Exécuter le Use Case
    const result = await useCases.generateDesign.execute({
      userId,
      styleSlug: style,
      roomType,
      imageBase64: imageUrl, // Le storage service gère base64 et URL
      prompt,
    });

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
    cuisine: 'kitchen',
    'salle-de-bain': 'bathroom',
    bureau: 'home office',
    'salle-a-manger': 'dining room',
    entree: 'entryway',
    terrasse: 'terrace',
  };

  const styleDesc = styleDescriptions[style] || style;
  const roomDesc = roomDescriptions[roomType] || roomType;

  return `Professional interior design photo of a ${roomDesc} with ${styleDesc}. 
High-end architectural photography, natural lighting, 8K resolution, photorealistic, 
magazine quality, interior design showcase. The room maintains its exact structure, 
walls, windows, and doors positions while being completely redesigned with new 
furniture, decor, lighting fixtures, and materials matching the specified style.`;
}
