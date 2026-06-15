import { Result } from '@/src/shared/types/Result';
import { IGenerationRepository } from '@/src/domain/ports/repositories/IGenerationRepository';
import { PublicGalleryItem, PublicGalleryQuery } from '@/src/domain/entities/Generation';

export interface ListPublicGalleryOutput {
  items: PublicGalleryItem[];
  total: number;
}

/**
 * Use Case : galerie publique (générations anonymisées).
 *
 * Applique les règles métier (cap de `limit` à 50 anti-abus, offset ≥ 0) puis délègue
 * la requête anonymisée au repository. Le repository ne SELECT jamais userId/inputImageUrl.
 */
export class ListPublicGalleryUseCase {
  constructor(private readonly generationRepo: IGenerationRepository) {}

  async execute(query: PublicGalleryQuery = {}): Promise<Result<ListPublicGalleryOutput>> {
    const limit = Math.max(1, Math.min(query.limit ?? 24, 50));
    const offset = Math.max(0, query.offset ?? 0);
    return this.generationRepo.findPublicGallery({
      limit,
      offset,
      styleSlug: query.styleSlug,
      roomType: query.roomType,
    });
  }
}
