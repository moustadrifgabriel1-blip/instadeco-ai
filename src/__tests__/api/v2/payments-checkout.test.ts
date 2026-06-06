/**
 * Tests d'intégration pour POST /api/v2/payments/create-checkout
 *
 * Auth : userId et email extraits du token JWT via requireAuth.
 * Les price IDs Stripe proviennent des variables d'environnement STRIPE_PRICE_*.
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
    purchaseCredits: {
      execute: vi.fn(),
    },
  },
}));

// Import après les mocks
import { POST } from '@/app/api/v2/payments/create-checkout/route';
import { useCases } from '@/src/infrastructure/config/di-container';

describe('POST /api/v2/payments/create-checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user123', email: 'test@example.com' } },
      error: null,
    });
    // Price IDs nécessaires pour que getPackConfig ne retourne pas null
    process.env.STRIPE_PRICE_STARTER = 'price_10_test';
    process.env.STRIPE_PRICE_PRO = 'price_25_test';
    process.env.STRIPE_PRICE_UNLIMITED = 'price_50_test';
    process.env.STRIPE_PRICE_100_CREDITS = 'price_100_test';
  });

  const createRequest = (body: Record<string, unknown>) =>
    new Request('http://localhost/api/v2/payments/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('devrait retourner 401 si non authentifié', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No session' } });

    const request = createRequest({ packId: 'pack_10' });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('devrait retourner 400 si packId invalide', async () => {
    const request = createRequest({
      packId: 'pack_999', // hors enum
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation échouée');
  });

  it('devrait créer une session checkout avec succès', async () => {
    (useCases.purchaseCredits.execute as Mock).mockResolvedValue({
      success: true,
      data: {
        checkoutUrl: 'https://checkout.stripe.com/session123',
        sessionId: 'cs_test_123',
      },
    });

    const request = createRequest({
      packId: 'pack_25',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.checkoutUrl).toBe('https://checkout.stripe.com/session123');
    expect(data.sessionId).toBe('cs_test_123');
    // userId et email proviennent du token, pas du body
    expect(useCases.purchaseCredits.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user123',
        userEmail: 'test@example.com',
        packId: 'pack_25',
        credits: 25,
        priceId: 'price_25_test',
      })
    );
  });

  it('devrait utiliser pack_10 par défaut si packId non fourni', async () => {
    (useCases.purchaseCredits.execute as Mock).mockResolvedValue({
      success: true,
      data: {
        checkoutUrl: 'https://checkout.stripe.com/session123',
        sessionId: 'cs_test_123',
      },
    });

    const request = createRequest({});

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(useCases.purchaseCredits.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        packId: 'pack_10',
        credits: 10,
      })
    );
  });

  it('devrait retourner une erreur si le use case échoue', async () => {
    (useCases.purchaseCredits.execute as Mock).mockResolvedValue({
      success: false,
      error: { message: 'Stripe API error', statusCode: 500 },
    });

    const request = createRequest({
      packId: 'pack_10',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Stripe API error');
  });

  it('devrait retourner 500 en cas d\'exception', async () => {
    (useCases.purchaseCredits.execute as Mock).mockRejectedValue(
      new Error('Network error')
    );

    const request = createRequest({
      packId: 'pack_10',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Erreur lors de la création de la session de paiement');
  });
});
