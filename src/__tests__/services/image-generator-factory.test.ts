/**
 * Tests de la factory de provider d'image (sélection via IMAGE_PROVIDER).
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createImageGeneratorService } from '@/src/infrastructure/services/image-generator-factory';
import { FalImageGeneratorService } from '@/src/infrastructure/services/fal/FalImageGeneratorService';
import { GeminiImageGeneratorService } from '@/src/infrastructure/services/gemini/GeminiImageGeneratorService';

describe('createImageGeneratorService', () => {
  const original = process.env.IMAGE_PROVIDER;

  afterEach(() => {
    if (original === undefined) delete process.env.IMAGE_PROVIDER;
    else process.env.IMAGE_PROVIDER = original;
    vi.restoreAllMocks();
  });

  it('retourne Fal par défaut (variable absente)', () => {
    delete process.env.IMAGE_PROVIDER;
    expect(createImageGeneratorService()).toBeInstanceOf(FalImageGeneratorService);
  });

  it('retourne Fal quand IMAGE_PROVIDER=fal', () => {
    process.env.IMAGE_PROVIDER = 'fal';
    expect(createImageGeneratorService()).toBeInstanceOf(FalImageGeneratorService);
  });

  it('retourne Gemini quand IMAGE_PROVIDER=gemini', () => {
    process.env.IMAGE_PROVIDER = 'gemini';
    expect(createImageGeneratorService()).toBeInstanceOf(GeminiImageGeneratorService);
  });

  it('est insensible à la casse', () => {
    process.env.IMAGE_PROVIDER = 'GEMINI';
    expect(createImageGeneratorService()).toBeInstanceOf(GeminiImageGeneratorService);
  });

  it('retombe sur Fal pour une valeur inconnue', () => {
    process.env.IMAGE_PROVIDER = 'midjourney';
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(createImageGeneratorService()).toBeInstanceOf(FalImageGeneratorService);
  });
});
