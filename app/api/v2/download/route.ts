import { NextResponse } from 'next/server';
import { useCases } from '@/src/infrastructure/config/di-container';
import { requireAuth } from '@/lib/security/api-auth';
import { safeFetchImage } from '@/src/shared/utils/safe-url';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v2/download?id=xxx
 *
 * Télécharge l'image d'une génération appartenant à l'utilisateur authentifié.
 *
 * Architecture (clean) :
 * - La logique métier (existence + propriété + disponibilité de l'image) est
 *   portée par GetGenerationDownloadUseCase, exécuté via le DI container.
 *   Le userId vient TOUJOURS de la session (requireAuth), jamais du query/body.
 * - La route garde le transport : parsing du query param, codes HTTP, et surtout
 *   le fetch SSRF-safe + streaming des octets + headers (le use-case ne fetch pas).
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const generationId = searchParams.get('id');

    if (!generationId) {
      return NextResponse.json({ error: 'ID de génération requis' }, { status: 400 });
    }

    // ✅ Authentification obligatoire — userId issu du token JWT.
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const userId = auth.user.id;

    // Use-case : valide existence + propriété + disponibilité de l'image.
    const result = await useCases.getGenerationDownload.execute({ generationId, userId });

    if (!result.success) {
      // GenerationNotFoundError → 404 « Génération non trouvée »
      // ImageUnavailableError   → 404 « Image non disponible »
      const message =
        result.error.code === 'GENERATION_IMAGE_UNAVAILABLE'
          ? 'Image non disponible'
          : 'Génération non trouvée';
      return NextResponse.json({ error: message }, { status: result.error.statusCode });
    }

    const { outputImageUrl, fileName } = result.data;

    // Retourner l'image originale.
    // outputImageUrl est d'origine externe (output Fal/Gemini / storage) :
    // garde anti-SSRF + timeout d'abandon (10s) via safeFetchImage (CLAUDE.md).
    const imageResponse = await safeFetchImage(outputImageUrl, undefined, 10_000);

    if (!imageResponse.ok) {
      return NextResponse.json({ error: 'Image non disponible' }, { status: 404 });
    }

    const imageBuffer = await imageResponse.arrayBuffer();

    return new NextResponse(new Uint8Array(imageBuffer), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('[Download] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
