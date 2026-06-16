'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from '@/i18n/navigation';
import { createSubscriptionSession } from '@/src/presentation/api/client';
import { trackBeginCheckout } from '@/lib/analytics/gtag';
import { fbTrackInitiateCheckout, fbTrackViewContent } from '@/lib/analytics/fb-pixel';
import {
  Building2, Camera, Check, ArrowRight,
  Shield, ChevronDown, Home,
  Users, BarChart3, Sparkles, Download, Palette, Award, Loader2,
} from 'lucide-react';

// ============================================
// DONNÉES — offre immobilier (Solo / Pro illimité / Agence)
// ============================================

type PlanId = 'solo' | 'pro' | 'agence';

interface ProPlan {
  id: PlanId;
  name: string;
  tagline: string;
  monthly: number;       // €/mois en facturation mensuelle
  annual: number;        // €/mois équivalent en facturation annuelle (−30%)
  annualBilled: string;  // libellé "Facturé X€/an"
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
    features: [
      'Générations ILLIMITÉES (fair-use)',
      '1 utilisateur',
      'Qualité HD',
      'Export « pièce vide »',
      'Tous les styles',
      'Support prioritaire',
      'Sans engagement — annulez en 1 clic',
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

const PRO_USE_CASES = [
  {
    profile: 'Agents immobiliers',
    role: 'Home staging virtuel',
    useCase: 'Meublez virtuellement vos biens vides (ou restylez une pièce occupée) pour aider les acquéreurs à se projeter. Un bien meublé se vend nettement plus vite.',
    benefit: 'Vendez plus vite',
    icon: '🏢',
  },
  {
    profile: 'Home stagers',
    role: 'Validation rapide',
    useCase: 'Montrez un rendu IA à vos clients pour valider la direction déco avant de réaliser le staging physique. Réduisez les allers-retours.',
    benefit: "Moins d'allers-retours",
    icon: '🎨',
  },
  {
    profile: 'Agences & promoteurs',
    role: "À l'échelle",
    useCase: 'Équipez vos équipes pour ajouter une version « meublée virtuellement » à chaque annonce. Illimité, résultat en ~30 secondes, facturation centralisée.',
    benefit: 'Illimité, multi-sièges',
    icon: '🏗️',
  },
];

const ROI_COMPARISONS = [
  { label: 'Home staging physique', price: '2 000 - 5 000 €', time: '1-2 semaines', quality: 'Excellent mais limité à 1 style', icon: Home },
  { label: 'Photographe 3D', price: '500 - 1 500 €/bien', time: '3-5 jours', quality: 'Bon mais coûteux à l\'échelle', icon: Camera },
  { label: 'InstaDeco Pro', price: '49 €/mois illimité', time: '10 secondes', quality: 'Illimité, tous styles, HD', icon: Sparkles, highlight: true },
];

const USE_CASES = [
  {
    icon: Building2,
    title: 'Agents immobiliers',
    description: 'Meublez virtuellement vos biens vides. Aidez les acquéreurs à se projeter dans un espace aménagé — et vendez plus vite.',
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

const FAQ = [
  {
    q: 'Que signifie « illimité » exactement ?',
    a: 'Les plans Pro et Agence permettent de générer autant d\'images que nécessaire pour votre activité, sans quota mensuel. Une politique d\'usage équitable (fair-use) s\'applique pour prévenir les abus (revente, automatisation non autorisée). Le plan Solo, lui, inclut 40 images/mois.',
  },
  {
    q: 'Les images générées sont-elles utilisables commercialement ?',
    a: 'Oui, la licence commerciale est incluse : utilisez les rendus dans vos annonces, votre site, vos présentations clients et sur les réseaux. Un filigrane « visuel virtuel » et l\'export d\'une version non meublée sont disponibles pour rester conforme à la déontologie immobilière.',
  },
  {
    q: 'Comment ça marche concrètement ?',
    a: '1) Prenez une photo de la pièce (vide ou occupée). 2) Uploadez-la sur InstaDeco. 3) Choisissez un style. 4) En ~10 secondes, téléchargez le rendu meublé en HD. C\'est tout.',
  },
  {
    q: 'Est-ce que ça remplace un vrai home staging ?',
    a: 'C\'est complémentaire. Le home staging virtuel est idéal pour les annonces en ligne (où la majorité des acheteurs commencent leur recherche). Pour les visites physiques, un staging réel reste pertinent.',
  },
  {
    q: 'Puis-je annuler à tout moment ?',
    a: 'Oui, sans engagement. Annulez en 1 clic depuis votre espace client ; vous conservez l\'accès jusqu\'à la fin de la période payée.',
  },
  {
    q: 'Et pour une grande agence (plus de 3 sièges) ?',
    a: 'Le plan Agence inclut 3 sièges. Au-delà, contactez-nous à contact@instadeco.app pour un tarif sur mesure avec facturation centralisée.',
  },
];

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
    const value = plan ? (billingPeriod === 'monthly' ? plan.monthly : plan.annual) : 0;

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
        successUrl: `${window.location.origin}/${locale}/dashboard?subscription=success&plan=${planId}&v=${value}`,
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
    <div className="min-h-screen bg-white">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE4YzEuNjU2IDAgMy0xLjM0NCAzLTNzLTEuMzQ0LTMtMy0zLTMgMS4zNDQtMyAzIDEuMzQ0IDMgMyAzem0wIDZjMS42NTYgMCAzLTEuMzQ0IDMtM3MtMS4zNDQtMy0zLTMtMyAxLjM0NC0zIDMgMS4zNDQgMyAzIDN6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />

        <div className="relative max-w-6xl mx-auto px-6 py-20 lg:py-28">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
              <Building2 className="w-4 h-4 text-[#E07B54]" />
              <span className="text-sm font-medium">Solution professionnelle — immobilier</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Vendez vos biens plus vite,
              <br />
              <span className="text-[#E07B54]">sans dépenser 2 000 € de home staging</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
              Meublez n&apos;importe quelle pièce (vide ou occupée) en 10 secondes par IA.
              Rendu HD prêt pour votre annonce.
              <strong className="text-white"> Home staging virtuel illimité pour les pros de l&apos;immobilier.</strong>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                href="#plans"
                className="inline-flex items-center gap-2 bg-[#E07B54] hover:bg-[#D4603C] text-white px-8 py-4 rounded-full text-lg font-semibold transition-all shadow-lg shadow-[#E07B54]/25 hover:shadow-xl"
              >
                Voir les tarifs Pro <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/generate"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-full text-lg font-medium transition-all"
              >
                Testez gratuitement sur votre photo
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-400" /> Essai gratuit, sans CB</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-400" /> Sans engagement</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-400" /> Résultat en 10 secondes</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PROBLÈME / SOLUTION ===== */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Un bien meublé se vend <span className="text-[#E07B54]">jusqu&apos;à 73% plus vite</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              La majorité des acheteurs commencent leur recherche en ligne. Sans mise en scène,
              votre bien passe inaperçu parmi des milliers d&apos;annonces.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {ROI_COMPARISONS.map((item) => (
              <div
                key={item.label}
                className={`rounded-xl p-6 ${
                  item.highlight
                    ? 'bg-[#E07B54] text-white ring-2 ring-[#E07B54] ring-offset-4 shadow-xl scale-105'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <item.icon className={`w-8 h-8 mb-4 ${item.highlight ? 'text-white' : 'text-gray-400'}`} />
                <h3 className={`text-lg font-bold mb-3 ${item.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {item.label}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className={item.highlight ? 'text-white/80' : 'text-gray-500'}>Coût</span>
                    <span className="font-semibold">{item.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={item.highlight ? 'text-white/80' : 'text-gray-500'}>Délai</span>
                    <span className="font-semibold">{item.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={item.highlight ? 'text-white/80' : 'text-gray-500'}>Qualité</span>
                    <span className="font-semibold text-xs">{item.quality}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: '−95%', label: 'vs un home staging physique' },
              { value: '~30s', label: 'pour transformer une pièce' },
              { value: '8', label: 'types de pièces supportés' },
              { value: 'HD+', label: 'jusqu\'à 2048px inclus' },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-4 bg-white rounded-xl border border-gray-100">
                <p className="text-3xl font-bold text-[#E07B54]">{stat.value}</p>
                <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CAS D'USAGE ===== */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Qui utilise InstaDeco Pro ?
            </h2>
            <p className="text-lg text-gray-600">
              Des professionnels de l&apos;immobilier et du design dans toute la francophonie.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {USE_CASES.map((useCase) => (
              <div key={useCase.title} className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-3 bg-[#E07B54]/10 rounded-xl">
                    <useCase.icon className="w-6 h-6 text-[#E07B54]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{useCase.title}</h3>
                    <p className="text-gray-600 mb-3">{useCase.description}</p>
                    <p className="text-sm font-semibold text-[#E07B54]">{useCase.stat}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== COMMENT ÇA MARCHE ===== */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              3 étapes, 10 secondes
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: 1, icon: Camera, title: 'Photographiez la pièce', desc: 'Prenez une photo de la pièce vide ou occupée. Smartphone ou appareil pro.' },
              { step: 2, icon: Palette, title: 'Choisissez un style', desc: 'Moderne, scandinave, industriel... un style pour chaque bien et chaque cible.' },
              { step: 3, icon: Download, title: 'Téléchargez en HD', desc: 'En 10 secondes, obtenez le rendu meublé en haute définition. Prêt pour vos annonces.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-[#E07B54] text-white text-2xl font-bold flex items-center justify-center mx-auto mb-6">
                  {item.step}
                </div>
                <item.icon className="w-8 h-8 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CAS D'USAGE PROS ===== */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comment les pros utilisent InstaDeco
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {PRO_USE_CASES.map((t) => (
              <div key={t.profile} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                <div className="text-4xl mb-4">{t.icon}</div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{t.profile}</h3>
                <p className="text-sm text-[#E07B54] font-medium mb-4">{t.role}</p>
                <p className="text-gray-700 leading-relaxed mb-4">{t.useCase}</p>
                <div className="border-t pt-4">
                  <p className="text-sm font-bold text-[#E07B54]">{t.benefit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PLANS PRO ===== */}
      <section id="plans" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Choisissez votre plan
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Rentabilisé dès le premier bien vendu plus vite.
            </p>

            {/* Toggle mensuel/annuel */}
            <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingPeriod === 'monthly' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setBillingPeriod('annual')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingPeriod === 'annual' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                }`}
              >
                Annuel <span className="text-[#E07B54] font-bold">−30%</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="max-w-md mx-auto mb-8 text-center bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-8 items-start">
            {PRO_PLANS.map((plan) => {
              const price = billingPeriod === 'monthly' ? plan.monthly : plan.annual;
              const isLoading = loadingPlan === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-8 transition-all ${
                    plan.popular
                      ? 'bg-[#0f172a] text-white ring-2 ring-[#E07B54] shadow-2xl md:scale-105'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  {plan.popular ? (
                    <div className="inline-block bg-[#E07B54] text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
                      {plan.tagline.toUpperCase()}
                    </div>
                  ) : (
                    <div className="inline-block bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full mb-4">
                      {plan.tagline.toUpperCase()}
                    </div>
                  )}

                  <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h3>

                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-5xl font-bold ${plan.popular ? 'text-[#E07B54]' : 'text-gray-900'}`}>
                      {formatPrice(price)}€
                    </span>
                    <span className={plan.popular ? 'text-gray-400' : 'text-gray-500'}>/mois</span>
                  </div>
                  <p className={`text-sm mb-6 h-5 ${plan.popular ? 'text-gray-400' : 'text-gray-500'}`}>
                    {billingPeriod === 'annual' ? plan.annualBilled : ' '}
                  </p>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-green-400' : 'text-green-500'}`} />
                        <span className={`text-sm ${plan.popular ? 'text-gray-300' : 'text-gray-600'}`}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isLoading}
                    className={`flex items-center justify-center gap-2 w-full text-center py-4 rounded-full text-base font-semibold transition-all disabled:opacity-70 ${
                      plan.popular
                        ? 'bg-[#E07B54] hover:bg-[#D4603C] text-white shadow-lg'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
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
          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-6 py-3">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-800">
                <strong>Sans engagement</strong> — annulez en 1 clic. Essai gratuit sans carte bancaire.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CALCULATEUR ROI ===== */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-3xl p-10 text-white text-center">
            <Award className="w-12 h-12 text-[#E07B54] mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Le calcul est simple</h2>
            <div className="grid md:grid-cols-3 gap-8 mt-8">
              <div>
                <p className="text-4xl font-bold text-[#E07B54]">49€</p>
                <p className="text-gray-400 mt-2">par mois, générations illimitées</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-green-400">1 bien</p>
                <p className="text-gray-400 mt-2">vendu plus vite suffit à rentabiliser l&apos;année</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-yellow-400">−95%</p>
                <p className="text-gray-400 mt-2">vs un home staging physique</p>
              </div>
            </div>
            <Link
              href="#plans"
              className="inline-flex items-center gap-2 bg-[#E07B54] hover:bg-[#D4603C] text-white px-10 py-4 rounded-full text-lg font-semibold mt-10 transition-all shadow-lg"
            >
              Démarrer maintenant <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Questions fréquentes
          </h2>

          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-medium text-gray-900 pr-4">{item.q}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="py-20 bg-[#0f172a] text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Prêt à vendre plus vite ?
          </h2>
          <p className="text-lg text-gray-400 mb-10">
            Rejoignez les professionnels qui utilisent déjà
            le home staging virtuel par IA pour se démarquer.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="#plans"
              className="inline-flex items-center gap-2 bg-[#E07B54] hover:bg-[#D4603C] text-white px-10 py-4 rounded-full text-lg font-semibold transition-all shadow-lg shadow-[#E07B54]/25"
            >
              Voir les plans <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="mailto:contact@instadeco.app?subject=Demande%20offre%20Agence%20sur%20mesure"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-lg"
            >
              Plus de 3 sièges ? Contactez-nous
            </a>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            Essai gratuit · Sans engagement · Annulez en 1 clic
          </p>
        </div>
      </section>
    </div>
  );
}
