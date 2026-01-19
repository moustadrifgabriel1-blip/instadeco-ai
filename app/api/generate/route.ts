import { NextResponse } from 'next/server';
import { 
  submitGeneration, 
  buildInteriorDesignPrompt,
  DECORATION_STYLES,
  ROOM_TYPES,
  type DecorationStyle,
  type RoomType
} from '@/lib/ai/fal-client';
import { deductCredits, adminDb, uploadImageFromBase64, uploadImageFromUrlServer } from '@/lib/firebase/admin';
import * as admin from 'firebase-admin';

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
      controlMode = 'canny',
      userId // Ajouté: ID utilisateur Firebase Auth
    } = body;

    // Validation: userId obligatoire
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentification requise. Veuillez vous connecter.' },
        { status: 401 }
      );
    }

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

    // ====================================
    // DÉDUCTION DE CRÉDITS (Transaction atomique)
    // ====================================
    console.log(`[Generate] Vérification crédits pour user ${userId}`);
    
    const hasCredits = await deductCredits(userId, 1);

    if (!hasCredits) {
      console.warn(`[Generate] Crédits insuffisants pour user ${userId}`);
      return NextResponse.json(
        { 
          error: 'Crédits insuffisants',
          message: 'Vous n\'avez plus de crédits. Rechargez votre compte pour continuer.',
          code: 'INSUFFICIENT_CREDITS',
        },
        { status: 402 } // 402 Payment Required
      );
    }

    console.log(`[Generate] 1 crédit déduit pour user ${userId}`);

    // ====================================
    // UPLOAD IMAGE SOURCE VERS FIREBASE STORAGE
    // ====================================
    console.log('[Generate] Upload de l\'image source vers Storage...');
    
    let inputImageStorageUrl: string;
    
    // Déterminer si imageUrl est base64 ou URL
    if (imageUrl.startsWith('data:')) {
      // C'est du base64, uploader via Admin SDK
      inputImageStorageUrl = await uploadImageFromBase64(imageUrl, userId, 'inputs');
    } else {
      // C'est une URL, uploader via Admin SDK
      inputImageStorageUrl = await uploadImageFromUrlServer(imageUrl, userId, 'inputs');
    }
    
    console.log(`[Generate] ✅ Image source uploadée: ${inputImageStorageUrl}`);

    // Log des paramètres
    console.log('[Generate] Nouvelle génération:', {
      roomType,
      style,
      controlMode,
      inputImageStorageUrl,
    });

    // Construire le prompt
    const roomTypeEnglish = ROOM_TYPES[roomType as RoomType] || roomType;
    const styleDescription = DECORATION_STYLES[style as DecorationStyle] || style;
    const prompt = buildInteriorDesignPrompt(roomTypeEnglish, styleDescription);

    // ====================================
    // CRÉER DOCUMENT GENERATION DANS FIRESTORE (status: pending)
    // ====================================
    const generationRef = await adminDb.collection('generations').add({
      userId,
      styleSlug: style,
      roomTypeSlug: roomType,
      prompt,
      controlnetType: controlMode,
      inputImageUrl: inputImageStorageUrl,
      outputImageUrl: null,
      status: 'pending',
      replicateRequestId: null,
      errorMessage: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      completedAt: null,
    });
    
    console.log(`[Generate] ✅ Document generation créé: ${generationRef.id}`);

    // ====================================
    // SOUMETTRE À REPLICATE.AI
    // ====================================
    // L'image de l'utilisateur est utilisée comme CONDITIONING IMAGE
    // pour que ControlNet préserve la structure des murs/fenêtres
    const result = await submitGeneration({
      imageUrl: inputImageStorageUrl, // URL Firebase Storage
      roomType,
      style,
      controlMode,
      imageStrength: 0.85, // 85% fidèle à la structure originale
      numInferenceSteps: 28,
      guidanceScale: 7.5,
    });

    // Mettre à jour le document avec l'ID Replicate et status processing
    await adminDb.collection('generations').doc(generationRef.id).update({
      status: 'processing',
      replicateRequestId: result.requestId,
    });

    console.log(`[Generate] ✅ Generation ${generationRef.id} en cours (Replicate: ${result.requestId})`);

    // Retourner l'ID de génération pour le polling côté client
    return NextResponse.json({
      generationId: generationRef.id,
      requestId: result.requestId,
      status: 'processing',
      prompt,
      message: 'Génération en cours. La structure de votre pièce sera préservée.',
    });

  } catch (error) {
    console.error('[Generate] Erreur complète:', error);
    
    // Toujours afficher les détails d'erreur pour le debug
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    const errorStack = error instanceof Error ? error.stack : '';
    
    console.error('[Generate] Error message:', errorMessage);
    console.error('[Generate] Error stack:', errorStack);
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la génération',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
