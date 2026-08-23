import { describe, it, expect, vi } from 'vitest';
import { success, failure } from '@/src/shared/types/Result';
import { createMockPaymentService } from '../../mocks/paymentService.mock';
import {
  GetCheckoutSessionStatusUseCase,
  maskEmail,
} from '@/src/application/use-cases/payments/GetCheckoutSessionStatusUseCase';

/**
 * Page de succès d'un acheteur SANS compte : il revient de Stripe sans session
 * Supabase. Ce use-case lui répond sans authentification, en ne révélant que
 * le strict nécessaire.
 */
describe('GetCheckoutSessionStatusUseCase', () => {
  const SESSION = 'cs_test_a1B2c3D4e5F6g7H8i9J0';

  it('renvoie payé, crédits, pack, montant et email masqué', async () => {
    const svc = createMockPaymentService({
      retrieveSession: vi.fn().mockResolvedValue(success({
        id: SESSION,
        paymentStatus: 'paid',
        customerEmail: 'gabriel@example.com',
        metadata: { type: 'guest_credits_purchase', credits: '10', packId: 'pack_10' },
        amountTotal: 792,
      })),
    });
    const res = await new GetCheckoutSessionStatusUseCase(svc).execute(SESSION);
    expect(res.success).toBe(true);
    if (!res.success) return;
    expect(res.data).toEqual({
      paid: true,
      credits: 10,
      packId: 'pack_10',
      emailMasked: 'ga*****@example.com',
      amount: 7.92,
    });
  });

  it('ne révèle jamais l’email en clair', async () => {
    const svc = createMockPaymentService();
    const res = await new GetCheckoutSessionStatusUseCase(svc).execute(SESSION);
    expect(res.success).toBe(true);
    if (!res.success) return;
    expect(JSON.stringify(res.data)).not.toContain('test@example.com');
  });

  it('refuse un identifiant qui ne ressemble pas à une session Stripe', async () => {
    const svc = createMockPaymentService();
    for (const bad of ['', 'abc', 'cs_', 'cs_live_', "cs_test_x'; DROP TABLE", 'pi_123456789012']) {
      const res = await new GetCheckoutSessionStatusUseCase(svc).execute(bad);
      expect(res.success).toBe(false);
      if (!res.success) expect(res.error.name).toBe('ValidationError');
    }
    expect(svc.retrieveSession).not.toHaveBeenCalled();
  });

  it('signale un paiement non encaissé comme non payé', async () => {
    const svc = createMockPaymentService({
      retrieveSession: vi.fn().mockResolvedValue(success({
        id: SESSION,
        paymentStatus: 'unpaid',
        customerEmail: '',
        metadata: {},
      })),
    });
    const res = await new GetCheckoutSessionStatusUseCase(svc).execute(SESSION);
    expect(res.success).toBe(true);
    if (!res.success) return;
    expect(res.data.paid).toBe(false);
    expect(res.data.credits).toBeNull();
    expect(res.data.emailMasked).toBeNull();
  });

  it('échoue proprement si Stripe ne connaît pas la session', async () => {
    const svc = createMockPaymentService({
      retrieveSession: vi.fn().mockResolvedValue(failure(new Error('No such session'))),
    });
    const res = await new GetCheckoutSessionStatusUseCase(svc).execute(SESSION);
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error.name).toBe('PaymentError');
  });
});

describe('maskEmail', () => {
  it('garde deux lettres et le domaine', () => {
    expect(maskEmail('gabriel@gmail.com')).toBe('ga*****@gmail.com');
  });
  it('masque au moins trois caractères même pour un local court', () => {
    expect(maskEmail('ab@x.fr')).toBe('ab***@x.fr');
    expect(maskEmail('a@x.fr')).toBe('a***@x.fr');
  });
  it('renvoie null sans arobase', () => {
    expect(maskEmail('pas-un-email')).toBeNull();
  });
});
