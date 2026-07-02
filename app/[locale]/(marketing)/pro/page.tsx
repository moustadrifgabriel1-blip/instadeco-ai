'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from '@/i18n/navigation';
import { createSubscriptionSession } from '@/src/presentation/api/client';
import { trackBeginCheckout } from '@/lib/analytics/gtag';
import { fbTrackInitiateCheckout, fbTrackViewContent } from '@/lib/analytics/fb-pixel';
import { PrestigeCompare } from '@/components/prestige/prestige-compare';
import { PRO_FAQ, REAL_RENDERS } from './pro-data';
import {
  Building2, Camera, Check, ArrowRight,
  Shield, ChevronDown, Home,
  Users, BarChart3, Sparkles, Download, Palette, Award, Loader2,
  Building, type LucideIcon,
} from 'lucide-react';

// ============================================
// DONNÉES : offre immobilier (Solo / Pro illimité / Agence)
// ============================================

type PlanId = 'solo' | 'pro' | 'agence';

interface ProPlan {
  id: PlanId;
  name: string;
  tagline: string;
  monthly: number;       // €/mois en facturation mensuelle
  annual: number;        // €/mois équivalent en facturation annuelle (-30%)
  annualBilled: string;  // libellé "Facturé X€/an"
  annualTotal: number;   // montant réellement facturé sur l'année (€), pour le tracking
  features: string[];
  popular: boolean;
}

const PRO_PLANS: ProPlan[] = [
  {
    id: 'solo',
    name: 'Solo',
    tagline: 'Pour se lancer',
    monthly: 19,
    annual: 13.3,
    annualBilled: 'Facturé 160€/an',
    annualTotal: 160,
    features: [
      '40 images / mois',
      '1 utilisateur',
      'Qualité HD',
      'Tous les styles',
      'Licence commerciale incluse',
    ],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Le plus choisi',
    monthly: 49,
    annual: 34,
    annualBilled: 'Facturé 408€/an',
    annualTotal: 408,
    features: [
      'Générations illimitées (fair-use)',
      '1 utilisateur',
      'Qualité HD',
      'Tous les styles',
      'Licence commerciale incluse',
      'Support prioritaire',
      'Sans engagement, annulez en 1 clic',
    ],
    popular: true,
  },
  {
    id: 'agence',
    name: 'Agence',
    tagline: 'Pour les équipes',
    monthly: 99,
    annual: 69,
    annualBilled: 'Facturé 828€/an',
    annualTotal: 828,
    features: [
      'Générations illimitées',
      "Jusqu'à 3 sièges inclus",
      'Facturation centralisée',
      'Support dédié',
      'API (bientôt)',
    ],
    popular: false,
  },
];

function formatPrice(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ',');
}

const PRO_USE_CASES: {
  profile: string;
  role: string;
  useCase: string;
  benefit: string;
  icon: LucideIcon;
}[] = [
  {
    profile: 'Agents immobiliers',
    role: 'Home staging virtuel',
    useCase: 'Meublez virtuellement vos biens vides (ou restylez une pièce occupée) pour aider les acquéreurs à se projeter. Un bien meublé se vend nettement plus vite.',
    benefit: 'Vendez plus vite',
    icon: Building2,
  },
  {
    profile: 'Home stagers',
    role: 'Validation rapide',
    useCase: 'Montrez un rendu IA à vos clients pour valider la direction déco avant de réaliser le staging physique. Réduisez les allers-retours.',
    benefit: "Moins d'allers-retours",
    icon: Palette,
  },
  {
    profile: 'Agences & promoteurs',
    role: "À l'échelle",
    useCase: 'Équipez vos équipes pour ajouter une version « meublée virtuellement » à chaque annonce. Illimité, résultat en ~30 secondes, facturation centralisée.',
    benefit: 'Illimité, multi-sièges',
    icon: Building,
  },
];

const ROI_COMPARISONS = [
  { label: 'Home staging physique', price: '2 000 - 5 000 €', time: '1-2 semaines', quality: 'Excellent mais limité à 1 style', icon: Home },
  { label: 'Photographe 3D', price: '500 - 1 500 €/bien', time: '3-5 jours', quality: 'Bon mais coûteux à l\'échelle', icon: Camera },
  { label: 'InstaDeco Pro', price: '49 €/mois illimité', time: '30 secondes', quality: 'Illimité, tous styles, HD', icon: Sparkles, highlight: true },
];

const USE_CASES = [
  {
    icon: Building2,
    title: 'Agents immobiliers',
    description: 'Meublez virtuellement vos biens vides. Aidez les acquéreurs à se projeter dans un espace aménagé, et vendez plus vite.',
    stat: 'Tous les styles, illimité',
  },
  {
    icon: Palette,
    title: 'Home stagers',
    description: 'Présentez plusieurs propositions en quelques minutes. Validez avec vos clients avant d\'intervenir physiquement.',
    stat: 'Proposition en ~30 secondes',
  },
  {
    icon: BarChart3,
    title: 'Promoteurs',
    description: 'Visualisez des logements neufs en plusieurs styles. Aidez vos acheteurs à se projeter sur plan.',
    stat: '8 types de pièces supportés',
  },
  {
    icon: Users,
    title: 'Architectes d\'intérieur',
    description: 'Montrez à vos clients un avant/après instantané pour valider la direction déco.',
    stat: 'Résultat en quelques secondes',
  },
];

// Rendus réels : déplacés vers ./pro-data (source unique partagée avec le schema
// ImageObject du layout, même logique que PRO_FAQ / PRO_PRICING).

// FAQ deplacee vers ./pro-data (source unique partagee avec le schema FAQPage du layout,
// pour garantir la parite entre la FAQ affichee et les donnees structurees).
const FAQ = PRO_FAQ;

// ============================================
// COMPOSANT PAGE
// ============================================

export default function ProPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const router = useRouter();
  const locale = useLocale();

  // Funnel : vue de la page Pro (GEO/retargeting agents).
  useEffect(() => {
    fbTrackViewContent('pro', 'pricing');
  }, []);

  const handleSubscribe = async (planId: PlanId) => {
    const plan = PRO_PLANS.find((p) => p.id === planId);
    // Valeur de conversion = montant réellement facturé (annuel = total sur l'année,
    // pas l'équivalent mensuel), pour ne pas sous-évaluer le ROAS Meta/GA.
    const value = plan ? (billingPeriod === 'monthly' ? plan.monthly : plan.annualTotal) : 0;

    // Funnel : début de checkout (mesure essai→Pro).
    trackBeginCheckout(planId, value);
    fbTrackInitiateCheckout(planId, value);

    // Non connecté → inscription, puis retour au checkout du plan choisi.
    if (!user || !user.email) {
      router.push(`/signup?plan=${planId}&redirect=checkout`);
      return;
    }

    setLoadingPlan(planId);
    setError(null);
    try {
      const res = await createSubscriptionSession({
        planId,
        interval: billingPeriod,
        successUrl: `${window.location.origin}/${locale}/credits/success?type=subscription&plan=${planId}&v=${value}&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/${locale}/pro?subscription=cancelled`,
      });
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        setError('Impossible de démarrer le paiement. Réessayez.');
        setLoadingPlan(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Réessayez.');
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-[var(--ink)] text-[var(--ivory)]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE4YzEuNjU2IDAgMy0xLjM0NCAzLTNzLTEuMzQ0LTMtMy0zLTMgMS4zNDQtMyAzIDEuMzQ0IDMgMyAzem0wIDZjMS42NTYgMCAzLTEuMzQ0IDMtM3MtMS4zNDQtMy0zLTMtMyAxLjM0NC0zIDMgMS4zNDQgMyAzIDN6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-[var(--gold-soft)] opacity-20 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-6 py-20 lg:py-28">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-[rgba(200,162,77,0.12)] backdrop-blur-sm border border-[var(--gold-line)] rounded-full px-4 py-2 mb-8">
              <Building2 className="w-4 h-4 text-[var(--gold)]" />
              <span className="prestige-eyebrow !text-[var(--ivory)]">Solution professionnelle, immobilier</span>
            </div>

            <h1 className="prestige-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Vendez vos biens plus vite,{' '}
              <br />
              <span className="text-[var(--gold)]">sans dépenser 2 000 € de home staging</span>
            </h1>

            <p className="text-lg md:text-xl text-[var(--mist)] max-w-3xl mx-auto mb-10 leading-relaxed">
              Meublez n&apos;importe quelle pièce (vide ou occupée) en 30 secondes par IA.
              Rendu HD prêt pour votre annonce.
              <strong className="text-[var(--ivory)]"> Home staging virtuel illimité pour les pros de l&apos;immobilier.</strong>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                href="#plans"
                className="inline-flex items-center gap-2 bg-[var(--gold)] text-[#0c0a09] border border-[var(--gold)] hover:bg-transparent hover:text-[var(--gold)] px-8 py-4 rounded-full text-lg font-semibold transition-all"
              >
                Voir les tarifs Pro <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/essai"
                className="inline-flex items-center gap-2 bg-[rgba(200,162,77,0.10)] hover:bg-[rgba(200,162,77,0.18)] backdrop-blur-sm border border-[var(--gold-line)] text-[var(--ivory)] px-8 py-4 rounded-full text-lg font-medium transition-all"
              >
                Testez gratuitement sur votre photo
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--mist)]">
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> Essai gratuit, sans CB</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> Sans engagement</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> Résultat en 30 secondes</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PROBLÈME / SOLUTION ===== */}
      <section className="py-20 bg-card prestige-reveal">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="prestige-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Un bien meublé se vend <span className="text-[var(--gold)]">nettement plus vite</span>
            </h2>
            <div className="prestige-rule w-24 mx-auto mb-6" />
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              La majorité des acheteurs commencent leur recherche en ligne. Sans mise en scène,
              votre bien passe inaperçu parmi des milliers d&apos;annonces.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {ROI_COMPARISONS.map((item, i) => (
              <div
                key={item.label}
                style={{ ['--reveal-d' as string]: `${i * 120}ms` }}
                className={`prestige-reveal rounded-xl p-6 ${
                  item.highlight
                    ? 'bg-[rgba(200,162,77,0.12)] text-foreground ring-2 ring-[var(--gold)] ring-offset-4 ring-offset-background shadow-xl scale-105'
                    : 'bg-background border border-border'
                }`}
              >
                <item.icon className={`w-8 h-8 mb-4 ${item.highlight ? 'text-[var(--gold)]' : 'text-muted-foreground'}`} />
                <h3 className={`text-lg font-bold mb-3 ${item.highlight ? 'text-[var(--gold)]' : 'text-foreground'}`}>
                  {item.label}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Coût</span>
                    <span className="font-semibold text-foreground">{item.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Délai</span>
                    <span className="font-semibold text-foreground">{item.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Qualité</span>
                    <span className="font-semibold text-xs text-foreground">{item.quality}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground italic mb-10">
            Tarifs et délais du home staging physique et de la photo 3D donnés à titre indicatif.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: '49€', label: 'par mois, vs 2 000€+ de staging physique' },
              { value: '~30s', label: 'pour transformer une pièce' },
              { value: '8', label: 'types de pièces supportés' },
              { value: 'HD+', label: 'jusqu\'à 2048px inclus' },
            ].map((stat, i) => (
              <div
                key={stat.label}
                style={{ ['--reveal-d' as string]: `${i * 90}ms` }}
                className="prestige-reveal text-center p-4 bg-background rounded-xl border border-border"
              >
                <p className="prestige-display text-3xl font-bold text-[var(--gold)]">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CAS D'USAGE ===== */}
      <section className="py-20 prestige-reveal">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="prestige-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              À qui s&apos;adresse InstaDeco Pro ?
            </h2>
            <div className="prestige-rule w-24 mx-auto mb-6" />
            <p className="text-lg text-muted-foreground">
              Pensé pour les professionnels de l&apos;immobilier et du design, dans toute la francophonie.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {USE_CASES.map((useCase, i) => (
              <div
                key={useCase.title}
                style={{ ['--reveal-d' as string]: `${i * 120}ms` }}
                className="prestige-reveal bg-card border border-border rounded-2xl p-8 hover:border-[var(--gold-line)] transition-colors duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-3 bg-[rgba(200,162,77,0.12)] border border-[var(--gold-line)] rounded-xl">
                    <useCase.icon className="w-6 h-6 text-[var(--gold)]" />
                  </div>
                  <div>
                    <h3 className="prestige-display text-xl font-bold text-foreground mb-2">{useCase.title}</h3>
                    <p className="text-muted-foreground mb-3">{useCase.description}</p>
                    <p className="text-sm font-semibold text-[var(--gold)]">{useCase.stat}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== COMMENT ÇA MARCHE ===== */}
      <section className="py-20 bg-card prestige-reveal">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="prestige-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              3 étapes, 30 secondes
            </h2>
            <div className="prestige-rule w-24 mx-auto mt-6" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: 1, icon: Camera, title: 'Photographiez la pièce', desc: 'Prenez une photo de la pièce vide ou occupée. Smartphone ou appareil pro.' },
              { step: 2, icon: Palette, title: 'Choisissez un style', desc: 'Moderne, scandinave, industriel... un style pour chaque bien et chaque cible.' },
              { step: 3, icon: Download, title: 'Téléchargez en HD', desc: 'En 30 secondes, obtenez le rendu meublé en haute définition. Prêt pour vos annonces.' },
            ].map((item, i) => (
              <div
                key={item.step}
                style={{ ['--reveal-d' as string]: `${i * 120}ms` }}
                className="prestige-reveal text-center"
              >
                <div className="prestige-display w-16 h-16 rounded-full bg-[var(--gold)] text-[#0c0a09] text-2xl font-bold flex items-center justify-center mx-auto mb-6">
                  {item.step}
                </div>
                <item.icon className="w-8 h-8 mx-auto mb-4 text-[var(--gold)]" />
                <h3 className="prestige-display text-xl font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== RENDUS RÉELS (PREUVE) ===== */}
      <section className="py-20 bg-card prestige-reveal">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="prestige-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Des rendus réels, pas des promesses
            </h2>
            <div className="prestige-rule w-24 mx-auto mb-6" />
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Glissez le curseur. Chaque image a été générée par InstaDeco à partir d&apos;une
              vraie photo de pièce, en quelques secondes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {REAL_RENDERS.map((r, i) => (
              <PrestigeCompare
                key={r.after}
                before={r.before}
                after={r.after}
                beforeAlt={r.beforeAlt}
                afterAlt={r.afterAlt}
                eyebrow={r.eyebrow}
                caption={r.caption}
                priority={i === 0}
              />
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/essai"
              className="inline-flex items-center gap-2 bg-[var(--gold)] text-[#0c0a09] border border-[var(--gold)] hover:bg-transparent hover:text-[var(--gold)] px-8 py-4 rounded-full text-base font-semibold transition-all"
            >
              Testez sur votre propre photo <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== CAS D'USAGE PROS ===== */}
      <section className="py-20 prestige-reveal">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="prestige-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Comment les pros utilisent InstaDeco
            </h2>
            <div className="prestige-rule w-24 mx-auto mt-6" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {PRO_USE_CASES.map((t, i) => (
              <div
                key={t.profile}
                style={{ ['--reveal-d' as string]: `${i * 120}ms` }}
                className="prestige-reveal bg-card rounded-2xl p-8 border border-[var(--gold-line)]"
              >
                <div className="mb-4 inline-flex p-3 bg-[rgba(200,162,77,0.12)] border border-[var(--gold-line)] rounded-xl">
                  <t.icon className="w-6 h-6 text-[var(--gold)]" />
                </div>
                <h3 className="prestige-display font-semibold text-foreground text-lg mb-2">{t.profile}</h3>
                <p className="prestige-eyebrow mb-4">{t.role}</p>
                <p className="text-muted-foreground leading-relaxed mb-4">{t.useCase}</p>
                <div className="border-t border-[var(--gold-line)] pt-4">
                  <p className="text-sm font-bold text-[var(--gold)]">{t.benefit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PLANS PRO ===== */}
      <section id="plans" className="py-20 bg-card prestige-reveal">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="prestige-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Choisissez votre plan
            </h2>
            <div className="prestige-rule w-24 mx-auto mb-6" />
            <p className="text-lg text-muted-foreground mb-8">
              Rentabilisé dès le premier bien vendu plus vite.
            </p>

            {/* Toggle mensuel/annuel */}
            <div className="inline-flex items-center bg-background border border-border rounded-full p-1">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-5 sm:px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingPeriod === 'monthly' ? 'bg-[var(--gold)] text-[#0c0a09]' : 'text-muted-foreground'
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setBillingPeriod('annual')}
                className={`px-5 sm:px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingPeriod === 'annual' ? 'bg-[var(--gold)] text-[#0c0a09]' : 'text-muted-foreground'
                }`}
              >
                Annuel <span className={`font-bold ${billingPeriod === 'annual' ? 'text-[#0c0a09]' : 'text-[var(--gold)]'}`}>-30%</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="max-w-md mx-auto mb-8 text-center bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-8 items-start">
            {PRO_PLANS.map((plan, i) => {
              const price = billingPeriod === 'monthly' ? plan.monthly : plan.annual;
              const isLoading = loadingPlan === plan.id;
              return (
                <div
                  key={plan.id}
                  style={{ ['--reveal-d' as string]: `${i * 120}ms` }}
                  className={`prestige-reveal rounded-2xl p-8 transition-all ${
                    plan.popular
                      ? 'bg-[var(--ink)] text-[var(--ivory)] ring-2 ring-[var(--gold)] shadow-2xl md:-translate-y-2'
                      : 'bg-background border border-border'
                  }`}
                >
                  {plan.popular ? (
                    <div className="prestige-eyebrow inline-block bg-[var(--gold)] !text-[#0c0a09] px-3 py-1 rounded-full mb-4">
                      {plan.tagline.toUpperCase()}
                    </div>
                  ) : (
                    <div className="prestige-eyebrow inline-block bg-[rgba(200,162,77,0.12)] border border-[var(--gold-line)] px-3 py-1 rounded-full mb-4">
                      {plan.tagline.toUpperCase()}
                    </div>
                  )}

                  <h3 className={`prestige-display text-2xl font-bold mb-2 ${plan.popular ? 'text-[var(--ivory)]' : 'text-foreground'}`}>
                    {plan.name}
                  </h3>

                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`prestige-display text-5xl font-bold ${plan.popular ? 'text-[var(--gold)]' : 'text-foreground'}`}>
                      {formatPrice(price)}€
                    </span>
                    <span className={plan.popular ? 'text-[var(--mist)]' : 'text-muted-foreground'}>/mois</span>
                  </div>
                  <p className={`text-sm mb-6 h-5 ${plan.popular ? 'text-[var(--mist)]' : 'text-muted-foreground'}`}>
                    {billingPeriod === 'annual' ? plan.annualBilled : ' '}
                  </p>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400" />
                        <span className={`text-sm ${plan.popular ? 'text-[var(--mist)]' : 'text-muted-foreground'}`}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 w-full text-center py-4 rounded-full text-base font-semibold transition-all disabled:opacity-70 bg-[var(--gold)] text-[#0c0a09] border border-[var(--gold)] hover:bg-transparent hover:text-[var(--gold)]"
                  >
                    {isLoading ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Redirection…</>
                    ) : (
                      <>S&apos;abonner <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Garantie */}
          <div className="text-center mt-12 prestige-reveal">
            <div className="inline-flex items-center gap-3 bg-[rgba(200,162,77,0.10)] border border-[var(--gold-line)] rounded-xl px-6 py-3">
              <Shield className="w-5 h-5 text-[var(--gold)]" />
              <span className="text-sm text-foreground">
                <strong>Sans engagement.</strong> Annulez en 1 clic. Essai gratuit sans carte bancaire.
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Paiement sécurisé par Stripe. Facture avec TVA disponible.
            </p>
          </div>
        </div>
      </section>

      {/* ===== CALCULATEUR ROI ===== */}
      <section className="py-20 prestige-reveal">
        <div className="max-w-4xl mx-auto px-6">
          <div className="relative overflow-hidden bg-[var(--ink)] border border-[var(--gold-line)] rounded-3xl p-10 text-[var(--ivory)] text-center">
            <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-[var(--gold-soft)] opacity-15 blur-3xl" />
            <Award className="relative w-12 h-12 text-[var(--gold)] mx-auto mb-6" />
            <h2 className="prestige-display relative text-3xl font-bold mb-4">Le calcul est simple</h2>
            <div className="prestige-rule relative w-24 mx-auto mb-2" />
            <div className="relative grid md:grid-cols-3 gap-8 mt-8">
              <div style={{ ['--reveal-d' as string]: '0ms' }} className="prestige-reveal">
                <p className="prestige-display text-4xl font-bold text-[var(--gold)]">49€</p>
                <p className="text-[var(--mist)] mt-2">par mois, générations illimitées</p>
              </div>
              <div style={{ ['--reveal-d' as string]: '120ms' }} className="prestige-reveal">
                <p className="prestige-display text-4xl font-bold text-emerald-400">1 bien</p>
                <p className="text-[var(--mist)] mt-2">vendu plus vite suffit à rentabiliser l&apos;année</p>
              </div>
              <div style={{ ['--reveal-d' as string]: '240ms' }} className="prestige-reveal">
                <p className="prestige-display text-4xl font-bold text-[var(--gold)]">Illimité</p>
                <p className="text-[var(--mist)] mt-2">de rendus, pour autant de biens que vous voulez</p>
              </div>
            </div>
            <Link
              href="#plans"
              className="relative inline-flex items-center gap-2 bg-[var(--gold)] text-[#0c0a09] border border-[var(--gold)] hover:bg-transparent hover:text-[var(--gold)] px-10 py-4 rounded-full text-lg font-semibold mt-10 transition-all"
            >
              Démarrer maintenant <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-20 bg-card prestige-reveal">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="prestige-display text-3xl font-bold text-center text-foreground mb-4">
            Questions fréquentes
          </h2>
          <div className="prestige-rule w-24 mx-auto mb-12" />

          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <div
                key={i}
                style={{ ['--reveal-d' as string]: `${i * 70}ms` }}
                className="prestige-reveal bg-background rounded-xl border border-border overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-medium text-foreground pr-4">{item.q}</span>
                  <ChevronDown className={`w-5 h-5 text-[var(--gold)] flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-muted-foreground text-sm leading-relaxed border-t border-[var(--gold-line)] pt-4">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="relative overflow-hidden py-20 bg-[var(--ink)] text-[var(--ivory)] text-center prestige-reveal">
        <div className="pointer-events-none absolute -bottom-24 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-[var(--gold-soft)] opacity-15 blur-3xl" />
        <div className="relative max-w-3xl mx-auto px-6">
          <h2 className="prestige-display text-3xl md:text-4xl font-bold mb-6">
            Prêt à vendre plus <span className="text-[var(--gold)] italic">vite</span> ?
          </h2>
          <p className="text-lg text-[var(--mist)] mb-10">
            Offrez à vos annonces un home staging virtuel par IA
            et démarquez-vous dès aujourd&apos;hui.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="#plans"
              className="inline-flex items-center gap-2 bg-[var(--gold)] text-[#0c0a09] border border-[var(--gold)] hover:bg-transparent hover:text-[var(--gold)] px-10 py-4 rounded-full text-lg font-semibold transition-all"
            >
              Voir les plans <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="mailto:contact@instadeco.app?subject=Demande%20offre%20Agence%20sur%20mesure"
              className="inline-flex items-center gap-2 text-[var(--mist)] hover:text-[var(--gold)] transition-colors text-lg"
            >
              Plus de 3 sièges ? Contactez-nous
            </a>
          </div>
          <p className="text-sm text-[var(--mist)] mt-6">
            Essai gratuit · Sans engagement · Annulez en 1 clic
          </p>
        </div>
      </section>
    </div>
  );
}
