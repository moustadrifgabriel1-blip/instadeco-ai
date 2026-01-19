import { NextResponse } from 'next/server';
import { stripe } from '@/lib/payments/stripe';
import { adminDb } from '@/lib/firebase/admin';

/**
 * GET /api/hd-unlock/download
 * 
 * Télécharge l'image HD sans filigrane après vérification du paiement
 * Query params: sessionId, generationId
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId');
    const generationId = url.searchParams.get('generationId');

    if (!sessionId || !generationId) {
      return NextResponse.json(
        { error: 'sessionId et generationId requis' },
        { status: 400 }
      );
    }

    // Récupérer la génération
    const generationDoc = await adminDb.collection('generations').doc(generationId).get();

    if (!generationDoc.exists) {
      return NextResponse.json(
        { error: 'Génération non trouvée' },
        { status: 404 }
      );
    }

    const generation = generationDoc.data();

    // Si déjà débloqué, permettre le téléchargement direct
    if (generation?.hdUnlocked) {
      return await downloadImage(generation.outputImageUrl, generationId);
    }

    // Vérifier la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Vérifier que le paiement est complété
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Paiement non complété' },
        { status: 402 }
      );
    }

    // Vérifier que la session correspond bien à cette génération
    if (session.metadata?.generationId !== generationId) {
      return NextResponse.json(
        { error: 'Session non valide pour cette génération' },
        { status: 403 }
      );
    }

    if (!generation?.outputImageUrl) {
      return NextResponse.json(
        { error: 'Image non disponible' },
        { status: 404 }
      );
    }

    // Marquer comme débloqué
    await adminDb.collection('generations').doc(generationId).update({
      hdUnlocked: true,
      hdUnlockedAt: new Date(),
      stripeSessionId: sessionId,
    });

    console.log(`[HD Download] ✅ Téléchargement autorisé: ${generationId}`);

    return await downloadImage(generation.outputImageUrl, generationId);

  } catch (error) {
    console.error('[HD Download] ❌ Erreur:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur lors du téléchargement',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Télécharge l'image et la renvoie en tant que fichier
 */
async function downloadImage(imageUrl: string, generationId: string): Promise<Response> {
  try {
    // Récupérer l'image depuis l'URL
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      throw new Error(`Impossible de récupérer l'image: ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    
    // Déterminer l'extension
    let extension = 'jpg';
    if (contentType.includes('png')) extension = 'png';
    else if (contentType.includes('webp')) extension = 'webp';

    // Créer la réponse avec headers de téléchargement
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="instadeco-hd-${generationId.slice(0, 8)}.${extension}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[Download Image] Erreur:', error);
    throw error;
  }
}

/**
 * POST /api/hd-unlock/download
 * 
 * Alternative POST pour les cas où GET n'est pas pratique
 */
export async function POST(req: Request) {
  try {
    const { sessionId, generationId, userId } = await req.json();

    if (!generationId) {
      return NextResponse.json(
        { error: 'generationId requis' },
        { status: 400 }
      );
    }

    // Récupérer la génération
    const generationDoc = await adminDb.collection('generations').doc(generationId).get();

    if (!generationDoc.exists) {
      return NextResponse.json(
        { error: 'Génération non trouvée' },
        { status: 404 }
      );
    }

    const generation = generationDoc.data();

    // Vérifier que l'utilisateur est le propriétaire
    if (userId && generation?.userId !== userId) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // Si déjà débloqué, retourner l'URL directement
    if (generation?.hdUnlocked) {
      return NextResponse.json({
        success: true,
        imageUrl: generation.outputImageUrl,
        downloadUrl: `/api/hd-unlock/download?sessionId=${generation.stripeSessionId}&generationId=${generationId}`,
        message: 'Image déjà débloquée',
      });
    }

    // Sinon, vérifier le paiement avec sessionId
    if (!sessionId) {
      return NextResponse.json(
        { 
          error: 'Image non débloquée',
          requiresPayment: true,
        },
        { status: 402 }
      );
    }

    // Vérifier la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Paiement non complété' },
        { status: 402 }
      );
    }

    if (session.metadata?.generationId !== generationId) {
      return NextResponse.json(
        { error: 'Session non valide pour cette génération' },
        { status: 403 }
      );
    }

    // Marquer comme débloqué
    await adminDb.collection('generations').doc(generationId).update({
      hdUnlocked: true,
      hdUnlockedAt: new Date(),
      stripeSessionId: sessionId,
    });

    console.log(`[HD Download POST] ✅ Image débloquée: ${generationId}`);

    return NextResponse.json({
      success: true,
      imageUrl: generation?.outputImageUrl,
      downloadUrl: `/api/hd-unlock/download?sessionId=${sessionId}&generationId=${generationId}`,
      message: 'Image HD débloquée avec succès',
    });

  } catch (error) {
    console.error('[HD Download POST] ❌ Erreur:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la vérification',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
