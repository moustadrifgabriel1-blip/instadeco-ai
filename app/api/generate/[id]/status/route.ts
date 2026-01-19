import { NextResponse } from 'next/server';
import { checkGenerationStatus } from '@/lib/ai/fal-client';
import { adminDb, uploadImageFromUrlServer } from '@/lib/firebase/admin';
import * as admin from 'firebase-admin';

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

    // Récupérer le document depuis Firestore (Admin SDK)
    const generationRef = adminDb.collection('generations').doc(id);
    const generationSnap = await generationRef.get();

    if (!generationSnap.exists) {
      return NextResponse.json(
        { error: 'Génération introuvable' },
        { status: 404 }
      );
    }

    const generation = generationSnap.data()!;

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
    const replicateStatus = await checkGenerationStatus(generation.replicateRequestId);

    // Si toujours en cours, retourner status processing
    if (replicateStatus.status === 'IN_QUEUE' || replicateStatus.status === 'IN_PROGRESS') {
      // Mettre à jour le status dans Firestore si nécessaire
      if (generation.status !== 'processing') {
        await generationRef.update({
          status: 'processing',
        });
      }

      return NextResponse.json({
        id,
        status: 'processing',
        progress: replicateStatus.progress || 50,
      });
    }

    // Si succeeded, télécharger l'image et mettre à jour Firestore
    if (replicateStatus.status === 'COMPLETED' && replicateStatus.images?.[0]?.url) {
      console.log(`[Status] ✅ Génération terminée: ${generation.replicateRequestId}`);

      // Uploader l'image générée vers Firebase Storage (Admin SDK)
      const outputImageStorageUrl = await uploadImageFromUrlServer(
        replicateStatus.images[0].url,
        generation.userId,
        'outputs'
      );

      console.log(`[Status] ✅ Image output uploadée: ${outputImageStorageUrl}`);

      // Mettre à jour Firestore (Admin SDK)
      await generationRef.update({
        status: 'completed',
        outputImageUrl: outputImageStorageUrl,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return NextResponse.json({
        id,
        status: 'completed',
        outputImageUrl: outputImageStorageUrl,
      });
    }

    // Si failed
    if (replicateStatus.status === 'FAILED') {
      console.error(`[Status] ❌ Génération échouée: ${replicateStatus.error}`);

      await generationRef.update({
        status: 'failed',
        errorMessage: replicateStatus.error || 'Erreur lors de la génération',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
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
