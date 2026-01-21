/**
 * Tests d'intégration pour POST /api/v2/generate
 */
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';

// Mock du DI container
vi.mock('@/src/infrastructure/config/di-container', () => ({
  useCases: {
    generateDesign: {
      execute: vi.fn(),
    },
  },
}));

// Mock du GenerationMapper
vi.mock('@/src/application/mappers/GenerationMapper', () => ({
  GenerationMapper: {
    toDTO: vi.fn((gen) => {
      if (!gen) return null;
      return {
        id: gen.id,
        userId: gen.userId,
        styleSlug: gen.style || gen.styleSlug,
        roomType: gen.roomType,
        inputImageUrl: gen.inputImageUrl,
        outputImageUrl: gen.outputImageUrl,
        status: gen.status,
        hdUnlocked: gen.hdUnlocked,
        createdAt: (gen.createdAt as Date)?.toISOString?.() || gen.createdAt,
        updatedAt: (gen.updatedAt as Date)?.toISOString?.() || gen.updatedAt,
      };
    }),
  },
}));

// Import après les mocks
import { POST } from '@/app/api/v2/generate/route';
import { useCases } from '@/src/infrastructure/config/di-container';
import { InsufficientCreditsError } from '@/src/domain/errors/InsufficientCreditsError';
import { DomainError } from '@/src/domain/errors/DomainError';

describe('POST /api/v2/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (body: Record<string, unknown>) =>
    new Request('http://localhost/api/v2/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('devrait retourner 400 si userId manquant', async () => {
    const request = createRequest({
      imageUrl: 'https://example.com/image.jpg',
      style: 'moderne',
      roomType: 'salon',
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation échouée');
    expect(data.details.userId).toBeDefined();
  });

  it('devrait retourner 400 si imageUrl manquant', async () => {
    const request = createRequest({
      userId: 'user123',
      style: 'moderne',
      roomType: 'salon',
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation échouée');
    expect(data.details.imageUrl).toBeDefined();
  });

  it('devrait démarrer une génération avec succès', async () => {
    const mockGeneration = {
      id: 'gen_123',
      userId: 'user123',
      style: 'moderne',
      roomType: 'salon',
      inputImageUrl: 'https://storage.example.com/input.jpg',
      outputImageUrl: null,
      status: 'processing',
      hdUnlocked: false,
      createdAt: new Date('2024-01-15T10:00:00Z'),
      updatedAt: new Date('2024-01-15T10:00:00Z'),
    };

    (useCases.generateDesign.execute as Mock).mockResolvedValue({
      success: true,
      data: {
        generation: mockGeneration,
        creditsRemaining: 9,
      },
    });

    const request = createRequest({
      userId: 'user123',
      imageUrl: 'data:image/jpeg;base64,/9j/4AAQ...',
      style: 'moderne',
      roomType: 'salon',
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.generation.id).toBe('gen_123');
    expect(data.generation.status).toBe('processing');
    expect(useCases.generateDesign.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user123',
        styleSlug: 'moderne',
        roomType: 'salon',
      })
    );
  });

  it('devrait retourner 402 si crédits insuffisants', async () => {
    const error = new InsufficientCreditsError(0, 1);
    
    (useCases.generateDesign.execute as Mock).mockResolvedValue({
      success: false,
      error,
    });

    const request = createRequest({
      userId: 'user123',
      imageUrl: 'https://example.com/image.jpg',
      style: 'moderne',
      roomType: 'salon',
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(402);
    expect(data.code).toBe('INSUFFICIENT_CREDITS');
    expect(data.currentCredits).toBe(0);
    expect(data.requiredCredits).toBe(1);
  });

  it('devrait utiliser les valeurs par défaut pour style et roomType', async () => {
    (useCases.generateDesign.execute as Mock).mockResolvedValue({
      success: true,
      data: {
        generation: {
          id: 'gen_123',
          userId: 'user123',
          style: 'moderne',
          roomType: 'salon',
          inputImageUrl: 'https://storage.example.com/input.jpg',
          outputImageUrl: null,
          status: 'processing',
          hdUnlocked: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        creditsRemaining: 9,
      },
    });

    const request = createRequest({
      userId: 'user123',
      imageUrl: 'https://example.com/image.jpg',
      // pas de style ni roomType
    });
    
    const response = await POST(request);
    
    expect(response.status).toBe(200);
    expect(useCases.generateDesign.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        styleSlug: 'moderne',
        roomType: 'salon',
      })
    );
  });

  it('devrait retourner 500 en cas d\'exception', async () => {
    (useCases.generateDesign.execute as Mock).mockRejectedValue(
      new Error('AI service unavailable')
    );

    const request = createRequest({
      userId: 'user123',
      imageUrl: 'https://example.com/image.jpg',
      style: 'moderne',
      roomType: 'salon',
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(500);
    expect(data.error).toBe('Erreur serveur');
  });
});
