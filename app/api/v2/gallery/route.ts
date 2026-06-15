import { NextResponse } from 'next/server';
import { useCases } from '@/src/infrastructure/config/di-container';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v2/gallery — Générations publiques pour la galerie.
 * Passe par ListPublicGalleryUseCase (DI) : anonymisé (sans input_image_url),
 * cap limit à 50, total filtré. Le contrat JSON (snake_case) est préservé.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limitParam = url.searchParams.get('limit');
    const offsetParam = url.searchParams.get('offset');

    const result = await useCases.listPublicGallery.execute({
      styleSlug: url.searchParams.get('style') ?? undefined,
      roomType: url.searchParams.get('room') ?? undefined,
      limit: limitParam ? parseInt(limitParam, 10) : undefined,
      offset: offsetParam ? parseInt(offsetParam, 10) : undefined,
    });

    if (!result.success) {
      console.error('[Gallery] error:', result.error.message);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({
      generations: result.data.items.map((g) => ({
        id: g.id,
        style_slug: g.styleSlug,
        room_type_slug: g.roomType,
        output_image_url: g.outputImageUrl,
        created_at: g.createdAt.toISOString(),
      })),
      total: result.data.total,
    });
  } catch (error) {
    console.error('[Gallery] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
