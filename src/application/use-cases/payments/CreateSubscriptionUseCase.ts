import { Result, success, failure } from '@/src/shared/types/Result';
import { IPaymentService } from '@/src/domain/ports/services/IPaymentService';
import { ILoggerService } from '@/src/domain/ports/services/ILoggerService';

export type SubscriptionPlanId = 'sub_essentiel' | 'sub_pro' | 'sub_business';
export type SubscriptionInterval = 'monthly' | 'annual';

export interface CreateSubscriptionInput {
  planId: SubscriptionPlanId;
  interval: SubscriptionInterval;
  /** Toujours issu de la session (jamais du body). */
  userId: string;
  email: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateSubscriptionOutput {
  checkoutUrl: string;
  sessionId: string;
  planId: SubscriptionPlanId;
  interval: SubscriptionInterval;
  creditsPerMonth: number;
}

/** Erreur de config plan/prix → la route doit répondre 400 (préserve le code d'origine). */
export class InvalidSubscriptionPlanError extends Error {
  readonly code = 'INVALID_SUBSCRIPTION_PLAN';
}

const PLAN_CONFIG: Record<
  SubscriptionPlanId,
  { monthlyEnv: string; annualEnv: string; creditsPerMonth: number; planName: string }
> = {
  sub_essentiel: { monthlyEnv: 'STRIPE_PRICE_SUB_ESSENTIEL_MONTHLY', annualEnv: 'STRIPE_PRICE_SUB_ESSENTIEL_ANNUAL', creditsPerMonth: 30, planName: 'Essentiel' },
  sub_pro: { monthlyEnv: 'STRIPE_PRICE_SUB_PRO_MONTHLY', annualEnv: 'STRIPE_PRICE_SUB_PRO_ANNUAL', creditsPerMonth: 80, planName: 'Pro' },
  sub_business: { monthlyEnv: 'STRIPE_PRICE_SUB_BUSINESS_MONTHLY', annualEnv: 'STRIPE_PRICE_SUB_BUSINESS_ANNUAL', creditsPerMonth: 200, planName: 'Business' },
};

/**
 * Use Case : créer une session Stripe d'abonnement.
 *
 * Résout le price ID (env) selon plan/intervalle, construit les metadata (identiques
 * à la route historique : session.metadata inclut type:'subscription', subscription_data.metadata
 * sans type), puis délègue à IPaymentService (plus de `new Stripe()` dans le transport).
 */
export class CreateSubscriptionUseCase {
  constructor(
    private readonly paymentService: IPaymentService,
    private readonly logger: ILoggerService,
  ) {}

  async execute(input: CreateSubscriptionInput): Promise<Result<CreateSubscriptionOutput>> {
    const cfg = PLAN_CONFIG[input.planId];
    if (!cfg) {
      return failure(new InvalidSubscriptionPlanError('Plan invalide'));
    }

    const priceId = process.env[input.interval === 'annual' ? cfg.annualEnv : cfg.monthlyEnv];
    if (!priceId) {
      this.logger.error('Subscription price ID manquant', new Error(`${input.planId}/${input.interval}`));
      return failure(new InvalidSubscriptionPlanError('Plan ou intervalle invalide. Vérifiez les variables STRIPE_PRICE_SUB_*.'));
    }

    const baseMeta = {
      userId: input.userId,
      planId: input.planId,
      interval: input.interval,
      creditsPerMonth: String(cfg.creditsPerMonth),
    };

    const result = await this.paymentService.createSubscriptionSession({
      userId: input.userId,
      userEmail: input.email,
      priceId,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      metadata: { ...baseMeta, type: 'subscription' },
      subscriptionMetadata: baseMeta,
    });

    if (!result.success) {
      this.logger.error('Subscription session creation failed', result.error as Error);
      return failure(result.error);
    }

    return success({
      checkoutUrl: result.data.url,
      sessionId: result.data.sessionId,
      planId: input.planId,
      interval: input.interval,
      creditsPerMonth: cfg.creditsPerMonth,
    });
  }
}
