import { describe, it, expect, afterEach, vi } from 'vitest';
import { CreateSubscriptionUseCase, InvalidSubscriptionPlanError } from '@/src/application/use-cases/payments/CreateSubscriptionUseCase';
import { createMockPaymentService, createMockLogger } from '@/src/__tests__/mocks';

const ENV_KEY = 'STRIPE_PRICE_SUB_PRO_MONTHLY';
const baseInput = {
  planId: 'sub_pro' as const,
  interval: 'monthly' as const,
  userId: 'u1',
  email: 'a@b.com',
  successUrl: 'https://x/s',
  cancelUrl: 'https://x/c',
};

describe('CreateSubscriptionUseCase', () => {
  const orig = process.env[ENV_KEY];
  afterEach(() => {
    if (orig === undefined) delete (process.env as Record<string, string | undefined>)[ENV_KEY];
    else process.env[ENV_KEY] = orig;
  });

  it('résout le priceId (env) + metadata et délègue au paymentService', async () => {
    process.env[ENV_KEY] = 'price_pro_monthly';
    const payment = createMockPaymentService();
    const useCase = new CreateSubscriptionUseCase(payment, createMockLogger());

    const result = await useCase.execute(baseInput);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.creditsPerMonth).toBe(80);
      expect(result.data.checkoutUrl).toBe('https://checkout.stripe.com/sub-test');
    }
    expect(payment.createSubscriptionSession).toHaveBeenCalledWith(
      expect.objectContaining({
        priceId: 'price_pro_monthly',
        userId: 'u1',
        metadata: expect.objectContaining({ type: 'subscription', planId: 'sub_pro', creditsPerMonth: '80' }),
      }),
    );
  });

  it('subscription_data.metadata ne contient PAS type (préserve l\'original)', async () => {
    process.env[ENV_KEY] = 'price_pro_monthly';
    const payment = createMockPaymentService();
    const useCase = new CreateSubscriptionUseCase(payment, createMockLogger());

    await useCase.execute(baseInput);

    const call = vi.mocked(payment.createSubscriptionSession).mock.calls[0][0];
    expect(call.subscriptionMetadata.type).toBeUndefined();
    expect(call.subscriptionMetadata.planId).toBe('sub_pro');
  });

  it('InvalidSubscriptionPlanError si le price ID env est absent', async () => {
    delete (process.env as Record<string, string | undefined>)[ENV_KEY];
    const payment = createMockPaymentService();
    const useCase = new CreateSubscriptionUseCase(payment, createMockLogger());

    const result = await useCase.execute(baseInput);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBeInstanceOf(InvalidSubscriptionPlanError);
    expect(payment.createSubscriptionSession).not.toHaveBeenCalled();
  });
});
