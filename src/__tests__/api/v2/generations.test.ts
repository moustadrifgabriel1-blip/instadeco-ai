/**
 * Tests d'intégration pour GET /api/v2/generations
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Créer le mock avec vi.hoisted pour pouvoir l'utiliser dans vi.mock
const mockListUserGenerations = vi.hoisted(() => vi.fn());

// Mock du GenerationMapper - doit être avant l'import de la route
vi.mock('@/src/application/mappers/GenerationMapper', () => ({
  GenerationMapper: {
    toDTOList: vi.fn((generations) => {
      if (!generations || !Array.isArray(generations)) return [];
      return generations.map((g: Record<string, unknown>) => ({
        id: g.id,
        userId: g.userId,
        styleSlug: g.style || g.styleSlug,
        roomType: g.roomType,
        inputImageUrl: g.inputImageUrl,
        outputImageUrl: g.outputImageUrl,
        status: g.status,
        hdUnlocked: g.hdUnlocked,
        createdAt: (g.createdAt as Date)?.toISOString?.() || g.createdAt,
        updatedAt: (g.updatedAt as Date)?.toISOString?.() || g.updatedAt,
      }));
    }),
  },
}));

// Mock du DI container
vi.mock('@/src/infrastructure/config/di-container', () => ({
  useCases: {
    listUserGenerations: {
      execute: mockListUserGenerations,
    },
  },
}));

// Import après les mocks
import { GET } from '@/app/api/v2/generations/route';

describe('GET /api/v2/generations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait retourner 400 si userId manquant', async () => {
    const request = new Request('http://localhost/api/v2/generations');
    
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toBe('Paramètres invalides');
  });

  it('devrait retourner les générations pour un userId valide', async () => {
    const mockGenerations = [
      {
        id: 'gen1',
        userId: 'user123',
        style: 'moderne',
        roomType: 'salon',
        inputImageUrl: 'https://example.com/input1.jpg',
        outputImageUrl: 'https://example.com/output1.jpg',
        status: 'completed',
        hdUnlocked: false,
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T10:05:00Z'),
      },
      {
        id: 'gen2',
        userId: 'user123',
        style: 'minimaliste',
        roomType: 'chambre',
        inputImageUrl: 'https://example.com/input2.jpg',
        outputImageUrl: null,
        status: 'processing',
        hdUnlocked: false,
        createdAt: new Date('2024-01-16T14:00:00Z'),
        updatedAt: new Date('2024-01-16T14:00:00Z'),
      },
    ];

    mockListUserGenerations.mockResolvedValue({
      success: true,
      data: mockGenerations,
    });

    const request = new Request('http://localhost/api/v2/generations?userId=user123');
    
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.generations).toHaveLength(2);
    expect(data.total).toBe(2);
    expect(data.generations[0].id).toBe('gen1');
    expect(data.generations[0].status).toBe('completed');
    expect(mockListUserGenerations).toHaveBeenCalledWith({
      userId: 'user123',
      limit: 20,
    });
  });

  it('devrait respecter le paramètre limit', async () => {
    mockListUserGenerations.mockResolvedValue({
      success: true,
      data: [],
    });

    const request = new Request('http://localhost/api/v2/generations?userId=user123&limit=5');
    
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    expect(mockListUserGenerations).toHaveBeenCalledWith({
      userId: 'user123',
      limit: 5,
    });
  });

  it('devrait limiter le limit à 100 maximum', async () => {
    mockListUserGenerations.mockResolvedValue({
      success: true,
      data: [],
    });

    const request = new Request('http://localhost/api/v2/generations?userId=user123&limit=500');
    
    const response = await GET(request);
    const data = await response.json();
    
    // Zod devrait rejeter limit > 100
    expect(response.status).toBe(400);
    expect(data.error).toBe('Paramètres invalides');
  });

  it('devrait retourner une erreur si le use case échoue', async () => {
    mockListUserGenerations.mockResolvedValue({
      success: false,
      error: { message: 'Erreur base de données' },
    });

    const request = new Request('http://localhost/api/v2/generations?userId=user123');
    
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(500);
    expect(data.error).toBe('Erreur base de données');
  });

  it('devrait retourner 500 en cas d\'exception', async () => {
    mockListUserGenerations.mockRejectedValue(
      new Error('Connection timeout')
    );

    const request = new Request('http://localhost/api/v2/generations?userId=user123');
    
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(500);
    expect(data.error).toBe('Erreur lors de la récupération des générations');
    expect(data.details).toBe('Connection timeout');
  });
});
