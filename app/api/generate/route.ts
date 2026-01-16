import { NextResponse } from 'next/server';
import { 
  submitGeneration, 
  buildInteriorDesignPrompt,
  DECORATION_STYLES,
  ROOM_TYPES,
  type DecorationStyle,
  type RoomType
} from '@/lib/ai/fal-client';

/**
 * POST /api/generate
 * 
 * Démarre une nouvelle génération d'image avec Fal.ai (Flux.1 + ControlNet)
 * L'image de l'utilisateur sert de conditioning image pour préserver
 * la structure des murs et fenêtres à 100%.
 * 
 * Body:
 * - imageUrl: string (URL de l'image source - OBLIGATOIRE)
 * - roomType: string (type de pièce: salon, chambre, etc.)
 * - style: string (style de déco: boheme, minimaliste, etc.)
 * - controlMode?: 'canny' | 'depth' (mode ControlNet, défaut: canny)
 * 
 * Response:
 * - requestId: string (ID pour le polling)
 * - status: string ('processing')
 * - prompt: string (prompt utilisé pour la génération)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      imageUrl, 
      roomType = 'salon', 
      style = 'moderne',
      controlMode = 'canny'
    } = body;

    // Validation: Image URL obligatoire
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL requise. Uploadez une photo de votre pièce.' },
        { status: 400 }
      );
    }

    // Validation: REPLICATE_API_TOKEN configurée
    if (!process.env.REPLICATE_API_TOKEN) {
      console.error('[Generate] REPLICATE_API_TOKEN non configurée');
      return NextResponse.json(
        { error: 'Configuration serveur manquante (REPLICATE_API_TOKEN)' },
        { status: 500 }
      );
    }

    // Log des paramètres
    console.log('[Generate] Nouvelle génération:', {
      roomType,
      style,
      controlMode,
      imageUrl: imageUrl.substring(0, 50) + '...',
    });

    // Construire le prompt pour le log
    const roomTypeEnglish = ROOM_TYPES[roomType as RoomType] || roomType;
    const styleDescription = DECORATION_STYLES[style as DecorationStyle] || style;
    const prompt = buildInteriorDesignPrompt(roomTypeEnglish, styleDescription);

    // Soumettre la génération à Replicate.ai
    // L'image de l'utilisateur est utilisée comme CONDITIONING IMAGE
    // pour que ControlNet préserve la structure des murs/fenêtres
    const result = await submitGeneration({
      imageUrl,           // Image source = conditioning image
      roomType,           // Type de pièce (traduit en anglais)
      style,              // Style de décoration
      controlMode,        // Mode ControlNet (canny = contours)
      imageStrength: 0.85, // 85% fidèle à la structure originale
      numInferenceSteps: 28,
      guidanceScale: 7.5,
    });

    // Retourner l'ID de requête pour le polling côté client
    return NextResponse.json({
      requestId: result.requestId,
      status: 'processing',
      prompt, // Pour debug/affichage
      message: 'Génération en cours. La structure de votre pièce sera préservée.',
    });

  } catch (error) {
    console.error('[Generate] Erreur:', error);
    
    // Distinguer les erreurs Replicate des autres
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    const isReplicateError = errorMessage.includes('Replicate');
    
    return NextResponse.json(
      { 
        error: isReplicateError 
          ? 'Erreur lors de la génération. Veuillez réessayer.' 
          : 'Erreur serveur',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
