/**
 * Tests d'intégration pour POST /api/v2/generate
 *
 * Auth : la route lit l'utilisateur via supabase.auth.getUser() (JWT serveur).
 * Le userId vient TOUJOURS de la session, jamais du body.
 */
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';

// Mock de l'auth Supabase serveur (createClient().auth.getUser())
const mockGetUser = vi.hoisted(() => vi.fn());
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}));

// L'audit-logger fait des I/O réseau réelles (Supabase) → on le neutralise
vi.mock('@/lib/security/audit-logger', () => ({
  logRateLimitExceeded: vi.fn().mockResolvedValue(undefined),
  logGenerationCreated: vi.fn().mockResolvedValue(undefined),
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

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

describe('POST /api/v2/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Par défaut : utilisateur authentifié
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user123', email: 'test@example.com' } },
      error: null,
    });
  });

  const createRequest = (body: Record<string, unknown>) =>
    new Request('http://localhost/api/v2/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('devrait retourner 401 si non authentifié', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'No session' },
    });

    const request = createRequest({
      imageUrl: 'data:image/jpeg;base64,/9j/4AAQ...',
      style: 'moderne',
      roomType: 'salon',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('devrait retourner 400 si imageUrl manquant', async () => {
    const request = createRequest({
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
      outputImageUrl: 'https://storage.example.com/output.jpg',
      status: 'completed',
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
      imageUrl: 'data:image/jpeg;base64,/9j/4AAQ...',
      style: 'moderne',
      roomType: 'salon',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.generation.id).toBe('gen_123');
    expect(data.creditsRemaining).toBe(9);
    // Le userId provient de la session, pas du body
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
      imageUrl: 'data:image/jpeg;base64,/9j/4AAQ...',
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
          status: 'completed',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        creditsRemaining: 9,
      },
    });

    const request = createRequest({
      imageUrl: 'data:image/jpeg;base64,/9j/4AAQ...',
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
      imageUrl: 'data:image/jpeg;base64,/9j/4AAQ...',
      style: 'moderne',
      roomType: 'salon',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Erreur serveur critique');
  });
});
