import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

/**
 * GET /api/generations
 * 
 * Récupère les générations de l'utilisateur connecté
 * Accepte userId en query param (authentification côté client via Firebase)
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId manquant' },
        { status: 400 }
      );
    }
    
    console.log('[Generations] Chargement pour userId:', userId);

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
