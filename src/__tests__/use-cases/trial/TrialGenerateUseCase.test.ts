import { describe, it, expect, vi } from 'vitest';
import { TrialGenerateUseCase, buildTrialBasePrompt } from '@/src/application/use-cases/trial/TrialGenerateUseCase';
import { success, failure } from '@/src/shared/types/Result';
import type { IImageGeneratorService } from '@/src/domain/ports/services/IImageGeneratorService';

// Petit PNG 1x1 valide en data URI (magic bytes PNG corrects)
const PNG_1x1 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function makeGenerator(): IImageGeneratorService {
  return {
    generate: vi.fn().mockResolvedValue(
      success({ imageUrl: 'https://cdn.example/out.jpg', status: 'succeeded' }),
    ),
  };
}

describe('TrialGenerateUseCase', () => {
  it('délègue au IImageGeneratorService en mode full_redesign et renvoie l’URL', async () => {
    const generator = makeGenerator();
    const useCase = new TrialGenerateUseCase(generator);

    const result = await useCase.execute({ imageBase64: PNG_1x1, style: 'japandi', roomType: 'cuisine' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.imageUrl).toBe('https://cdn.example/out.jpg');
    }

    expect(generator.generate).toHaveBeenCalledTimes(1);
    const opts = (generator.generate as any).mock.calls[0][0];
    expect(opts.transformMode).toBe('full_redesign');
    expect(opts.styleSlug).toBe('japandi');
    expect(opts.roomType).toBe('cuisine');
    expect(opts.controlImageUrl).toBe(PNG_1x1);
    // Le prompt de base ne doit PAS contenir le suffixe qualité (ajouté par le provider)
    expect(opts.prompt).not.toContain('Architectural Digest quality');
  });

  it('propage l’échec du provider', async () => {
    const generator: IImageGeneratorService = {
      generate: vi.fn().mockResolvedValue(failure(new Error('provider down'))),
    };
    const useCase = new TrialGenerateUseCase(generator);

    const result = await useCase.execute({ imageBase64: PNG_1x1, style: 'moderne', roomType: 'salon' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect((result.error as Error).message).toBe('provider down');
    }
  });
});

describe('buildTrialBasePrompt', () => {
  it('intègre style et pièce sans suffixe qualité', () => {
    const prompt = buildTrialBasePrompt('industriel', 'bureau');
    expect(prompt).toContain('industriel');
    expect(prompt).toContain('home office');
    expect(prompt).not.toContain('Architectural Digest quality');
  });
});
