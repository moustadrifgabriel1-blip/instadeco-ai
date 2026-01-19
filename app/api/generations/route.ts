import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

/**
 * GET /api/generations
 * 
 * Récupère les générations de l'utilisateur connecté
 */
export async function GET(req: Request) {
  try {
    // Récupérer l'userId depuis les headers (ajouté par le middleware d'auth)
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Extraire le userId du token (simplifié - à améliorer avec vérification Firebase)
    // Pour l'instant, on utilise un query param temporaire
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId manquant' },
        { status: 400 }
      );
    }

    // Récupérer les générations de l'utilisateur
    const generationsSnapshot = await adminDb
      .collection('generations')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    const generations = generationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));

    return NextResponse.json({
      generations,
      total: generations.length,
    });

  } catch (error) {
    console.error('[Generations] ❌ Erreur:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des générations',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
