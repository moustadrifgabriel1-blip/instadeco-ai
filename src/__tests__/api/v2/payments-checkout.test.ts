/**
 * Tests d'intégration pour POST /api/v2/payments/create-checkout
 */
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';

// Mock du DI container
vi.mock('@/src/infrastructure/config/di-container', () => ({
  useCases: {
    purchaseCredits: {
      execute: vi.fn(),
    },
  },
}));

// Mock des constantes de pricing
vi.mock('@/src/shared/constants/pricing', () => ({
  CREDIT_PRICES: {
    PACK_10: { credits: 10, stripePriceId: 'price_10_test' },
    PACK_25: { credits: 25, stripePriceId: 'price_25_test' },
    PACK_50: { credits: 50, stripePriceId: 'price_50_test' },
    PACK_100: { credits: 100, stripePriceId: 'price_100_test' },
  },
}));

// Import après les mocks
import { POST } from '@/app/api/v2/payments/create-checkout/route';
import { useCases } from '@/src/infrastructure/config/di-container';

describe('POST /api/v2/payments/create-checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (body: Record<string, unknown>) =>
    new Request('http://localhost/api/v2/payments/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('devrait retourner 400 si userId manquant', async () => {
    const request = createRequest({
      email: 'test@example.com',
      packId: 'pack_10',
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation échouée');
    expect(data.details.userId).toBeDefined();
  });

  it('devrait retourner 400 si email invalide', async () => {
    const request = createRequest({
      userId: 'user123',
      email: 'not-an-email',
      packId: 'pack_10',
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation échouée');
    expect(data.details.email).toBeDefined();
  });

  it('devrait retourner 400 si packId invalide', async () => {
    const request = createRequest({
      userId: 'user123',
      email: 'test@example.com',
      packId: 'pack_999', // Invalid
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
      userId: 'user123',
      email: 'test@example.com',
      packId: 'pack_25',
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.checkoutUrl).toBe('https://checkout.stripe.com/session123');
    expect(data.sessionId).toBe('cs_test_123');
    expect(useCases.purchaseCredits.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user123',
        userEmail: 'test@example.com',
        packId: 'pack_25',
        credits: 25,
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

    const request = createRequest({
      userId: 'user123',
      email: 'test@example.com',
      // pas de packId
    });
    
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
      userId: 'user123',
      email: 'test@example.com',
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
      userId: 'user123',
      email: 'test@example.com',
      packId: 'pack_10',
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(500);
    expect(data.details).toBe('Network error');
  });
});
