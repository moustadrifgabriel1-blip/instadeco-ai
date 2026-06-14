import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateGuestCheckoutUseCase } from '@/src/application/use-cases/payments/CreateGuestCheckoutUseCase';
import { createMockLogger } from '@/src/__tests__/mocks';
import { createMockPaymentService } from '@/src/__tests__/mocks/paymentService.mock';
import { success, failure } from '@/src/shared/types/Result';

describe('CreateGuestCheckoutUseCase', () => {
  let useCase: CreateGuestCheckoutUseCase;
  let mockPaymentService: ReturnType<typeof createMockPaymentService>;
  let mockLogger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    mockPaymentService = createMockPaymentService();
    mockLogger = createMockLogger();
    useCase = new CreateGuestCheckoutUseCase(mockPaymentService, mockLogger);
  });

  describe('execute', () => {
    const validInput = {
      email: 'buyer@example.com',
      packId: 'starter',
      credits: 10,
      priceId: 'price_test_123',
      successUrl: 'https://app.test/success',
      cancelUrl: 'https://app.test/cancel',
    };

    it('crée une session de checkout invité avec succès', async () => {
      // Arrange
      mockPaymentService.createCheckoutSession = vi.fn().mockResolvedValue(success({
        sessionId: 'cs_guest_456',
        url: 'https://checkout.stripe.com/guest',
      }));

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sessionId).toBe('cs_guest_456');
        expect(result.data.checkoutUrl).toBe('https://checkout.stripe.com/guest');
      }
    });

    it('normalise l\'email (trim + lowercase) avant de l\'envoyer à Stripe', async () => {
      // Act
      await useCase.execute({ ...validInput, email: '  Buyer@Example.COM  ' });

      // Assert : l'email normalisé est passé en userEmail ET dans la metadata.
      expect(mockPaymentService.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          userEmail: 'buyer@example.com',
          metadata: expect.objectContaining({ email: 'buyer@example.com' }),
        })
      );
    });

    it('ne passe PAS de userId (achat invité)', async () => {
      // Act
      await useCase.execute(validInput);

      // Assert
      const callArg = (mockPaymentService.createCheckoutSession as ReturnType<typeof vi.fn>).mock
        .calls[0][0];
      expect(callArg.userId).toBeUndefined();
    });

    it('verrouille le contrat metadata : type guest + credits stringifié', async () => {
      // Act
      await useCase.execute(validInput);

      // Assert
      expect(mockPaymentService.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          priceId: validInput.priceId,
          successUrl: validInput.successUrl,
          cancelUrl: validInput.cancelUrl,
          metadata: expect.objectContaining({
            type: 'guest_credits_purchase',
            packId: validInput.packId,
            credits: '10', // crédits stringifiés (Stripe metadata = string)
          }),
        })
      );
    });

    it('rejette quand l\'email est vide', async () => {
      // Act
      const result = await useCase.execute({ ...validInput, email: '' });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('email');
      }
      expect(mockPaymentService.createCheckoutSession).not.toHaveBeenCalled();
    });

    it('rejette quand l\'email ne contient que des espaces (après trim)', async () => {
      // Act
      const result = await useCase.execute({ ...validInput, email: '    ' });

      // Assert
      expect(result.success).toBe(false);
      expect(mockPaymentService.createCheckoutSession).not.toHaveBeenCalled();
    });

    it('rejette quand le priceId est vide', async () => {
      // Act
      const result = await useCase.execute({ ...validInput, priceId: '' });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('priceId');
      }
      expect(mockPaymentService.createCheckoutSession).not.toHaveBeenCalled();
    });

    it('rejette quand credits <= 0', async () => {
      // Act
      const zero = await useCase.execute({ ...validInput, credits: 0 });
      const negative = await useCase.execute({ ...validInput, credits: -5 });

      // Assert
      expect(zero.success).toBe(false);
      expect(negative.success).toBe(false);
      if (!zero.success) {
        expect(zero.error.message).toContain('positif');
      }
      expect(mockPaymentService.createCheckoutSession).not.toHaveBeenCalled();
    });

    it('passe le couponId au service de paiement quand fourni', async () => {
      // Act
      await useCase.execute({ ...validInput, couponId: 'promo20' });

      // Assert
      expect(mockPaymentService.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({ couponId: 'promo20' })
      );
    });

    it('gère proprement une erreur du service de paiement', async () => {
      // Arrange
      mockPaymentService.createCheckoutSession = vi.fn().mockResolvedValue(
        failure(new Error('Stripe down'))
      );

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(result.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('logue la tentative de création de session guest', async () => {
      // Act
      await useCase.execute(validInput);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Creating guest checkout session',
        expect.objectContaining({
          packId: validInput.packId,
          credits: validInput.credits,
        })
      );
    });
  });
});
