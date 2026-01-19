import { NextResponse } from 'next/server';
import { getGenerationStatus } from '@/lib/ai/fal-client';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { uploadImageFromUrl } from '@/lib/firebase/storage';

/**
 * GET /api/generate/[id]/status
 * 
 * Vérifie le statut d'une génération en cours
 * Met à jour Firestore quand la génération est terminée
 * 
 * Params:
 * - id: string (ID du document Firestore)
 * 
 * Response:
 * - id: string (ID de la génération)
 * - status: 'pending' | 'processing' | 'completed' | 'failed'
 * - outputImageUrl?: string (si completed)
 * - errorMessage?: string (si failed)
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Récupérer le document depuis Firestore
    const generationRef = doc(db, 'generations', id);
    const generationSnap = await getDoc(generationRef);

    if (!generationSnap.exists()) {
      return NextResponse.json(
        { error: 'Génération introuvable' },
        { status: 404 }
      );
    }

    const generation = generationSnap.data();

    // Si déjà completed ou failed, retourner directement
    if (generation.status === 'completed' || generation.status === 'failed') {
      return NextResponse.json({
        id,
        status: generation.status,
        outputImageUrl: generation.outputImageUrl,
        errorMessage: generation.errorMessage,
      });
    }

    // Si pending ou processing, vérifier Replicate
    if (!generation.replicateRequestId) {
      return NextResponse.json({
        id,
        status: 'pending',
        message: 'En attente de traitement',
      });
    }

    // Vérifier le statut sur Replicate
    console.log(`[Status] Vérification Replicate: ${generation.replicateRequestId}`);
    const replicateStatus = await getGenerationStatus(generation.replicateRequestId);

    // Si toujours en cours, retourner status processing
    if (replicateStatus.status === 'processing' || replicateStatus.status === 'starting') {
      // Mettre à jour le status dans Firestore si nécessaire
      if (generation.status !== 'processing') {
        await updateDoc(generationRef, {
          status: 'processing',
        });
      }

      return NextResponse.json({
        id,
        status: 'processing',
        progress: replicateStatus.logs?.includes('step') 
          ? parseInt(replicateStatus.logs.match(/(\d+)%/)?.[1] || '50')
          : 50,
      });
    }

    // Si succeeded, télécharger l'image et mettre à jour Firestore
    if (replicateStatus.status === 'succeeded' && replicateStatus.output) {
      console.log(`[Status] ✅ Génération terminée: ${generation.replicateRequestId}`);

      // Uploader l'image générée vers Firebase Storage
      const outputImageStorageUrl = await uploadImageFromUrl(
        replicateStatus.output,
        generation.userId,
        'outputs'
      );

      console.log(`[Status] ✅ Image output uploadée: ${outputImageStorageUrl}`);

      // Mettre à jour Firestore
      await updateDoc(generationRef, {
        status: 'completed',
        outputImageUrl: outputImageStorageUrl,
        completedAt: serverTimestamp(),
      });

      return NextResponse.json({
        id,
        status: 'completed',
        outputImageUrl: outputImageStorageUrl,
      });
    }

    // Si failed
    if (replicateStatus.status === 'failed') {
      console.error(`[Status] ❌ Génération échouée: ${replicateStatus.error}`);

      await updateDoc(generationRef, {
        status: 'failed',
        errorMessage: replicateStatus.error || 'Erreur lors de la génération',
        completedAt: serverTimestamp(),
      });

      return NextResponse.json({
        id,
        status: 'failed',
        errorMessage: replicateStatus.error || 'Erreur lors de la génération',
      });
    }

    // Status inconnu
    return NextResponse.json({
      id,
      status: 'processing',
    });

  } catch (error) {
    console.error('[Status] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du statut' },
      { status: 500 }
    );
  }
}
