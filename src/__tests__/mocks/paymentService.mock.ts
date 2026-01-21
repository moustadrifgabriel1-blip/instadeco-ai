import { vi } from 'vitest';
import { Result, success, failure } from '@/src/shared/types/Result';
import { 
  IPaymentService, 
  CreateCheckoutSessionOptions,
  CheckoutSessionResult,
} from '@/src/domain/ports/services/IPaymentService';

/**
 * Mock du Payment Service pour les tests
 */
export function createMockPaymentService(overrides: Partial<IPaymentService> = {}): IPaymentService {
  return {
    createCheckoutSession: vi.fn().mockResolvedValue(success({
      sessionId: 'cs_test_123',
      url: 'https://checkout.stripe.com/test',
    } as CheckoutSessionResult)),
    retrieveSession: vi.fn().mockResolvedValue(success({
      id: 'cs_test_123',
      paymentStatus: 'paid',
      customerEmail: 'test@example.com',
      metadata: {},
    })),
    verifyWebhook: vi.fn().mockResolvedValue(success({
      type: 'checkout.session.completed',
      sessionId: 'cs_test_123',
      customerId: 'cus_test',
      customerEmail: 'test@example.com',
      amountTotal: 999,
      metadata: {},
    })),
    getOrCreateCustomer: vi.fn().mockResolvedValue(success('cus_test_123')),
    ...overrides,
  };
}
