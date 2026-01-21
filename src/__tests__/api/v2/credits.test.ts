/**
 * Tests d'intégration pour les routes API V2
 * 
 * Ces tests vérifient que les routes Next.js appellent correctement
 * les Use Cases et retournent les bonnes réponses HTTP.
 */
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { NextRequest } from 'next/server';

// Mock du DI container
vi.mock('@/src/infrastructure/config/di-container', () => ({
  useCases: {
    getUserCredits: {
      execute: vi.fn(),
    },
    getCreditHistory: {
      execute: vi.fn(),
    },
    addCredits: {
      execute: vi.fn(),
    },
    purchaseCredits: {
      execute: vi.fn(),
    },
  },
}));

// Import après le mock
import { GET } from '@/app/api/v2/credits/route';
import { useCases } from '@/src/infrastructure/config/di-container';

describe('GET /api/v2/credits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait retourner 400 si userId manquant', async () => {
    const request = new Request('http://localhost/api/v2/credits');
    
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toBe('Paramètres invalides');
  });

  it('devrait retourner les crédits pour un userId valide', async () => {
    (useCases.getUserCredits.execute as Mock).mockResolvedValue({
      success: true,
      data: { balance: 42 },
    });

    const request = new Request('http://localhost/api/v2/credits?userId=user123');
    
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.credits).toBe(42);
    expect(data.userId).toBe('user123');
    expect(useCases.getUserCredits.execute).toHaveBeenCalledWith({ userId: 'user123' });
  });

  it('devrait retourner une erreur si le use case échoue', async () => {
    (useCases.getUserCredits.execute as Mock).mockResolvedValue({
      success: false,
      error: { message: 'Utilisateur non trouvé', statusCode: 404 },
    });

    const request = new Request('http://localhost/api/v2/credits?userId=unknown');
    
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(404);
    expect(data.error).toBe('Utilisateur non trouvé');
  });

  it('devrait retourner 500 en cas d\'exception', async () => {
    (useCases.getUserCredits.execute as Mock).mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = new Request('http://localhost/api/v2/credits?userId=user123');
    
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(500);
    expect(data.error).toBe('Erreur lors de la récupération des crédits');
    expect(data.details).toBe('Database connection failed');
  });
});
