'use client';

import { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { Link } from '@/i18n/navigation';
import { useLocale, useMessages, useTranslations } from 'next-intl';
import type { LucideIcon } from 'lucide-react';
import {
  Check,
  Sparkles,
  Clock,
  CreditCard,
  Image,
  Download,
  Palette,
  Building2,
  HelpCircle,
  ChevronDown,
  Heart,
  Shield,
  Zap,
  Users,
  TrendingUp,
  ArrowRight,
  Repeat,
  Crown,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { usePurchaseCredits } from '@/src/presentation/hooks/usePurchaseCredits';
import { createSubscriptionSession } from '@/src/presentation/api/client';
import { SocialProofToast } from '@/components/features/social-proof-toast';
import { LeadCaptureLazy } from '@/components/features/lead-capture-lazy';
import { CreditPackId, SubscriptionPlanId, BillingInterval } from '@/src/presentation/types';

// v2 - force rebuild (cache Vercel stale après suppression footer dupliqué)

type PricingMode = 'credits' | 'subscription';

/** Icônes FAQ — ordre identique à `Pricing.faq` dans les fichiers de messages */
const FAQ_ICONS_ORDER: LucideIcon[] = [
  CreditCard,
  Clock,
  Image,
  Building2,
  Palette,
  Download,
  CreditCard,
  HelpCircle,
  Repeat,
  Crown,
  Sparkles,
  Image,
];

const TRUST_ICON_MAP: Record<string, LucideIcon> = {
  stripe: Shield,
  credits: Clock,
  refund: ArrowRight,
  speed: Zap,
};

export default function PricingPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fbfbfd]" />}>
      <PricingPage />
    </Suspense>
  );
}

function PricingPage() {
  const P = useMessages().Pricing as Record<string, unknown>;
  const t = useTranslations('Pricing');
  const PRICING_PLANS = P.creditPacks as PricingPlan[];
  const SUBSCRIPTION_PLANS = P.subscriptions as SubscriptionPlan[];
  const USE_CASE_HIGHLIGHTS = P.useCases as {
    icon: string;
    profile: string;
    text: string;
    pack: string;
  }[];
  const FAQ_ITEMS = useMemo(
    () =>
      (P.faq as Array<{ category: string; question: string; answer: string }>).map((item, index) => ({
        ...item,
        icon: FAQ_ICONS_ORDER[index] ?? HelpCircle,
      })),
    [P],
  );

  const howItWorksSteps = P.howItWorksSteps as Array<{
    step: string;
    emoji: string;
    title: string;
    desc: string;
  }>;
  const compareRows = P.compareRows as Array<{ label: string; us: string; them: string }>;
  const trustBadges = P.trustBadges as Array<{ key: string; label: string }>;
  const creditPacksBullets = P.creditPacksBullets as string[];
  const subscriptionBulletList = P.subscriptionBullets as string[];

  const locale = useLocale();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const couponFromUrl = searchParams?.get('coupon') || undefined;
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [pricingMode, setPricingMode] = useState<PricingMode>('credits');
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);
  
  const { purchase, isLoading, error } = usePurchaseCredits();



  const handleSelectPlan = async (planId: CreditPackId) => {
    if (!user) {
      router.push('/login');
      return;
    }

    const checkoutUrl = await purchase({
      packId: planId,
      successUrl: `${window.location.origin}/${locale}/dashboard?payment=success`,
      cancelUrl: `${window.location.origin}/${locale}/pricing?payment=cancelled`,
      couponId: couponFromUrl,
    });

    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    }
  };

  const handleSelectSubscription = useCallback(async (planId: SubscriptionPlanId) => {
    if (!user || !user.email) {
      router.push('/login');
      return;
    }

    setSubLoading(true);
    setSubError(null);

    try {
      const response = await createSubscriptionSession({
        planId,
        interval: billingInterval,
        successUrl: `${window.location.origin}/${locale}/dashboard?subscription=success`,
        cancelUrl: `${window.location.origin}/${locale}/pricing?subscription=cancelled`,
      });

      if (response.checkoutUrl) {
        window.location.href = response.checkoutUrl;
      }
    } catch (err) {
      setSubError(err instanceof Error ? err.message : t('subscriptionError'));
    } finally {
      setSubLoading(false);
    }
  }, [user, router, billingInterval, locale, t]);

  const displayError = error || subError;
  const isAnyLoading = isLoading || subLoading;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8F5] via-[#FFFBF9] to-white">
      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 text-center relative overflow-hidden">
        <div className="absolute top-10 left-10 w-20 h-20 bg-[#FFE4D9] rounded-full blur-3xl opacity-60 hidden sm:block" />
        <div className="absolute top-20 right-16 w-16 h-16 bg-[#E8F4E5] rounded-full blur-2xl opacity-50 hidden sm:block" />
        
        <div className="inline-flex items-center gap-2 bg-[#FFF0EB] text-[#D4603C] px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Heart className="w-4 h-4" />
          {t('heroBadge')}
        </div>
        
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-semibold tracking-[-0.025em] text-[#2D2D2D] leading-[1.1] sm:leading-[1.07] mb-4">
          {t('heroTitleLine1')}<br />
          <span className="bg-gradient-to-r from-[#E07B54] to-[#D4603C] bg-clip-text text-transparent">
            {t('heroTitleLine2')}
          </span>
        </h1>
        <p className="text-base sm:text-lg md:text-[21px] text-[#6B6B6B] max-w-2xl mx-auto mb-8 whitespace-pre-line">
          {t('heroSubtitle')}
        </p>

        {/* Toggle Crédits / Abonnements */}
        <div className="flex items-center justify-center mb-8">
          <div className="inline-flex items-center bg-white rounded-full p-1.5 border border-[#F0E8E4] shadow-md relative">
            <button
              onClick={() => setPricingMode('credits')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                pricingMode === 'credits'
                  ? 'bg-gradient-to-r from-[#E07B54] to-[#D4603C] text-white shadow-md'
                  : 'text-[#6B6B6B] hover:text-[#2D2D2D]'
              }`}
            >
              <CreditCard className="w-4 h-4 hidden sm:block" />
              {t('toggleCredits')}
            </button>
            <button
              onClick={() => setPricingMode('subscription')}
              className={`flex items-center gap-2 px-3 sm:px-5 py-2.5 rounded-full text-sm font-medium transition-all relative ${
                pricingMode === 'subscription'
                  ? 'bg-gradient-to-r from-[#E07B54] to-[#D4603C] text-white shadow-md'
                  : 'text-[#6B6B6B] hover:text-[#2D2D2D]'
              }`}
            >
              <Repeat className="w-4 h-4 hidden sm:block" />
              {t('toggleSubscriptions')}
              <span className="absolute -top-2.5 -right-2 bg-[#4CAF50] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                {t('newBadge')}
              </span>
            </button>
          </div>
        </div>

        {/* Annual/Monthly toggle (only for subscriptions) */}
        {pricingMode === 'subscription' && (
          <div className="flex flex-col items-center gap-3 mb-4">
            <div className="flex items-center gap-3">
              <span className={`text-sm ${billingInterval === 'monthly' ? 'text-[#2D2D2D] font-medium' : 'text-[#6B6B6B]'}`}>
                {t('monthly')}
              </span>
              <button
                onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'annual' : 'monthly')}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  billingInterval === 'annual' ? 'bg-[#E07B54]' : 'bg-[#D1D5DB]'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    billingInterval === 'annual' ? 'translate-x-7' : ''
                  }`}
                />
              </button>
              <span className={`text-sm ${billingInterval === 'annual' ? 'text-[#2D2D2D] font-medium' : 'text-[#6B6B6B]'}`}>
                {t('annual')}
              </span>
              {billingInterval === 'annual' && (
                <span className="bg-[#E8F4E5] text-[#2E7D32] text-xs font-bold px-2.5 py-1 rounded-full">
                  {t('annualDiscount')}
                </span>
              )}
            </div>

            {/* Savings highlight banner */}
            <div className="bg-gradient-to-r from-[#E8F4E5] to-[#D5EDD0] rounded-full px-4 py-1.5 text-sm">
              <span className="text-[#2E7D32] font-medium">
                {billingInterval === 'annual' ? t('annualSavingsBanner') : t('monthlySavingsBanner')}
              </span>
            </div>
          </div>
        )}

        {/* Social proof — faits vérifiables uniquement */}
        <div className="flex flex-wrap justify-center gap-8 sm:gap-12 mt-6">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-[#2D2D2D]">{t('socialProof20')}</div>
            <div className="text-sm text-[#6B6B6B]">{t('statStyles')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-[#2D2D2D]">{t('socialProof8')}</div>
            <div className="text-sm text-[#6B6B6B]">{t('statRooms')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-[#2D2D2D]">{t('socialProof30')}</div>
            <div className="text-sm text-[#6B6B6B]">{t('statSpeed')}</div>
          </div>
        </div>
      </div>

      {/* Error message */}
      {displayError && (
        <div className="max-w-md mx-auto px-4 mb-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm text-center">
            {displayError}
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        {pricingMode === 'credits' ? (
          <>
            {/* Credit Packs - Desktop */}
            <div className="hidden md:grid md:grid-cols-3 gap-6">
              {PRICING_PLANS.map((plan) => (
                <PricingCard 
                  key={plan.id} 
                  plan={plan} 
                  onSelect={() => handleSelectPlan(plan.id)}
                  isLoading={isAnyLoading}
                />
              ))}
            </div>
            {/* Credit Packs - Mobile */}
            <div className="md:hidden">
              <MobileCarousel 
                plans={PRICING_PLANS} 
                onSelect={handleSelectPlan}
                isLoading={isAnyLoading}
              />
            </div>

            {/* Upsell banner credits → abonnement */}
            <div className="mt-8 bg-gradient-to-r from-[#FFF8F5] to-[#FFF0EB] rounded-2xl p-6 border border-[#F5D5C8] text-center">
              <p className="text-[#2D2D2D] font-medium mb-1 whitespace-pre-line">
                {t('upsellTitle')}
              </p>
              <p className="text-sm text-[#6B6B6B] mb-3">
                {t('upsellSubtitle')}
              </p>
              <button 
                onClick={() => setPricingMode('subscription')}
                className="inline-flex items-center gap-2 text-[#E07B54] font-semibold text-sm hover:underline"
              >
                {t('upsellCta')} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Subscription Plans - Desktop */}
            <div className="hidden md:grid md:grid-cols-3 gap-6">
              {SUBSCRIPTION_PLANS.map((plan) => (
                <SubscriptionCard
                  key={plan.id}
                  plan={plan}
                  interval={billingInterval}
                  onSelect={() => handleSelectSubscription(plan.id)}
                  isLoading={isAnyLoading}
                />
              ))}
            </div>
            {/* Subscription Plans - Mobile */}
            <div className="md:hidden">
              <MobileSubscriptionCarousel
                plans={SUBSCRIPTION_PLANS}
                interval={billingInterval}
                onSelect={handleSelectSubscription}
                isLoading={isAnyLoading}
              />
            </div>
          </>
        )}

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mt-10">
          {trustBadges.map((row) => {
            const Icon = TRUST_ICON_MAP[row.key] ?? Shield;
            return (
              <div key={row.key} className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                <div className="w-5 h-5 rounded-full bg-[#E8F4E5] flex items-center justify-center">
                  <Icon className="w-3 h-3 text-[#4CAF50]" />
                </div>
                {row.label}
              </div>
            );
          })}
        </div>

        {/* Payment logos */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-6 opacity-50">
          <span className="text-xs text-[#6B6B6B]">{t('paymentBy')}</span>
          <span className="text-sm font-semibold text-[#635BFF]">stripe</span>
          <span className="text-xs text-[#6B6B6B]">•</span>
          <span className="text-xs text-[#6B6B6B]">Visa</span>
          <span className="text-xs text-[#6B6B6B]">•</span>
          <span className="text-xs text-[#6B6B6B]">Mastercard</span>
          <span className="text-xs text-[#6B6B6B]">•</span>
          <span className="text-xs text-[#6B6B6B]">Apple Pay</span>
        </div>
      </div>

      {/* How it works - Convert doubters */}
      <div className="bg-white py-16 sm:py-20 border-t border-[#F5E6E0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#FFF0EB] text-[#D4603C] px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Zap className="w-4 h-4" />
              {t('howItWorksBadge')}
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-[36px] font-semibold text-[#2D2D2D] mb-3">
              {t('howItWorksTitle')}
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {howItWorksSteps.map((item) => (
              <div key={item.step} className="text-center">
                <div className="text-4xl mb-4">{item.emoji}</div>
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#E07B54] text-white text-sm font-bold mb-3">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-[#2D2D2D] mb-2">{item.title}</h3>
                <p className="text-sm text-[#6B6B6B]">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/essai"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#E07B54] to-[#D4603C] text-white px-8 py-3.5 rounded-full text-base font-medium hover:shadow-lg hover:shadow-[#E07B54]/30 transition-all active:scale-95"
            >
              {t('tryNow')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Cas d'usage — profils réels sans faux témoignages */}
      <div className="bg-gradient-to-b from-[#FFF8F5] to-white py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#FFF0EB] text-[#D4603C] px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Users className="w-4 h-4" />
              {t('whoForBadge')}
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-[36px] font-semibold text-[#2D2D2D]">
              {t('whoForTitle')}
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {USE_CASE_HIGHLIGHTS.map((useCase, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 border border-[#F0E8E4] shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{useCase.icon}</div>
                <h3 className="font-semibold text-[#2D2D2D] mb-2">{useCase.profile}</h3>
                <p className="text-[#2D2D2D] text-sm leading-relaxed mb-4">
                  {useCase.text}
                </p>
                <span className="text-xs bg-[#FFF0EB] text-[#D4603C] px-2 py-1 rounded-full">
                  {t('packLabel', { name: useCase.pack })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison table - Remove objections */}
      <div className="bg-white py-16 sm:py-20 border-t border-[#F5E6E0]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-[#FFF0EB] text-[#D4603C] px-4 py-2 rounded-full text-sm font-medium mb-4">
              <TrendingUp className="w-4 h-4" />
              {t('compareBadge')}
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#2D2D2D] mb-2">
              {t('compareTitle')}
            </h2>
          </div>
          <div className="rounded-2xl border border-[#F0E8E4] overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="bg-[#FFF8F5]">
                  <th className="text-left p-4 font-medium text-[#6B6B6B]"></th>
                  <th className="p-4 font-semibold text-[#E07B54]">{t('compareColUs')}</th>
                  <th className="p-4 font-medium text-[#6B6B6B]">{t('compareColThem')}</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FFFBF9]'}>
                    <td className="p-4 text-[#2D2D2D]">{row.label}</td>
                    <td className="p-4 text-center font-medium text-[#2D2D2D]">
                      <span className="inline-flex items-center gap-1">
                        <Check className="w-4 h-4 text-[#4CAF50]" />
                        {row.us}
                      </span>
                    </td>
                    <td className="p-4 text-center text-[#6B6B6B]">{row.them}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </div>

      {/* Why Subscribe - Conversion section */}
      <div className="bg-gradient-to-b from-white to-[#FFF8F5] py-16 sm:py-20 border-t border-[#F5E6E0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-[#FFF0EB] text-[#D4603C] px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Crown className="w-4 h-4" />
              {t('creditsVsSubBadge')}
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#2D2D2D] mb-3">
              {t('creditsVsSubTitle')}
            </h2>
            <p className="text-[#6B6B6B] max-w-xl mx-auto">
              {t('creditsVsSubSubtitle')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Credit packs */}
            <div className="rounded-2xl border border-[#F0E8E4] bg-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#FFF0EB] flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-[#E07B54]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#2D2D2D]">{t('creditPacksCardTitle')}</h3>
                  <p className="text-xs text-[#6B6B6B]">{t('creditPacksCardSubtitle')}</p>
                </div>
              </div>
              <ul className="space-y-2.5 text-sm">
                {creditPacksBullets.map((line) => (
                  <li key={line} className="flex items-center gap-2 text-[#2D2D2D]">
                    <Check className="w-4 h-4 text-[#4CAF50]" /> {line}
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-[#F0E8E4]">
                <p className="text-sm text-[#6B6B6B]">{t('fromLabel')}</p>
                <p className="text-lg font-bold text-[#2D2D2D]">
                  0.70€ <span className="text-sm font-normal text-[#6B6B6B]">{t('perImage')}</span>
                </p>
              </div>
            </div>

            {/* Subscription - highlighted */}
            <div className="rounded-2xl border-2 border-[#E07B54] bg-gradient-to-b from-white to-[#FFF8F5] p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E07B54] text-white text-[11px] font-bold px-3 py-1 rounded-full">
                {t('bestValue')}
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#E07B54] flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#2D2D2D]">{t('subscriptionCardTitle')}</h3>
                  <p className="text-xs text-[#6B6B6B]">{t('subscriptionCardSubtitle')}</p>
                </div>
              </div>
              <ul className="space-y-2.5 text-sm">
                {subscriptionBulletList.map((line) => (
                  <li key={line} className="flex items-center gap-2 text-[#2D2D2D]">
                    <Check className="w-4 h-4 text-[#4CAF50]" /> {line}
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-[#F0E8E4]">
                <p className="text-sm text-[#6B6B6B]">{t('fromLabel')}</p>
                <p className="text-lg font-bold text-[#E07B54]">
                  0.32€ <span className="text-sm font-normal text-[#6B6B6B]">{t('perImage')}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-[#FFFBF9] py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#FFF0EB] text-[#D4603C] px-4 py-2 rounded-full text-sm font-medium mb-4">
              <HelpCircle className="w-4 h-4" />
              {t('faqBadge')}
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-[36px] font-semibold text-[#2D2D2D] mb-3">
              {t('faqTitle')}
            </h2>
            <p className="text-[#6B6B6B]">
              {t('faqSubtitle')}
            </p>
          </div>
          
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, index) => (
              <div 
                key={index}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  openFaq === index 
                    ? 'bg-[#FFF8F5] border-[#F5D5C8] shadow-sm' 
                    : 'bg-white border-[#F0E8E4] hover:border-[#E8D5CC]'
                }`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      openFaq === index ? 'bg-[#E07B54] text-white' : 'bg-[#FFF0EB] text-[#E07B54]'
                    }`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-[#2D2D2D] pr-4">{item.question}</span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-[#6B6B6B] transition-transform flex-shrink-0 ${
                    openFaq === index ? 'rotate-180' : ''
                  }`} />
                </button>
                
                {openFaq === index && (
                  <div className="px-5 pb-5 pt-0">
                    <div className="pl-14 text-[#6B6B6B] leading-relaxed">
                      {item.answer}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-10 text-center p-6 bg-gradient-to-r from-[#FFF8F5] to-[#FFF0EB] rounded-2xl border border-[#F5E6E0]">
            <p className="text-[#2D2D2D] mb-2">
              {t('faqCtaTitle')}
            </p>
            <a 
              href="mailto:contact@instadeco.app" 
              className="inline-flex items-center gap-2 text-[#E07B54] font-medium hover:underline"
            >
              {t('faqCtaLink')}
            </a>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-r from-[#E07B54] to-[#D4603C] py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-4">
            {t('finalCtaTitle')}
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
            {t('finalCtaSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/essai"
              className="inline-flex items-center gap-2 bg-white text-[#D4603C] px-8 py-3.5 rounded-full text-base font-semibold hover:bg-white/90 transition-all active:scale-95 shadow-lg"
            >
              {t('finalCtaButton')}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <span className="text-white/60 text-sm">{t('finalCtaNote')}</span>
          </div>
        </div>
      </div>
      <SocialProofToast initialDelay={6000} interval={20000} maxNotifications={8} />
      {/* Exit-intent popup pour capturer les emails avant départ */}
      <LeadCaptureLazy variant="popup" delay={20000} />
    </div>
  );
}

// Types
interface PricingPlan {
  id: CreditPackId;
  name: string;
  credits: number;
  price: number;
  pricePerCredit: number;
  popular: boolean;
  emoji: string;
  description: string;
  savings: number | null;
  cta: string;
}

function PricingCard({ 
  plan, 
  onSelect, 
  isLoading 
}: { 
  plan: PricingPlan; 
  onSelect: () => void;
  isLoading: boolean;
}) {
  const t = useTranslations('Pricing');
  const packFeaturesTpl = t.raw('packFeatures') as string[];
  const featureLines = packFeaturesTpl.map((tpl) => tpl.replace('{credits}', String(plan.credits)));

  return (
    <div
      className={`relative bg-white rounded-3xl p-6 md:p-8 transition-all hover:scale-[1.02] hover:shadow-xl ${
        plan.popular 
          ? 'ring-2 ring-[#E07B54] shadow-lg shadow-[#E07B54]/10' 
          : 'border border-[#F0E8E4] shadow-sm hover:border-[#E8D5CC]'
      }`}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#E07B54] to-[#D4603C] text-white text-[12px] font-medium px-4 py-1.5 rounded-full shadow-lg">
          {t('popularBadge')}
        </div>
      )}

      {plan.savings && (
        <div className="absolute -top-2 -right-2 bg-[#4CAF50] text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md">
          -{plan.savings}%
        </div>
      )}

      <div className="text-center mb-6">
        <div className="text-4xl mb-3">{plan.emoji}</div>
        <h3 className="text-2xl font-semibold text-[#2D2D2D] mb-1">
          {plan.name}
        </h3>
        <p className="text-sm text-[#6B6B6B]">{plan.description}</p>
      </div>

      <div className="text-center mb-6">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl md:text-5xl font-bold text-[#2D2D2D]">
            {plan.price}€
          </span>
        </div>
        <p className="text-[#6B6B6B] mt-1">
          {t('creditsPerImage', {
            credits: plan.credits,
            price: plan.pricePerCredit.toFixed(2),
          })}
        </p>
        {plan.savings && (
          <p className="text-xs text-[#4CAF50] font-medium mt-1">
            {t('savingsVsUnit', { amount: ((plan.credits * 1.0) - plan.price).toFixed(2) })}
          </p>
        )}
      </div>

      <ul className="space-y-3 mb-8">
        {featureLines.map((feature, i) => (
          <li key={i} className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-[#E8F4E5] flex items-center justify-center flex-shrink-0">
              <Check className="w-3 h-3 text-[#4CAF50]" />
            </div>
            <span className="text-sm text-[#2D2D2D]">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        disabled={isLoading}
        className={`w-full py-3.5 rounded-full text-base font-medium transition-all disabled:opacity-50 ${
          plan.popular
            ? 'bg-gradient-to-r from-[#E07B54] to-[#D4603C] text-white hover:shadow-lg hover:shadow-[#E07B54]/30 active:scale-95'
            : 'bg-[#2D2D2D] text-white hover:bg-[#3D3D3D] active:scale-95'
        }`}
      >
        {isLoading ? t('loading') : plan.cta}
      </button>
    </div>
  );
}

// Carrousel mobile
function MobileCarousel({ 
  plans, 
  onSelect,
  isLoading,
}: { 
  plans: PricingPlan[]; 
  onSelect: (id: CreditPackId) => void;
  isLoading: boolean;
}) {
  const t = useTranslations('Pricing');
  const [currentIndex, setCurrentIndex] = useState(1);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      setCurrentIndex((prev) => Math.min(plans.length - 1, prev + 1));
    }
    if (touchStart - touchEnd < -75) {
      setCurrentIndex((prev) => Math.max(0, prev - 1));
    }
  };

  return (
    <div className="relative">
      <div
        className="overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-300 ease-out pt-6 pb-2"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {plans.map((plan) => (
            <div key={plan.id} className="w-full flex-shrink-0 px-4">
              <PricingCard 
                plan={plan} 
                onSelect={() => onSelect(plan.id)}
                isLoading={isLoading}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {plans.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'w-8 bg-[#E07B54]'
                : 'w-2 bg-[#E8D5CC] hover:bg-[#D4A599]'
            }`}
          />
        ))}
      </div>
      
      <p className="text-center text-xs text-[#6B6B6B] mt-3">
        {t('swipeHint')}
      </p>
    </div>
  );
}

// Subscription Card
interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  creditsPerMonth: number;
  monthlyPrice: number;
  annualPrice: number;
  annualTotal: number;
  popular: boolean;
  emoji: string;
  description: string;
  pricePerCredit: { monthly: number; annual: number };
  features: string[];
  cta: string;
}

function SubscriptionCard({
  plan,
  interval,
  onSelect,
  isLoading,
}: {
  plan: SubscriptionPlan;
  interval: BillingInterval;
  onSelect: () => void;
  isLoading: boolean;
}) {
  const t = useTranslations('Pricing');
  const price = interval === 'annual' ? plan.annualPrice : plan.monthlyPrice;
  const pricePerCredit = plan.pricePerCredit[interval];
  // Calcul de l'économie vs pack crédit le moins cher (0.70€/image)
  const savingsVsCredits = Math.round((1 - pricePerCredit / 0.70) * 100);

  return (
    <div
      className={`relative bg-white rounded-3xl p-6 md:p-8 transition-all hover:scale-[1.02] hover:shadow-xl ${
        plan.popular
          ? 'ring-2 ring-[#E07B54] shadow-lg shadow-[#E07B54]/10'
          : 'border border-[#F0E8E4] shadow-sm hover:border-[#E8D5CC]'
      }`}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#E07B54] to-[#D4603C] text-white text-[12px] font-medium px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1">
          <Crown className="w-3 h-3" />
          {t('subRecommended')}
        </div>
      )}

      {/* Savings badge vs credits */}
      <div className="absolute -top-2 -right-2 bg-[#4CAF50] text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md">
        {t('subSavingsVsCredits', { pct: savingsVsCredits })}
      </div>

      <div className="text-center mb-6">
        <div className="text-4xl mb-3">{plan.emoji}</div>
        <h3 className="text-2xl font-semibold text-[#2D2D2D] mb-1">{plan.name}</h3>
        <p className="text-sm text-[#6B6B6B]">{plan.description}</p>
      </div>

      <div className="text-center mb-6">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl md:text-5xl font-bold text-[#2D2D2D]">{price}€</span>
          <span className="text-[#6B6B6B]">{t('perMonth')}</span>
        </div>
        <p className="text-[#6B6B6B] mt-1">
          {t('creditsPerMonthShort', {
            credits: plan.creditsPerMonth,
            price: pricePerCredit.toFixed(2),
          })}
        </p>
        {interval === 'annual' && (
          <p className="text-xs text-[#4CAF50] font-medium mt-1">
            {t('billedAnnually', { total: plan.annualTotal, full: plan.monthlyPrice * 12 })}
          </p>
        )}
      </div>

      <ul className="space-y-3 mb-8">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-[#E8F4E5] flex items-center justify-center flex-shrink-0">
              <Check className="w-3 h-3 text-[#4CAF50]" />
            </div>
            <span className="text-sm text-[#2D2D2D]">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        disabled={isLoading}
        className={`w-full py-3.5 rounded-full text-base font-medium transition-all disabled:opacity-50 ${
          plan.popular
            ? 'bg-gradient-to-r from-[#E07B54] to-[#D4603C] text-white hover:shadow-lg hover:shadow-[#E07B54]/30 active:scale-95'
            : 'bg-[#2D2D2D] text-white hover:bg-[#3D3D3D] active:scale-95'
        }`}
      >
        {isLoading ? t('loading') : plan.cta}
      </button>

      <p className="text-center text-xs text-[#6B6B6B] mt-3">
        {t('subFooter')}
      </p>
    </div>
  );
}

// Carrousel mobile - Subscriptions
function MobileSubscriptionCarousel({
  plans,
  interval,
  onSelect,
  isLoading,
}: {
  plans: SubscriptionPlan[];
  interval: BillingInterval;
  onSelect: (id: SubscriptionPlanId) => void;
  isLoading: boolean;
}) {
  const t = useTranslations('Pricing');
  const [currentIndex, setCurrentIndex] = useState(1);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      setCurrentIndex((prev) => Math.min(plans.length - 1, prev + 1));
    }
    if (touchStart - touchEnd < -75) {
      setCurrentIndex((prev) => Math.max(0, prev - 1));
    }
  };

  return (
    <div className="relative">
      <div
        className="overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-300 ease-out pt-6 pb-2"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {plans.map((plan) => (
            <div key={plan.id} className="w-full flex-shrink-0 px-4">
              <SubscriptionCard
                plan={plan}
                interval={interval}
                onSelect={() => onSelect(plan.id)}
                isLoading={isLoading}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {plans.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'w-8 bg-[#E07B54]'
                : 'w-2 bg-[#E8D5CC] hover:bg-[#D4A599]'
            }`}
          />
        ))}
      </div>

      <p className="text-center text-xs text-[#6B6B6B] mt-3">
        {t('swipeHint')}
      </p>
    </div>
  );
}
