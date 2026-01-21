import { vi } from 'vitest';
import { Result, success, failure } from '@/src/shared/types/Result';
import { IGenerationRepository } from '@/src/domain/ports/repositories/IGenerationRepository';
import { Generation } from '@/src/domain/entities/Generation';

/**
 * Mock du Generation Repository pour les tests
 */
export function createMockGenerationRepository(overrides: Partial<IGenerationRepository> = {}): IGenerationRepository {
  const mockGeneration: Generation = {
    id: 'gen-123',
    userId: 'user-123',
    styleSlug: 'moderne',
    roomType: 'salon',
    inputImageUrl: 'https://storage.test/input.jpg',
    outputImageUrl: null,
    status: 'pending',
    prompt: 'Test prompt',
    hdUnlocked: false,
    stripeSessionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    create: vi.fn().mockResolvedValue(success(mockGeneration)),
    findById: vi.fn().mockResolvedValue(success(mockGeneration)),
    findByUserId: vi.fn().mockResolvedValue(success([mockGeneration])),
    update: vi.fn().mockResolvedValue(success({ ...mockGeneration, status: 'completed' })),
    delete: vi.fn().mockResolvedValue(success(undefined)),
    countByUserId: vi.fn().mockResolvedValue(success(1)),
    ...overrides,
  };
}

/**
 * Crée une génération mock avec les propriétés spécifiées
 */
export function createMockGeneration(overrides: Partial<Generation> = {}): Generation {
  return {
    id: 'gen-123',
    userId: 'user-123',
    styleSlug: 'moderne',
    roomType: 'salon',
    inputImageUrl: 'https://storage.test/input.jpg',
    outputImageUrl: null,
    status: 'pending',
    prompt: 'Test prompt',
    hdUnlocked: false,
    stripeSessionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
