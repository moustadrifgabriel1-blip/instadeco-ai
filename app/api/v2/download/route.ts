import { NextResponse } from 'next/server';
import { useCases, container } from '@/src/infrastructure/config/di-container';
import { requireAuth } from '@/lib/security/api-auth';
import { checkRateLimitDistributed, getClientIP, RATE_LIMIT_CONFIGS } from '@/lib/security/rate-limiter';
import { safeFetchImage } from '@/src/shared/utils/safe-url';
import { addLegalMention, composeLegalBeforeAfter } from '@/lib/image/compose-legal';

export const dynamic = 'force-dynamic';

/** Formats d'export : rendu brut, rendu avec mention légale incrustée, paire avant/après. */
const FORMATS = ['hd', 'mention', 'avant-apres'] as const;
type DownloadFormat = (typeof FORMATS)[number];

export const maxDuration = 30;

/**
 * GET /api/v2/download?id=xxx&format=hd|mention|avant-apres
 *
 * Télécharge l'image d'une génération appartenant à l'utilisateur authentifié.
 * `format=mention` incruste la mention « Image virtuellement meublée · Photos non
 * contractuelles » dans les pixels ; `format=avant-apres` compose la paire
 * photo d'origine / rendu avec badges + mention (export conforme pour annonces).
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
    // Les formats composés décodent 2 images via sharp : sans limite de débit, une
    // boucle d'appels suffit à saturer la fonction (CPU/mémoire).
    const rateLimit = await checkRateLimitDistributed(getClientIP(req.headers), RATE_LIMIT_CONFIGS.generate);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } },
      );
    }

    const { searchParams } = new URL(req.url);
    const generationId = searchParams.get('id');
    const formatParam = searchParams.get('format') ?? 'hd';

    if (!generationId) {
      return NextResponse.json({ error: 'ID de génération requis' }, { status: 400 });
    }

    if (!FORMATS.includes(formatParam as DownloadFormat)) {
      return NextResponse.json({ error: 'Format inconnu' }, { status: 400 });
    }
    const format = formatParam as DownloadFormat;

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

    const { outputImageUrl, inputImageUrl, fileName } = result.data;

    // Retourner l'image originale.
    // outputImageUrl est d'origine externe (output Fal/Gemini / storage) :
    // garde anti-SSRF + timeout d'abandon (10s) via safeFetchImage (CLAUDE.md).
    const imageResponse = await safeFetchImage(outputImageUrl, undefined, 10_000);

    if (!imageResponse.ok) {
      return NextResponse.json({ error: 'Image non disponible' }, { status: 404 });
    }

    let imageBuffer: Buffer = Buffer.from(await imageResponse.arrayBuffer());
    let outName = fileName;

    if (format === 'mention') {
      imageBuffer = await addLegalMention(imageBuffer);
      outName = fileName.replace(/\.jpg$/, '-mention.jpg');
    } else if (format === 'avant-apres') {
      // La photo d'origine vit dans le bucket PRIVÉ input-images : l'URL stockée
      // ne se fetch pas telle quelle, on la re-signe (1h) avant le fetch SSRF-safe.
      let beforeUrl = inputImageUrl;
      const pathMatch = inputImageUrl.match(/\/input-images\/(.+)$/);
      if (pathMatch) {
        const signed = await container.storageService.createSignedUrl(
          'input-images',
          decodeURIComponent(pathMatch[1]),
          3600,
        );
        if (signed.success) beforeUrl = signed.data;
      }

      const beforeResponse = await safeFetchImage(beforeUrl, undefined, 10_000);
      if (!beforeResponse.ok) {
        return NextResponse.json({ error: 'Photo d\'origine non disponible' }, { status: 404 });
      }
      const beforeBuffer = Buffer.from(await beforeResponse.arrayBuffer());

      imageBuffer = await composeLegalBeforeAfter(beforeBuffer, imageBuffer);
      outName = fileName.replace(/\.jpg$/, '-avant-apres.jpg');
    }

    return new NextResponse(new Uint8Array(imageBuffer), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="${outName}"`,
      },
    });

  } catch (error) {
    console.error('[Download] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
