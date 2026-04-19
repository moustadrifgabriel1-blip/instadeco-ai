'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Building2, Camera, Zap, TrendingUp, Check, ArrowRight, 
  Shield, Clock, CreditCard, ChevronDown, Home,
  Users, BarChart3, Sparkles, Download, Palette, Award
} from 'lucide-react';

// ============================================
// DONNÉES
// ============================================

const PRO_PLANS = [
  {
    id: 'pro_monthly',
    name: 'Pro Mensuel',
    price: 49,
    period: '/mois',
    features: [
      'Générations illimitées',
      'Qualité HD incluse',
      '12 styles de décoration',
      'Téléchargement immédiat',
      'Support prioritaire',
      'Sans engagement — annulez à tout moment',
    ],
    cta: 'Démarrer l\'essai gratuit',
    popular: true,
    savings: null,
  },
  {
    id: 'pro_yearly',
    name: 'Pro Annuel',
    price: 39,
    period: '/mois',
    billedAs: 'Facturé 468€/an',
    features: [
      'Tout le plan Pro Mensuel',
      'Économisez 120€/an',
      'Accès anticipé aux nouvelles fonctionnalités',
      'API access (bientôt)',
      'Compte multi-utilisateurs (bientôt)',
      'Formation home staging offerte',
    ],
    cta: 'Économiser 20%',
    popular: false,
    savings: 20,
  },
];

const PRO_USE_CASES = [
  {
    profile: 'Agents immobiliers',
    role: 'Home staging virtuel',
    useCase: 'Meublez virtuellement vos biens vides pour aider les acquéreurs à se projeter. Complément rapide et économique au home staging physique.',
    benefit: 'Projection immédiate',
    icon: '🏢',
  },
  {
    profile: 'Home stagers',
    role: 'Validation rapide',
    useCase: 'Montrez un rendu IA à vos clients pour valider la direction déco avant de réaliser le staging physique. Réduisez les allers-retours.',
    benefit: 'Moins d\'allers-retours',
    icon: '🎨',
  },
  {
    profile: 'Agences & promoteurs',
    role: 'À l\'échelle',
    useCase: 'Équipez vos équipes pour ajouter une version "meublée virtuellement" à chaque annonce. 12 styles disponibles, résultat en ~30 secondes.',
    benefit: '12 styles disponibles',
    icon: '🏗️',
  },
];

const ROI_COMPARISONS = [
  { label: 'Home staging physique', price: '2 000 - 5 000 €', time: '1-2 semaines', quality: 'Excellent mais limité à 1 style', icon: Home },
  { label: 'Photographe 3D', price: '500 - 1 500 €/bien', time: '3-5 jours', quality: 'Bon mais coûteux à l\'échelle', icon: Camera },
  { label: 'InstaDeco Pro', price: '49 €/mois illimité', time: '10 secondes', quality: '12 styles, illimité, HD', icon: Sparkles, highlight: true },
];

const USE_CASES = [
  {
    icon: Building2,
    title: 'Agents immobiliers',
    description: 'Meublez virtuellement vos biens vides. Aidez les acquéreurs à se projeter dans un espace aménagé.',
    stat: '12 styles disponibles instantanément',
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
    q: 'Est-ce que les images générées sont utilisables commercialement ?',
    a: 'Oui, toutes les images générées avec InstaDeco Pro vous appartiennent. Vous pouvez les utiliser dans vos annonces immobilières, sur votre site web, dans vos présentations clients, sur les réseaux sociaux, etc.',
  },
  {
    q: 'Que signifie "générations illimitées" ?',
    a: 'Avec le plan Pro, vous pouvez générer autant d\'images que vous voulez, sans quota ni limite mensuelle. Chaque génération inclut la qualité HD. Parfait pour les agences qui gèrent plusieurs biens.',
  },
  {
    q: 'Comment ça marche concrètement ?',
    a: '1) Prenez une photo de la pièce vide ou à redécorer. 2) Uploadez-la sur InstaDeco. 3) Choisissez un style (moderne, scandinave, etc.). 4) En 10 secondes, téléchargez le rendu meublé en HD. C\'est tout.',
  },
  {
    q: 'Est-ce que ça remplace un vrai home staging ?',
    a: 'Non, c\'est complémentaire. Le home staging virtuel est idéal pour les annonces en ligne (où 95% des acheteurs commencent leur recherche). Pour les visites physiques, un staging réel reste pertinent. Beaucoup de nos clients Pro utilisent InstaDeco pour le digital et un home stager pour les visites clés.',
  },
  {
    q: 'Puis-je annuler à tout moment ?',
    a: 'Oui, le plan Pro Mensuel est sans engagement. Annulez en 1 clic depuis votre espace client. Vous conservez l\'accès jusqu\'à la fin de la période payée.',
  },
  {
    q: 'Proposez-vous des tarifs pour les grandes agences ?',
    a: 'Oui ! Pour les agences de plus de 10 utilisateurs, contactez-nous à contact@instadeco.app pour un tarif sur mesure avec facturation centralisée.',
  },
];

// ============================================
// COMPOSANT PAGE
// ============================================

export default function ProPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="min-h-screen bg-white">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE4YzEuNjU2IDAgMy0xLjM0NCAzLTNzLTEuMzQ0LTMtMy0zLTMgMS4zNDQtMyAzIDEuMzQ0IDMgMyAzem0wIDZjMS42NTYgMCAzLTEuMzQ0IDMtM3MtMS4zNDQtMy0zLTMtMyAxLjM0NC0zIDMgMS4zNDQgMyAzIDN6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        
        <div className="relative max-w-6xl mx-auto px-6 py-20 lg:py-28">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
              <Building2 className="w-4 h-4 text-[#E07B54]" />
              <span className="text-sm font-medium">Solution professionnelle</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Home Staging Virtuel par IA
              <br />
              <span className="text-[#E07B54]">pour les professionnels de l&apos;immobilier</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
              Meublez virtuellement n&apos;importe quelle pièce en 10 secondes. 
              Générations illimitées, qualité HD, 12 styles.
              <strong className="text-white"> Vendez plus vite, à meilleur prix.</strong>
            </p>

            {/* CTA */}
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
                Tester gratuitement
              </Link>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-400" /> Essai gratuit</span>
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
              Un bien vide se vend <span className="text-red-500">2x moins vite</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              90% des acheteurs commencent leur recherche en ligne. Sans mise en scène, 
              votre bien passe inaperçu parmi des milliers d&apos;annonces.
            </p>
          </div>

          {/* Comparaison ROI */}
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

          {/* Stats clés */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: '12', label: 'styles de décoration disponibles' },
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
              { step: 1, icon: Camera, title: 'Photographiez la pièce', desc: 'Prenez une photo de la pièce vide ou à redécorer. Smartphone ou appareil pro.' },
              { step: 2, icon: Palette, title: 'Choisissez un style', desc: 'Moderne, scandinave, industriel... 12 styles pour s\'adapter à chaque bien et chaque cible.' },
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
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Choisissez votre plan Pro
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
                onClick={() => setBillingPeriod('yearly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingPeriod === 'yearly' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                }`}
              >
                Annuel <span className="text-[#E07B54] font-bold">-20%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {PRO_PLANS.map((plan) => {
              const isActive = (billingPeriod === 'monthly' && plan.id === 'pro_monthly') ||
                               (billingPeriod === 'yearly' && plan.id === 'pro_yearly');
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-8 transition-all ${
                    isActive
                      ? 'bg-[#0f172a] text-white ring-2 ring-[#E07B54] shadow-2xl scale-105'
                      : 'bg-white border border-gray-200 opacity-60'
                  }`}
                >
                  {plan.popular && (
                    <div className="inline-block bg-[#E07B54] text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
                      RECOMMANDÉ
                    </div>
                  )}
                  {plan.savings && (
                    <div className="inline-block bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
                      -{plan.savings}% ÉCONOMIE
                    </div>
                  )}

                  <h3 className={`text-2xl font-bold mb-2 ${isActive ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h3>

                  <div className="flex items-baseline gap-2 mb-2">
                    <span className={`text-5xl font-bold ${isActive ? 'text-[#E07B54]' : 'text-gray-900'}`}>
                      {plan.price}€
                    </span>
                    <span className={isActive ? 'text-gray-400' : 'text-gray-500'}>{plan.period}</span>
                  </div>
                  {plan.billedAs && (
                    <p className={`text-sm mb-6 ${isActive ? 'text-gray-400' : 'text-gray-500'}`}>{plan.billedAs}</p>
                  )}

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isActive ? 'text-green-400' : 'text-green-500'}`} />
                        <span className={`text-sm ${isActive ? 'text-gray-300' : 'text-gray-600'}`}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/signup"
                    className={`block w-full text-center py-4 rounded-full text-base font-semibold transition-all ${
                      isActive
                        ? 'bg-[#E07B54] hover:bg-[#D4603C] text-white shadow-lg'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Garantie */}
          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-6 py-3">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-800">
                <strong>Garantie 30 jours</strong> — Pas satisfait ? Remboursé intégralement, sans question.
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
                <p className="text-gray-400 mt-2">Coût mensuel InstaDeco Pro</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-green-400">1 bien</p>
                <p className="text-gray-400 mt-2">vendu plus vite par mois suffit à le rentabiliser</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-yellow-400">x40</p>
                <p className="text-gray-400 mt-2">moins cher qu&apos;un home staging physique</p>
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
              href="/signup"
              className="inline-flex items-center gap-2 bg-[#E07B54] hover:bg-[#D4603C] text-white px-10 py-4 rounded-full text-lg font-semibold transition-all shadow-lg shadow-[#E07B54]/25"
            >
              Essai gratuit <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="mailto:contact@instadeco.app?subject=Demande%20offre%20Pro%20sur%20mesure"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-lg"
            >
              Ou contactez-nous pour un devis agence
            </a>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            Essai gratuit - Sans engagement - Remboursé sous 30 jours
          </p>
        </div>
      </section>
    </div>
  );
}
