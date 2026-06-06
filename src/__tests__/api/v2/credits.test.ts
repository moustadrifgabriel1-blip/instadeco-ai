/**
 * Tests d'intégration pour GET /api/v2/credits
 *
 * Auth : userId extrait du token JWT via requireAuth (supabase.auth.getUser).
 */
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';

// Mock de l'auth Supabase serveur (requireAuth utilise createClient en interne)
const mockGetUser = vi.hoisted(() => vi.fn());
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}));

// Mock du DI container
vi.mock('@/src/infrastructure/config/di-container', () => ({
  useCases: {
    getUserCredits: {
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
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user123', email: 'test@example.com' } },
      error: null,
    });
  });

  it('devrait retourner 401 si non authentifié', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No session' } });

    const request = new Request('http://localhost/api/v2/credits');

    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('devrait retourner les crédits de l\'utilisateur authentifié', async () => {
    (useCases.getUserCredits.execute as Mock).mockResolvedValue({
      success: true,
      data: { balance: 42 },
    });

    const request = new Request('http://localhost/api/v2/credits');

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

    const request = new Request('http://localhost/api/v2/credits');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Utilisateur non trouvé');
  });

  it('devrait retourner 500 en cas d\'exception', async () => {
    (useCases.getUserCredits.execute as Mock).mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = new Request('http://localhost/api/v2/credits');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Erreur lors de la récupération des crédits');
  });
});
