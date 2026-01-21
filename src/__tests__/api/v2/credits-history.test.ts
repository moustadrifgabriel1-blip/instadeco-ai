/**
 * Tests d'intégration pour GET /api/v2/credits/history
 * 
 * Note: Ces tests mockent le DI container pour tester le comportement de la route
 */
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

// Créer le mock avec vi.hoisted pour pouvoir l'utiliser dans vi.mock
const mockGetCreditHistory = vi.hoisted(() => vi.fn());

// Mock du CreditMapper - doit être avant l'import de la route
vi.mock('@/src/application/mappers/CreditMapper', () => ({
  CreditMapper: {
    toDTOList: vi.fn((transactions) => {
      if (!transactions || !Array.isArray(transactions)) return [];
      return transactions.map((t: Record<string, unknown>) => ({
        id: t.id,
        userId: t.userId,
        amount: t.amount,
        type: t.type,
        description: t.description,
        createdAt: (t.createdAt as Date)?.toISOString?.() || t.createdAt,
        stripeSessionId: t.stripeSessionId,
        generationId: t.generationId,
      }));
    }),
  },
}));

// Mock du DI container
vi.mock('@/src/infrastructure/config/di-container', () => ({
  useCases: {
    getCreditHistory: {
      execute: mockGetCreditHistory,
    },
  },
}));

// Import après les mocks
import { GET } from '@/app/api/v2/credits/history/route';

describe('GET /api/v2/credits/history', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait retourner 400 si userId manquant', async () => {
    const request = new Request('http://localhost/api/v2/credits/history');
    
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toBe('Paramètres invalides');
  });

  it('devrait retourner l\'historique pour un userId valide', async () => {
    const mockTransactions = [
      {
        id: 'tx1',
        userId: 'user123',
        amount: 10,
        type: 'purchase',
        description: 'Achat pack 10',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        stripeSessionId: 'cs_123',
        generationId: null,
      },
      {
        id: 'tx2',
        userId: 'user123',
        amount: -1,
        type: 'generation',
        description: 'Génération image',
        createdAt: new Date('2024-01-16T14:30:00Z'),
        stripeSessionId: null,
        generationId: 'gen_456',
      },
    ];

    mockGetCreditHistory.mockResolvedValue({
      success: true,
      data: mockTransactions,
    });

    const request = new Request('http://localhost/api/v2/credits/history?userId=user123');
    
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.transactions).toHaveLength(2);
    expect(data.transactions[0].id).toBe('tx1');
    expect(data.transactions[0].amount).toBe(10);
    expect(mockGetCreditHistory).toHaveBeenCalledWith({
      userId: 'user123',
      limit: 50,
    });
  });

  it('devrait respecter le paramètre limit', async () => {
    mockGetCreditHistory.mockResolvedValue({
      success: true,
      data: [],
    });

    const request = new Request('http://localhost/api/v2/credits/history?userId=user123&limit=10');
    
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    expect(mockGetCreditHistory).toHaveBeenCalledWith({
      userId: 'user123',
      limit: 10,
    });
  });

  it('devrait retourner une erreur si le use case échoue', async () => {
    mockGetCreditHistory.mockResolvedValue({
      success: false,
      error: { message: 'Erreur base de données', statusCode: 500 },
    });

    const request = new Request('http://localhost/api/v2/credits/history?userId=user123');
    
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(500);
    expect(data.error).toBe('Erreur base de données');
  });
});
