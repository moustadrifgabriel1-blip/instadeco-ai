import { describe, it, expect, vi } from 'vitest';
import { ListPublicGalleryUseCase } from '@/src/application/use-cases/generation/ListPublicGalleryUseCase';
import { createMockGenerationRepository } from '@/src/__tests__/mocks/generationRepository.mock';
import { success } from '@/src/shared/types/Result';

describe('ListPublicGalleryUseCase', () => {
  it('cape limit à 50 et force offset ≥ 0 (anti-abus)', async () => {
    const repo = createMockGenerationRepository({
      findPublicGallery: vi.fn().mockResolvedValue(success({ items: [], total: 0 })),
    });
    const useCase = new ListPublicGalleryUseCase(repo);

    await useCase.execute({ limit: 9999, offset: -5, styleSlug: 'moderne' });

    expect(repo.findPublicGallery).toHaveBeenCalledWith({
      limit: 50,
      offset: 0,
      styleSlug: 'moderne',
      roomType: undefined,
    });
  });

  it('applique les défauts (limit 24, offset 0) et propage items + total', async () => {
    const repo = createMockGenerationRepository({
      findPublicGallery: vi.fn().mockResolvedValue(
        success({ items: [{ id: 'g1', styleSlug: 'japandi', roomType: 'salon', outputImageUrl: 'https://x/o.jpg', createdAt: new Date() }], total: 1 }),
      ),
    });
    const useCase = new ListPublicGalleryUseCase(repo);

    const result = await useCase.execute();

    expect(repo.findPublicGallery).toHaveBeenCalledWith({ limit: 24, offset: 0, styleSlug: undefined, roomType: undefined });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.total).toBe(1);
      expect(result.data.items).toHaveLength(1);
    }
  });
});
