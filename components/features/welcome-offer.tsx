'use client';

import { Link } from '@/i18n/navigation';
import { Check, Sparkles, ArrowRight, Gift } from 'lucide-react';

/**
 * Code du coupon Stripe de bienvenue. Vide par défaut → aucune réduction affichée
 * (offre = valeur gratuite réelle uniquement, jamais de fausse promo). À activer
 * via NEXT_PUBLIC_WELCOME_COUPON = même id que STRIPE_COUPON_20_PERCENT.
 */
const WELCOME_COUPON = (process.env.NEXT_PUBLIC_WELCOME_COUPON || '').trim();

interface WelcomeOfferProps {
  className?: string;
}

/**
 * Carte « offre de bienvenue » HONNÊTE, partagée par les outils gratuits
 * (LeadMagnet, quiz). Affiche toujours la valeur gratuite réelle (essai sans
 * inscription + 3 crédits offerts). La réduction -20 % n'apparaît QUE si un vrai
 * coupon Stripe est configuré.
 */
export function WelcomeOffer({ className = '' }: WelcomeOfferProps) {
  const pricingHref = WELCOME_COUPON ? `/pricing?coupon=${WELCOME_COUPON}` : '/pricing';
  return (
    <div
      className={`rounded-[24px] border border-[var(--gold-line)] bg-[var(--stone-900)] p-6 text-center sm:p-8 ${className}`}
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--gold-line)] bg-[rgba(200,162,77,0.12)]">
        <Gift className="h-7 w-7 text-[var(--gold)]" aria-hidden="true" />
      </div>
      <h3 className="prestige-display text-[24px] font-semibold tracking-[-0.02em] text-[var(--ivory)]">
        Votre offre de bienvenue
      </h3>
      <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-[var(--mist)]">
        Passez de l&apos;idée au rendu. Testez sur votre propre photo, sans inscription, puis gardez{' '}
        <span className="text-[var(--gold)]">3 crédits offerts</span> à la création du compte.
        {WELCOME_COUPON && (
          <> Et <span className="text-[var(--gold)]">-20 % sur votre premier pack</span>, appliqué au paiement.</>
        )}
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/essai"
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-[var(--gold)] px-7 py-3.5 text-[15px] font-semibold text-[#0c0a09] transition-colors hover:bg-[#d4b15f]"
        >
          <Sparkles className="h-4 w-4" />
          Tester sur ma photo
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link
          href={pricingHref}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--gold-line)] px-7 py-3.5 text-[15px] font-medium text-[var(--ivory)] transition-colors hover:bg-[rgba(250,248,244,0.06)]"
        >
          {WELCOME_COUPON ? 'Profiter de mon -20 %' : 'Voir les tarifs'}
        </Link>
      </div>
      <p className="mt-4 text-[12px] text-[var(--mist)]">
        <Check className="mr-1 inline h-3.5 w-3.5 text-emerald-400" />
        Sans carte bancaire pour l&apos;essai. Désabonnement en un clic.
      </p>
    </div>
  );
}
