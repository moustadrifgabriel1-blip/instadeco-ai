import { NextResponse } from 'next/server';
import { z } from 'zod';
import { useCases } from '@/src/infrastructure/config/di-container';
import { requireAuth } from '@/lib/security/api-auth';

/**
 * Schéma de validation pour HD Unlock
 * userId et email viennent du token JWT.
 */
const hdUnlockRequestSchema = z.object({
  generationId: z.string().min(1, 'generationId requis'),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

/**
 * POST /api/v2/hd-unlock/create-checkout
 * 
 * Crée une session Stripe pour débloquer HD via UnlockHDUseCase
 */
export async function POST(req: Request) {
  // ✅ Authentification obligatoire
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const userId = auth.user.id;
  const email = auth.user.email!;

  try {
    const body = await req.json();

    // Validation avec Zod
    const validation = hdUnlockRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation échouée',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { generationId, successUrl, cancelUrl } = validation.data;

    // URLs par défaut
    const origin = new URL(req.url).origin;
    const defaultSuccessUrl = successUrl || `${origin}/dashboard/generations/${generationId}?hd=unlocked`;
    const defaultCancelUrl = cancelUrl || `${origin}/dashboard/generations/${generationId}?hd=cancelled`;

    // Exécuter le Use Case
    const result = await useCases.unlockHD.execute({
      generationId,
      userId,
      userEmail: email,
      successUrl: defaultSuccessUrl,
      cancelUrl: defaultCancelUrl,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: result.error.statusCode }
      );
    }

    const { checkoutUrl, sessionId, alreadyUnlocked } = result.data;

    // Si déjà débloqué, retourner un message approprié
    if (alreadyUnlocked) {
      return NextResponse.json({
        success: true,
        alreadyUnlocked: true,
        message: 'Cette image HD est déjà débloquée',
      });
    }

    return NextResponse.json({
      success: true,
      checkoutUrl,
      sessionId,
      order: {
        type: 'hd_unlock',
        generationId,
      },
    });

  } catch (error) {
    console.error('[HD Unlock V2] ❌ Erreur:', error);

    return NextResponse.json(
      { error: 'Erreur lors de la création de la session HD' },
      { status: 500 }
    );
  }
}
