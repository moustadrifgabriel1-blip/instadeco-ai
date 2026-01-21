import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PurchaseCreditsUseCase } from '@/src/application/use-cases/credits/PurchaseCreditsUseCase';
import { 
  createMockCreditRepository, 
  createMockLogger 
} from '@/src/__tests__/mocks';
import { createMockPaymentService } from '@/src/__tests__/mocks/paymentService.mock';
import { success, failure } from '@/src/shared/types/Result';

describe('PurchaseCreditsUseCase', () => {
  let useCase: PurchaseCreditsUseCase;
  let mockCreditRepo: ReturnType<typeof createMockCreditRepository>;
  let mockPaymentService: ReturnType<typeof createMockPaymentService>;
  let mockLogger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    mockCreditRepo = createMockCreditRepository();
    mockPaymentService = createMockPaymentService();
    mockLogger = createMockLogger();
    useCase = new PurchaseCreditsUseCase(mockCreditRepo, mockPaymentService, mockLogger);
  });

  describe('execute', () => {
    const validInput = {
      userId: 'user-123',
      userEmail: 'test@example.com',
      packId: 'starter',
      credits: 10,
      priceId: 'price_test_123',
      successUrl: 'https://app.test/success',
      cancelUrl: 'https://app.test/cancel',
    };

    it('should create checkout session successfully', async () => {
      // Arrange
      mockPaymentService.createCheckoutSession = vi.fn().mockResolvedValue(success({
        sessionId: 'cs_test_456',
        url: 'https://checkout.stripe.com/test',
      }));

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sessionId).toBe('cs_test_456');
        expect(result.data.checkoutUrl).toBe('https://checkout.stripe.com/test');
      }
    });

    it('should return validation error when userId is empty', async () => {
      // Act
      const result = await useCase.execute({ ...validInput, userId: '' });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('userId');
      }
    });

    it('should return validation error when userEmail is empty', async () => {
      // Act
      const result = await useCase.execute({ ...validInput, userEmail: '' });

      // Assert
      expect(result.success).toBe(false);
    });

    it('should return validation error when priceId is empty', async () => {
      // Act
      const result = await useCase.execute({ ...validInput, priceId: '' });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('priceId');
      }
    });

    it('should return validation error when credits is zero or negative', async () => {
      // Act
      const result = await useCase.execute({ ...validInput, credits: 0 });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('positif');
      }
    });

    it('should pass correct metadata to payment service', async () => {
      // Act
      await useCase.execute(validInput);

      // Assert
      expect(mockPaymentService.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: validInput.userId,
          userEmail: validInput.userEmail,
          priceId: validInput.priceId,
          metadata: expect.objectContaining({
            type: 'credits_purchase',
            packId: validInput.packId,
            credits: '10',
          }),
        })
      );
    });

    it('should handle payment service error gracefully', async () => {
      // Arrange
      mockPaymentService.createCheckoutSession = vi.fn().mockResolvedValue(
        failure(new Error('Stripe error'))
      );

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(result.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should log purchase attempt', async () => {
      // Act
      await useCase.execute(validInput);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Creating credits purchase session',
        expect.objectContaining({
          userId: validInput.userId,
          packId: validInput.packId,
          credits: validInput.credits,
        })
      );
    });
  });
});
