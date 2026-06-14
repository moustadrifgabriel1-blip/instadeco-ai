import { NextResponse } from 'next/server';
import { z } from 'zod';
import { useCases } from '@/src/infrastructure/config/di-container';
import { requireAuth } from '@/lib/security/api-auth';
import type { RatingValue } from '@/src/domain/entities/GenerationRating';

export const dynamic = 'force-dynamic';

/**
 * Schéma de validation du body.
 * IMPORTANT : on NE lit JAMAIS le userId du body — il vient de la session serveur.
 */
const bodySchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  feedbackText: z.string().trim().max(2000).optional().nullable(),
});

/**
 * POST /api/v2/generations/[id]/rate
 *
 * Enregistre la note (1-5) + feedback d'un utilisateur sur une génération.
 * Authentification obligatoire. Idempotent par (generation_id, user_id) via upsert.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // ✅ Authentification obligatoire
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { id: generationId } = await params;

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
    }

    const validation = bodySchema.safeParse(json);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Paramètres invalides',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { rating, feedbackText } = validation.data;

    const result = await useCases.rateGeneration.execute({
      generationId,
      userId: auth.user.id, // ✅ toujours depuis la session
      rating: rating as RatingValue,
      feedbackText: feedbackText ?? null,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message, code: result.error.code },
        { status: result.error.statusCode },
      );
    }

    return NextResponse.json({
      rating: {
        id: result.data.id,
        generationId: result.data.generationId,
        rating: result.data.rating,
        feedbackText: result.data.feedbackText,
        createdAt: result.data.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[Rate Generation V2] ❌ Erreur:', error);
    return NextResponse.json(
      {
        error: "Erreur lors de l'enregistrement de la note",
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 },
    );
  }
}
