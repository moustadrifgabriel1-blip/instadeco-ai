/**
 * Génère messages/fr.json, en.json, de.json (structure Phase 1).
 * Exécuter : node scripts/write-i18n-messages.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const messagesDir = path.join(root, 'messages');

const creditPacksFr = [
  { id: 'pack_10', name: 'Découverte', credits: 10, price: 9.9, pricePerCredit: 0.99, popular: false, emoji: '🌱', description: 'Parfait pour tester', savings: null, cta: 'Commencer maintenant' },
  { id: 'pack_25', name: 'Créatif', credits: 25, price: 19.9, pricePerCredit: 0.8, popular: true, emoji: '✨', description: 'Le plus populaire', savings: 20, cta: 'Choisir le Créatif' },
  { id: 'pack_50', name: 'Pro', credits: 50, price: 34.9, pricePerCredit: 0.7, popular: false, emoji: '🚀', description: 'Meilleur rapport qualité-prix', savings: 30, cta: 'Passer au Pro' },
];

const creditPacksEn = [
  { id: 'pack_10', name: 'Discovery', credits: 10, price: 9.9, pricePerCredit: 0.99, popular: false, emoji: '🌱', description: 'Perfect to try it out', savings: null, cta: 'Get started' },
  { id: 'pack_25', name: 'Creative', credits: 25, price: 19.9, pricePerCredit: 0.8, popular: true, emoji: '✨', description: 'Most popular', savings: 20, cta: 'Choose Creative' },
  { id: 'pack_50', name: 'Pro', credits: 50, price: 34.9, pricePerCredit: 0.7, popular: false, emoji: '🚀', description: 'Best value', savings: 30, cta: 'Go Pro' },
];

const creditPacksDe = [
  { id: 'pack_10', name: 'Entdeckerpaket', credits: 10, price: 9.9, pricePerCredit: 0.99, popular: false, emoji: '🌱', description: 'Ideal zum Testen', savings: null, cta: 'Jetzt starten' },
  { id: 'pack_25', name: 'Kreativ', credits: 25, price: 19.9, pricePerCredit: 0.8, popular: true, emoji: '✨', description: 'Am beliebtesten', savings: 20, cta: 'Kreativ wählen' },
  { id: 'pack_50', name: 'Pro', credits: 50, price: 34.9, pricePerCredit: 0.7, popular: false, emoji: '🚀', description: 'Bestes Preis-Leistungs-Verhältnis', savings: 30, cta: 'Pro werden' },
];

const subEssentielFeaturesFr = ['30 crédits / mois', '20+ styles de déco', 'Téléchargement illimité', 'Usage commercial inclus', 'Support par email'];
const subProFeaturesFr = ['80 crédits / mois', '20+ styles de déco', 'HD+ inclus (2048px)', 'Usage commercial inclus', 'Support prioritaire', 'Crédits non utilisés reportés'];
const subBusinessFeaturesFr = ['200 crédits / mois', '20+ styles de déco', 'HD+ inclus (2048px)', 'Usage commercial illimité', 'Support dédié', 'Crédits non utilisés reportés'];

const subEssentielFeaturesEn = ['30 credits / month', '20+ décor styles', 'Unlimited downloads', 'Commercial use included', 'Email support'];
const subProFeaturesEn = ['80 credits / month', '20+ décor styles', 'HD+ included (2048px)', 'Commercial use included', 'Priority support', 'Unused credits roll over'];
const subBusinessFeaturesEn = ['200 credits / month', '20+ décor styles', 'HD+ included (2048px)', 'Unlimited commercial use', 'Dedicated support', 'Unused credits roll over'];

const subEssentielFeaturesDe = ['30 Credits / Monat', '20+ Deko-Stile', 'Unbegrenzte Downloads', 'Kommerzielle Nutzung inklusive', 'E-Mail-Support'];
const subProFeaturesDe = ['80 Credits / Monat', '20+ Deko-Stile', 'HD+ inklusive (2048px)', 'Kommerzielle Nutzung inklusive', 'Prioritäts-Support', 'Nicht genutzte Credits werden übertragen'];
const subBusinessFeaturesDe = ['200 Credits / Monat', '20+ Deko-Stile', 'HD+ inklusive (2048px)', 'Unbegrenzte kommerzielle Nutzung', 'Dedizierter Support', 'Nicht genutzte Credits werden übertragen'];

const subscriptionsFr = [
  { id: 'sub_essentiel', name: 'Essentiel', creditsPerMonth: 30, monthlyPrice: 19, annualPrice: 15, annualTotal: 180, popular: false, emoji: '🏠', description: 'Pour les passionnés de déco', pricePerCredit: { monthly: 0.63, annual: 0.5 }, features: subEssentielFeaturesFr, cta: 'Choisir Essentiel' },
  { id: 'sub_pro', name: 'Pro', creditsPerMonth: 80, monthlyPrice: 39, annualPrice: 31, annualTotal: 372, popular: true, emoji: '⭐', description: 'Pour les professionnels', pricePerCredit: { monthly: 0.49, annual: 0.39 }, features: subProFeaturesFr, cta: 'Choisir Pro' },
  { id: 'sub_business', name: 'Business', creditsPerMonth: 200, monthlyPrice: 79, annualPrice: 63, annualTotal: 756, popular: false, emoji: '🏢', description: 'Pour les agences & entreprises', pricePerCredit: { monthly: 0.4, annual: 0.32 }, features: subBusinessFeaturesFr, cta: 'Choisir Business' },
];

const subscriptionsEn = [
  { id: 'sub_essentiel', name: 'Essential', creditsPerMonth: 30, monthlyPrice: 19, annualPrice: 15, annualTotal: 180, popular: false, emoji: '🏠', description: 'For décor enthusiasts', pricePerCredit: { monthly: 0.63, annual: 0.5 }, features: subEssentielFeaturesEn, cta: 'Choose Essential' },
  { id: 'sub_pro', name: 'Pro', creditsPerMonth: 80, monthlyPrice: 39, annualPrice: 31, annualTotal: 372, popular: true, emoji: '⭐', description: 'For professionals', pricePerCredit: { monthly: 0.49, annual: 0.39 }, features: subProFeaturesEn, cta: 'Choose Pro' },
  { id: 'sub_business', name: 'Business', creditsPerMonth: 200, monthlyPrice: 79, annualPrice: 63, annualTotal: 756, popular: false, emoji: '🏢', description: 'For agencies & teams', pricePerCredit: { monthly: 0.4, annual: 0.32 }, features: subBusinessFeaturesEn, cta: 'Choose Business' },
];

const subscriptionsDe = [
  { id: 'sub_essentiel', name: 'Essential', creditsPerMonth: 30, monthlyPrice: 19, annualPrice: 15, annualTotal: 180, popular: false, emoji: '🏠', description: 'Für Deko-Enthusiasten', pricePerCredit: { monthly: 0.63, annual: 0.5 }, features: subEssentielFeaturesDe, cta: 'Essential wählen' },
  { id: 'sub_pro', name: 'Pro', creditsPerMonth: 80, monthlyPrice: 39, annualPrice: 31, annualTotal: 372, popular: true, emoji: '⭐', description: 'Für Profis', pricePerCredit: { monthly: 0.49, annual: 0.39 }, features: subProFeaturesDe, cta: 'Pro wählen' },
  { id: 'sub_business', name: 'Business', creditsPerMonth: 200, monthlyPrice: 79, annualPrice: 63, annualTotal: 756, popular: false, emoji: '🏢', description: 'Für Agenturen & Unternehmen', pricePerCredit: { monthly: 0.4, annual: 0.32 }, features: subBusinessFeaturesDe, cta: 'Business wählen' },
];

const faqFr = [
  { category: 'credits', question: "Combien coûte une génération d'image ?", answer: "1 crédit = 1 génération. C'est aussi simple que ça ! Chaque génération vous donne une image en haute qualité (1024×1024 pixels) que vous pouvez télécharger immédiatement." },
  { category: 'credits', question: 'Mes crédits expirent-ils ?', answer: "Non, jamais ! 🎉 Vos crédits restent sur votre compte indéfiniment. Utilisez-les quand vous voulez, à votre rythme. Pas de pression, pas de date limite." },
  { category: 'quality', question: 'Quelle est la qualité des images générées ?', answer: "Toutes les images sont en haute définition (1024×1024 pixels). Vous pouvez aussi débloquer la version HD+ (2048×2048) pour seulement 4,99€ par image - parfait pour l'impression grand format !" },
  { category: 'usage', question: "Puis-je utiliser les images pour mon activité pro ?", answer: "Absolument ! Toutes les images que vous générez vous appartiennent. Vous pouvez les utiliser pour vos projets personnels, votre portfolio, vos clients, vos réseaux sociaux... Aucune restriction d'usage commercial." },
  { category: 'quality', question: 'Comment choisir le bon style pour ma pièce ?', answer: "On propose 12 styles différents (Moderne, Scandinave, Japandi, Bohème...). Notre conseil : choisissez le style qui correspond à l'ambiance que vous voulez créer, et ajustez l'intensité de transformation selon vos goûts. Le mode 'Décor uniquement' garde vos meubles et change juste la déco !" },
  { category: 'usage', question: 'Comment télécharger mes créations ?', answer: "Super simple ! Une fois l'image générée, cliquez sur 'Télécharger' et c'est fait. L'image se sauvegarde automatiquement sur votre appareil. Vous retrouvez aussi tout votre historique dans votre tableau de bord." },
  { category: 'payment', question: 'Quels moyens de paiement acceptez-vous ?', answer: 'On accepte toutes les cartes bancaires (Visa, Mastercard, American Express), ainsi qu\'Apple Pay et Google Pay. Paiement 100% sécurisé via Stripe, leader mondial du paiement en ligne.' },
  { category: 'payment', question: 'Puis-je obtenir un remboursement ?', answer: "Oui ! Si vous n'avez pas utilisé vos crédits, vous pouvez demander un remboursement intégral sous 14 jours après l'achat. Il suffit de nous contacter par email. Les crédits déjà utilisés ne sont pas remboursables." },
  { category: 'subscription', question: "Comment fonctionne l'abonnement ?", answer: "Vous recevez vos crédits chaque mois automatiquement. Pas de surprise, tout est transparent. Vous pouvez annuler à tout moment depuis votre espace client, sans frais ni justification. L'annuel offre 20% de réduction supplémentaire." },
  { category: 'subscription', question: 'Mes crédits non utilisés sont-ils reportés ?', answer: 'Oui, avec les abonnements Pro et Business, vos crédits non utilisés sont reportés au mois suivant (dans la limite de 2 mois). Rien ne se perd !' },
  { category: 'quality', question: 'Que faire si le résultat ne me plaît pas ?', answer: "L'IA est créative ! Si un résultat ne vous convient pas, relancez simplement une génération avec les mêmes paramètres : vous obtiendrez une nouvelle proposition. Vous pouvez aussi ajuster l'intensité de transformation ou changer de style." },
  { category: 'usage', question: 'Quels types de photos fonctionnent le mieux ?', answer: "Pour de meilleurs résultats : prenez une photo bien éclairée, de face (pas d'angle extrême), et qui montre bien l'espace. Évitez les photos floues ou trop sombres. Les pièces vides ou peu meublées donnent plus de liberté à l'IA !" },
];

const faqEn = [
  { category: 'credits', question: 'How much does one image generation cost?', answer: '1 credit = 1 generation. It’s that simple! Each generation gives you a high‑quality image (1024×1024 px) you can download right away.' },
  { category: 'credits', question: 'Do my credits expire?', answer: 'Never! Your credits stay on your account indefinitely. Use them whenever you want, at your own pace—no pressure, no deadline.' },
  { category: 'quality', question: 'What is the quality of generated images?', answer: 'All images are high definition (1024×1024 px). You can also unlock HD+ (2048×2048) for just €4.99 per image—great for large prints!' },
  { category: 'usage', question: 'Can I use the images for my business?', answer: 'Absolutely! You own every image you generate. Use them for personal projects, your portfolio, clients, social media—no commercial restrictions.' },
  { category: 'quality', question: 'How do I pick the right style for my room?', answer: 'We offer 12 styles (Modern, Scandinavian, Japandi, Bohemian…). Pick the mood you want, then adjust transformation intensity. “Décor only” keeps your furniture and changes just the décor!' },
  { category: 'usage', question: 'How do I download my creations?', answer: "Easy! Once an image is generated, click ‘Download’—it saves to your device. You’ll also find everything in your dashboard history." },
  { category: 'payment', question: 'Which payment methods do you accept?', answer: 'All major cards (Visa, Mastercard, Amex), Apple Pay and Google Pay. Payments are secured by Stripe.' },
  { category: 'payment', question: 'Can I get a refund?', answer: 'Yes! If you have not used your credits, you can request a full refund within 14 days of purchase—just email us. Used credits are non‑refundable.' },
  { category: 'subscription', question: 'How does the subscription work?', answer: 'Credits are added automatically every month—fully transparent. Cancel anytime from your account, no fees. The annual plan saves an extra 20%.' },
  { category: 'subscription', question: 'Do unused credits roll over?', answer: 'Yes—with Pro and Business, unused credits roll to the next month (up to 2 months). Nothing is wasted!' },
  { category: 'quality', question: 'What if I don’t like the result?', answer: 'AI is creative! Rerun with the same settings for a new proposal, or tweak intensity or change style.' },
  { category: 'usage', question: 'Which photos work best?', answer: 'Well‑lit, straight‑on photos showing the whole space work best. Avoid blur and darkness. Empty or lightly furnished rooms give the AI more freedom.' },
];

const faqDe = [
  { category: 'credits', question: 'Was kostet eine Bildgenerierung?', answer: '1 Credit = 1 Generierung. So einfach! Jede Generierung liefert ein hochwertiges Bild (1024×1024 px) zum sofortigen Download.' },
  { category: 'credits', question: 'Verfallen meine Credits?', answer: 'Nie! Ihre Credits bleiben unbegrenzt gültig – in Ihrem Tempo, ohne Druck.' },
  { category: 'quality', question: 'Welche Bildqualität erhalte ich?', answer: 'Alle Bilder sind HD (1024×1024 px). Optional HD+ (2048×2048) für nur 4,99 € pro Bild – ideal für große Drucke.' },
  { category: 'usage', question: 'Darf ich die Bilder kommerziell nutzen?', answer: 'Ja! Sie besitzen Ihre Generierungen. Nutzung für Projekte, Portfolio, Kunden, Social Media – ohne kommerzielle Einschränkung.' },
  { category: 'quality', question: 'Wie wähle ich den passenden Stil?', answer: '12 Stile (Modern, Skandinavisch, Japandi, Boho …). Wählen Sie die gewünschte Stimmung und die Transformationsstärke. „Nur Deko“ behält Ihre Möbel.' },
  { category: 'usage', question: 'Wie lade ich Ergebnisse herunter?', answer: "Einfach: Nach der Generierung auf „Herunterladen“ klicken – fertig. Alles finden Sie auch in Ihrem Dashboard." },
  { category: 'payment', question: 'Welche Zahlungsarten?', answer: 'Gängige Karten (Visa, Mastercard, Amex), Apple Pay und Google Pay. Abwicklung über Stripe.' },
  { category: 'payment', question: 'Gibt es eine Rückerstattung?', answer: 'Ja! Ungenutzte Credits innerhalb von 14 Tagen nach Kauf – per E-Mail. Verbrauchte Credits sind nicht erstattungsfähig.' },
  { category: 'subscription', question: 'Wie funktioniert das Abo?', answer: 'Credits werden monatlich gutgeschrieben, transparent. Jederzeit im Konto kündbar. Jahresabo spart zusätzlich 20 %.' },
  { category: 'subscription', question: 'Werden ungenutzte Credits übertragen?', answer: 'Ja – bei Pro und Business werden Credits übernommen (bis zu 2 Monate). Nichts geht verloren.' },
  { category: 'quality', question: 'Was, wenn mir das Ergebnis nicht gefällt?', answer: 'Einfach erneut generieren oder Stil/Intensität anpassen – die KI liefert neue Vorschläge.' },
  { category: 'usage', question: 'Welche Fotos funktionieren am besten?', answer: 'Gut beleuchtet, frontal, ganzer Raum sichtbar. Vermeiden Sie Unschärfe und Dunkelheit. Weniger Möbel = mehr Freiheit für die KI.' },
];

function buildMessages(locale, packs, subs, faq, overrides) {
  const useCases =
    locale === 'fr'
      ? [
          { icon: '🏠', profile: 'Propriétaires', text: 'Testez plusieurs styles sur votre propre photo avant de vous engager dans des travaux. Comparez moderne, scandinave ou japandi en quelques secondes.', pack: 'Découverte' },
          { icon: '🏢', profile: 'Agents immobiliers', text: 'Meublez virtuellement vos biens vides pour aider les acheteurs à se projeter. Un complément au home staging physique, rapide et économique.', pack: 'Pro' },
          { icon: '🎨', profile: "Architectes d'intérieur", text: 'Montrez un avant/après instantané à vos clients pour valider la direction déco avant de réaliser le projet. Idéal en phase de proposition.', pack: 'Créatif' },
        ]
      : locale === 'en'
        ? [
            { icon: '🏠', profile: 'Homeowners', text: 'Try multiple styles on your own photo before committing to work. Compare modern, Scandinavian or Japandi in seconds.', pack: 'Discovery' },
            { icon: '🏢', profile: 'Real estate agents', text: 'Virtually furnish empty listings so buyers can project themselves—fast, affordable complement to physical staging.', pack: 'Pro' },
            { icon: '🎨', profile: 'Interior designers', text: 'Show clients instant before/after to validate the creative direction before execution—ideal in the proposal phase.', pack: 'Creative' },
          ]
        : [
            { icon: '🏠', profile: 'Eigentümer', text: 'Testen Sie mehrere Stile auf Ihrem eigenen Foto, bevor Sie in Umbauten investieren. Vergleichen Sie modern, skandinavisch oder Japandi in Sekunden.', pack: 'Entdeckerpaket' },
            { icon: '🏢', profile: 'Immobilienmakler', text: 'Möblieren Sie leere Objekte virtuell, damit Käufer sich besser vorstellen können – schnell und günstig ergänzend zum physischen Staging.', pack: 'Pro' },
            { icon: '🎨', profile: 'Innenarchitekten', text: 'Zeigen Sie Kunden sofort Vorher/Nachher, um die Richtung vor der Umsetzung abzustimmen – ideal in der Angebotsphase.', pack: 'Kreativ' },
          ];

  const P = overrides.PricingUI;

  return {
    Meta: overrides.Meta,
    Common: overrides.Common,
    LanguageSwitcher: overrides.LanguageSwitcher,
    Nav: overrides.Nav,
    Footer: overrides.Footer,
    Home: overrides.Home,
    Legal: overrides.Legal,
    PricingMeta: overrides.PricingMeta,
    Pricing: {
      creditPacks: packs,
      subscriptions: subs,
      faq,
      useCases,
      ...P,
    },
  };
}

const pricingUIFr = {
  popularBadge: '⭐ Le plus choisi',
  loading: 'Chargement...',
  creditsPerImage: '{credits} crédits • {price}€/image',
  savingsVsUnit: 'Vous économisez {amount}€ vs prix unitaire',
  packFeatures: ['{credits} transformations HD', 'Les 12 styles de déco', 'Téléchargement illimité', 'Usage commercial inclus', 'Crédits valables à vie'],
  subRecommended: 'Recommandé',
  subSavingsVsCredits: '-{pct}% vs crédits',
  perMonth: '/mois',
  creditsPerMonthShort: '{credits} crédits/mois • {price}€/image',
  billedAnnually: 'Facturé {total}€/an (au lieu de {full}€)',
  subFooter: 'Sans engagement • Annulable à tout moment',
  swipeHint: '← Glissez pour voir les offres →',
  paymentBy: 'Paiement par',
  trustBadges: [
    { key: 'stripe', label: 'Paiement sécurisé Stripe' },
    { key: 'credits', label: 'Crédits sans expiration' },
    { key: 'refund', label: 'Remboursement 14 jours' },
    { key: 'speed', label: 'Résultat en 10 secondes' },
  ],
  annualSavingsBanner: "💰 Économisez jusqu'à 192€/an avec l'annuel",
  monthlySavingsBanner: '✨ Jusqu\'à 60% moins cher que les packs crédits',
  upsellTitle: "Besoin régulier ? L'abonnement est jusqu'à 60% moins cher",
  upsellSubtitle: "Dès 0.32€/image avec un abonnement vs 0.70€ à l'unité",
  upsellCta: 'Voir les abonnements',
  howItWorksBadge: 'Simple comme 1-2-3',
  howItWorksTitle: 'Comment ça marche ?',
  howItWorksSteps: [
    { step: '1', emoji: '📸', title: 'Prenez une photo', desc: "Photographiez votre pièce avec votre smartphone. C'est tout." },
    { step: '2', emoji: '🎨', title: 'Choisissez un style', desc: '12 styles disponibles : Moderne, Scandinave, Japandi, Bohème...' },
    { step: '3', emoji: '✨', title: 'Admirez le résultat', desc: "En 10 secondes, découvrez votre pièce transformée par l'IA." },
  ],
  tryNow: 'Essayer maintenant',
  whoForBadge: 'Pour qui ?',
  whoForTitle: 'Un outil adapté à chaque besoin',
  packLabel: 'Pack {name}',
  compareBadge: 'Comparez',
  compareTitle: 'InstaDeco vs un décorateur traditionnel',
  compareRows: [
    { label: 'Prix par proposition', us: 'À partir de 0,70€', them: '200 - 500€' },
    { label: 'Délai', us: '10 secondes', them: '1 - 3 semaines' },
    { label: 'Nombre de styles', us: '12 styles illimités', them: '2 - 3 propositions' },
    { label: 'Disponibilité', us: '24h/24, 7j/7', them: 'Sur rendez-vous' },
    { label: 'Modifications', us: 'Instantanées', them: 'Allers-retours' },
  ],
  creditsVsSubBadge: 'Crédits vs Abonnement',
  creditsVsSubTitle: 'Quelle formule choisir ?',
  creditsVsSubSubtitle: 'Comparez les options pour trouver celle qui correspond à votre usage',
  creditPacksCardTitle: 'Packs de crédits',
  creditPacksCardSubtitle: 'Achat ponctuel',
  creditPacksBullets: ['Pas d\'engagement', 'Crédits valables à vie', 'Idéal projet ponctuel'],
  fromLabel: 'À partir de',
  perImage: '/ image',
  bestValue: 'Meilleure valeur',
  subscriptionCardTitle: 'Abonnement',
  subscriptionCardSubtitle: 'Mensuel ou annuel',
  subscriptionBullets: ['Jusqu\'à 60% d\'économie', 'Crédits renouvelés chaque mois', 'HD+ inclus (plan Pro+)', 'Annulable à tout moment'],
  faqBadge: "Tout ce qu'il faut savoir",
  faqTitle: 'Questions fréquentes',
  faqSubtitle: 'On répond à toutes vos questions pour que vous puissiez créer en toute sérénité',
  faqCtaTitle: 'Vous avez encore une question ?',
  faqCtaLink: 'Écrivez-nous, on répond sous 24h 💌',
  finalCtaTitle: 'Prêt à transformer votre intérieur ?',
  finalCtaSubtitle: "Rejoignez les milliers d'utilisateurs qui ont déjà redesigné leur espace avec InstaDeco AI.",
  finalCtaButton: 'Essayer gratuitement',
  finalCtaNote: "3 crédits offerts à l'inscription",
  heroBadge: 'Choisissez la formule qui vous convient',
  heroTitleLine1: 'Des tarifs simples,',
  heroTitleLine2: 'comme votre déco',
  heroSubtitle: "Crédits à l'unité ou abonnement mensuel.\nTrouvez la formule idéale pour vos projets déco.",
  toggleCredits: 'Packs de crédits',
  toggleSubscriptions: 'Abonnements',
  newBadge: 'NEW',
  monthly: 'Mensuel',
  annual: 'Annuel',
  annualDiscount: '-20%',
  statStyles: 'styles de déco',
  statRooms: 'types de pièces',
  statSpeed: 'par génération',
  socialProof20: '20+',
  socialProof8: '8',
  socialProof30: '~30s',
  subscriptionError: 'Erreur lors de la souscription',
  compareColUs: 'InstaDeco AI',
  compareColThem: 'Décorateur',
};

const pricingUIEn = {
  popularBadge: '⭐ Most chosen',
  loading: 'Loading...',
  creditsPerImage: '{credits} credits • €{price}/image',
  savingsVsUnit: 'You save €{amount} vs pay‑as‑you‑go',
  packFeatures: ['{credits} HD transformations', '12 décor styles', 'Unlimited downloads', 'Commercial use included', 'Credits never expire'],
  subRecommended: 'Recommended',
  subSavingsVsCredits: '-{pct}% vs credits',
  perMonth: '/month',
  creditsPerMonthShort: '{credits} credits/mo • €{price}/image',
  billedAnnually: 'Billed €{total}/yr (instead of €{full})',
  subFooter: 'No commitment • Cancel anytime',
  swipeHint: '← Swipe to see plans →',
  paymentBy: 'Pay with',
  trustBadges: [
    { key: 'stripe', label: 'Secure Stripe payments' },
    { key: 'credits', label: 'Credits never expire' },
    { key: 'refund', label: '14‑day refund' },
    { key: 'speed', label: 'Result in ~10 seconds' },
  ],
  annualSavingsBanner: '💰 Save up to €192/year with annual billing',
  monthlySavingsBanner: '✨ Up to 60% cheaper than credit packs',
  upsellTitle: 'Regular use? Subscriptions are up to 60% cheaper',
  upsellSubtitle: 'From €0.32/image with a subscription vs €0.70 pay‑as‑you‑go',
  upsellCta: 'See subscriptions',
  howItWorksBadge: 'Easy as 1‑2‑3',
  howItWorksTitle: 'How it works',
  howItWorksSteps: [
    { step: '1', emoji: '📸', title: 'Take a photo', desc: 'Snap your room with your phone. That’s it.' },
    { step: '2', emoji: '🎨', title: 'Pick a style', desc: '12 styles: Modern, Scandinavian, Japandi, Bohemian…' },
    { step: '3', emoji: '✨', title: 'Love the result', desc: 'In ~10 seconds, see your room transformed by AI.' },
  ],
  tryNow: 'Try it now',
  whoForBadge: 'Who is it for?',
  whoForTitle: 'A tool for every need',
  packLabel: '{name} pack',
  compareBadge: 'Compare',
  compareTitle: 'InstaDeco vs a traditional decorator',
  compareRows: [
    { label: 'Price per concept', us: 'From €0.70', them: '€200 – €500' },
    { label: 'Turnaround', us: '~10 seconds', them: '1 – 3 weeks' },
    { label: 'Number of styles', us: '12 unlimited styles', them: '2 – 3 concepts' },
    { label: 'Availability', us: '24/7', them: 'By appointment' },
    { label: 'Revisions', us: 'Instant', them: 'Back‑and‑forth' },
  ],
  creditsVsSubBadge: 'Credits vs subscription',
  creditsVsSubTitle: 'Which plan fits you?',
  creditsVsSubSubtitle: 'Compare options for your usage',
  creditPacksCardTitle: 'Credit packs',
  creditPacksCardSubtitle: 'One‑off purchase',
  creditPacksBullets: ['No commitment', 'Lifetime credits', 'Great for a one‑off project'],
  fromLabel: 'From',
  perImage: '/ image',
  bestValue: 'Best value',
  subscriptionCardTitle: 'Subscription',
  subscriptionCardSubtitle: 'Monthly or annual',
  subscriptionBullets: ['Save up to 60%', 'Credits renewed monthly', 'HD+ included (Pro+)', 'Cancel anytime'],
  faqBadge: 'Everything you need to know',
  faqTitle: 'FAQ',
  faqSubtitle: 'Clear answers so you can create with confidence',
  faqCtaTitle: 'Still have a question?',
  faqCtaLink: 'Email us—we reply within 24h 💌',
  finalCtaTitle: 'Ready to transform your space?',
  finalCtaSubtitle: 'Join thousands who already redesigned their interiors with InstaDeco AI.',
  finalCtaButton: 'Try for free',
  finalCtaNote: '3 free credits when you sign up',
  heroBadge: 'Pick the plan that fits you',
  heroTitleLine1: 'Simple pricing,',
  heroTitleLine2: 'like your décor',
  heroSubtitle: 'Pay‑as‑you‑go credits or a monthly subscription.\nFind the right fit for your projects.',
  toggleCredits: 'Credit packs',
  toggleSubscriptions: 'Subscriptions',
  newBadge: 'NEW',
  monthly: 'Monthly',
  annual: 'Annual',
  annualDiscount: '-20%',
  statStyles: 'décor styles',
  statRooms: 'room types',
  statSpeed: 'per generation',
  socialProof20: '20+',
  socialProof8: '8',
  socialProof30: '~30s',
  subscriptionError: 'Subscription error',
  compareColUs: 'InstaDeco AI',
  compareColThem: 'Traditional decorator',
};

const pricingUIDe = { ...pricingUIEn,
  popularBadge: '⭐ Am häufigsten gewählt',
  loading: 'Wird geladen...',
  creditsPerImage: '{credits} Credits • {price} €/Bild',
  savingsVsUnit: 'Sie sparen {amount} € gegenüber Einzelkauf',
  packFeatures: ['{credits} HD-Transformationen', '12 Deko-Stile', 'Unbegrenzte Downloads', 'Kommerzielle Nutzung inklusive', 'Credits verfallen nie'],
  subRecommended: 'Empfohlen',
  subSavingsVsCredits: '-{pct}% vs. Credits',
  perMonth: '/Monat',
  creditsPerMonthShort: '{credits} Credits/Mon. • {price} €/Bild',
  billedAnnually: 'Abrechnung {total} €/Jahr (statt {full} €)',
  subFooter: 'Ohne Bindung • Jederzeit kündbar',
  swipeHint: '← Wischen, um Angebote zu sehen →',
  paymentBy: 'Zahlung per',
  trustBadges: [
    { key: 'stripe', label: 'Sichere Stripe-Zahlungen' },
    { key: 'credits', label: 'Credits verfallen nie' },
    { key: 'refund', label: '14-Tage-Erstattung' },
    { key: 'speed', label: 'Ergebnis in ~10 Sekunden' },
  ],
  annualSavingsBanner: '💰 Bis zu 192 €/Jahr mit Jahresabo sparen',
  monthlySavingsBanner: '✨ Bis zu 60 % günstiger als Credit-Pakete',
  upsellTitle: 'Regelmäßiger Bedarf? Abos sind bis zu 60 % günstiger',
  upsellSubtitle: 'Ab 0,32 €/Bild mit Abo vs. 0,70 € pro Bild',
  upsellCta: 'Abos ansehen',
  howItWorksBadge: 'So einfach wie 1-2-3',
  howItWorksTitle: 'So funktioniert’s',
  howItWorksSteps: [
    { step: '1', emoji: '📸', title: 'Foto machen', desc: 'Fotografieren Sie den Raum mit dem Smartphone.' },
    { step: '2', emoji: '🎨', title: 'Stil wählen', desc: '12 Stile: Modern, Skandinavisch, Japandi, Boho…' },
    { step: '3', emoji: '✨', title: 'Ergebnis genießen', desc: 'In ~10 Sekunden sehen Sie die KI-Transformation.' },
  ],
  tryNow: 'Jetzt ausprobieren',
  whoForBadge: 'Für wen?',
  whoForTitle: 'Ein Tool für jeden Bedarf',
  packLabel: 'Paket {name}',
  compareBadge: 'Vergleich',
  compareTitle: 'InstaDeco vs. klassischer Dekorateur',
  compareRows: [
    { label: 'Preis pro Vorschlag', us: 'Ab 0,70 €', them: '200 – 500 €' },
    { label: 'Dauer', us: '~10 Sekunden', them: '1 – 3 Wochen' },
    { label: 'Anzahl Stile', us: '12 unbegrenzte Stile', them: '2 – 3 Vorschläge' },
    { label: 'Verfügbarkeit', us: '24/7', them: 'Nach Termin' },
    { label: 'Anpassungen', us: 'Sofort', them: 'Mehrere Runden' },
  ],
  creditsVsSubBadge: 'Credits vs. Abo',
  creditsVsSubTitle: 'Welche Option passt?',
  creditsVsSubSubtitle: 'Vergleichen Sie je nach Nutzung',
  creditPacksCardTitle: 'Credit-Pakete',
  creditPacksCardSubtitle: 'Einmalkauf',
  creditPacksBullets: ['Ohne Bindung', 'Lebenslange Credits', 'Ideal für ein Projekt'],
  fromLabel: 'Ab',
  perImage: '/ Bild',
  bestValue: 'Bestes Angebot',
  subscriptionCardTitle: 'Abo',
  subscriptionCardSubtitle: 'Monatlich oder jährlich',
  subscriptionBullets: ['Bis zu 60 % sparen', 'Credits monatlich erneuert', 'HD+ inklusive (Pro+)', 'Jederzeit kündbar'],
  faqBadge: 'Das Wichtigste',
  faqTitle: 'FAQ',
  faqSubtitle: 'Antworten, damit Sie entspannt loslegen',
  faqCtaTitle: 'Noch eine Frage?',
  faqCtaLink: 'Schreiben Sie uns – Antwort in 24h 💌',
  finalCtaTitle: 'Bereit, Ihren Raum zu verändern?',
  finalCtaSubtitle: 'Schließen Sie sich Tausenden an, die mit InstaDeco AI gestaltet haben.',
  finalCtaButton: 'Kostenlos testen',
  finalCtaNote: '3 Gratis-Credits bei Registrierung',
  heroBadge: 'Wählen Sie Ihr Paket',
  heroTitleLine1: 'Einfache Preise,',
  heroTitleLine2: 'wie Ihre Deko',
  heroSubtitle: 'Credits zum Kauf oder monatliches Abo.\nFinden Sie die passende Lösung.',
  toggleCredits: 'Credit-Pakete',
  toggleSubscriptions: 'Abonnements',
  monthly: 'Monatlich',
  annual: 'Jährlich',
  statStyles: 'Deko-Stile',
  statRooms: 'Raumtypen',
  statSpeed: 'pro Generierung',
  subscriptionError: 'Fehler beim Abo',
  compareColUs: 'InstaDeco AI',
  compareColThem: 'Klassischer Dekorateur',
};

const metaFr = {
  titleDefault: "InstaDeco AI - Décoration d'intérieur par Intelligence Artificielle",
  descriptionDefault:
    "Transformez vos pièces en rendus décorés professionnels en quelques secondes grâce à l'IA. Home staging virtuel, inspiration déco, visualisation avant travaux.",
  keywords: [
    'décoration intérieur IA',
    'home staging virtuel',
    'design intérieur intelligence artificielle',
    'transformation pièce IA',
    'décoration maison',
    'visualisation déco',
    'avant après décoration',
    'inspiration intérieur',
    'aménagement intérieur',
    'déco salon',
    'déco chambre',
    'style scandinave',
    'style moderne',
    'style bohème',
  ],
  ogImageAlt: "InstaDeco AI - Décoration d'intérieur par IA",
  twitterTitle: "InstaDeco AI - Décoration d'intérieur par IA",
  twitterDescription: "Transformez vos pièces en rendus décorés professionnels grâce à l'IA.",
};

const metaEn = {
  titleDefault: 'InstaDeco AI – AI interior design & virtual staging',
  descriptionDefault:
    'Turn any room into a pro décor render in seconds with AI. Virtual staging, inspiration, and before/after previews.',
  keywords: [
    'AI interior design',
    'virtual staging',
    'AI home decor',
    'room makeover AI',
    'before after interior',
    'Scandinavian style',
    'modern decor',
  ],
  ogImageAlt: 'InstaDeco AI – AI interior design',
  twitterTitle: 'InstaDeco AI – AI interior design',
  twitterDescription: 'Pro‑quality décor renders in seconds with AI.',
};

const metaDe = {
  titleDefault: 'InstaDeco AI – Innenarchitektur & virtuelles Staging mit KI',
  descriptionDefault:
    'Verwandeln Sie Ihre Räume in sekundenfertige, professionelle KI-Renderings. Virtuelles Staging, Inspiration und Vorher/Nachher.',
  keywords: [
    'KI Innenarchitektur',
    'virtuelles Staging',
    'KI Wohndeko',
    'Zimmer makeover KI',
    'Vorher Nachher Einrichtung',
    'skandinavischer Stil',
    'moderne Deko',
  ],
  ogImageAlt: 'InstaDeco AI – KI-Innenarchitektur',
  twitterTitle: 'InstaDeco AI – KI-Innenarchitektur',
  twitterDescription: 'Profi-Deko-Renderings in Sekunden mit KI.',
};

const commonFr = { skipToContent: 'Aller au contenu principal', credits: 'crédits', creditsAvailable: 'Crédits disponibles' };
const commonEn = { skipToContent: 'Skip to main content', credits: 'credits', creditsAvailable: 'Available credits' };
const commonDe = { skipToContent: 'Zum Hauptinhalt springen', credits: 'Credits', creditsAvailable: 'Verfügbare Credits' };

const langSwitcherFr = { label: 'Langue', fr: 'Français', en: 'English', de: 'Deutsch' };
const langSwitcherEn = { label: 'Language', fr: 'French', en: 'English', de: 'German' };
const langSwitcherDe = { label: 'Sprache', fr: 'Französisch', en: 'Englisch', de: 'Deutsch' };

const navFr = {
  generate: 'Générer',
  gallery: 'Galerie',
  examples: 'Exemples',
  quiz: 'Quiz',
  blog: 'Blog',
  pricing: 'Tarifs',
  pros: 'Pros',
  account: 'Mon Compte',
  login: 'Connexion',
  freeTrial: 'Essai gratuit',
  home: 'Accueil',
  openMenu: 'Ouvrir le menu',
  closeMenu: 'Fermer le menu',
};

const navEn = {
  generate: 'Generate',
  gallery: 'Gallery',
  examples: 'Examples',
  quiz: 'Quiz',
  blog: 'Blog',
  pricing: 'Pricing',
  pros: 'Pros',
  account: 'My account',
  login: 'Log in',
  freeTrial: 'Free trial',
  home: 'Home',
  openMenu: 'Open menu',
  closeMenu: 'Close menu',
};

const navDe = {
  generate: 'Generieren',
  gallery: 'Galerie',
  examples: 'Beispiele',
  quiz: 'Quiz',
  blog: 'Blog',
  pricing: 'Preise',
  pros: 'Profi',
  account: 'Mein Konto',
  login: 'Anmelden',
  freeTrial: 'Kostenlos testen',
  home: 'Start',
  openMenu: 'Menü öffnen',
  closeMenu: 'Menü schließen',
};

const footerFr = {
  tagline: 'Transformez vos intérieurs grâce à l\'intelligence artificielle.',
  productTitle: 'Produit',
  cityTitle: 'Par ville',
  stylesTitle: 'Styles',
  solutionsTitle: 'Solutions',
  legalTitle: 'Légal',
  followTitle: 'Suivez-nous',
  citySeoLine: 'Décoration intérieur IA disponible dans :',
  copyright: '© {year} InstaDeco AI. Fait avec',
  copyrightEnd: 'pour votre intérieur.',
  hubAllStyles: 'Tous les styles',
  hubAllRooms: 'Toutes les pièces',
  hubAllSolutions: 'Toutes les solutions',
  links: {
    generate: 'Générer une image',
    gallery: 'Galerie Before/After',
    quiz: 'Quiz : Mon style déco',
    examples: 'Exemples',
    pricing: 'Tarifs',
    blog: 'Blog',
    pro: 'Pour les Pros',
    architect: 'Architecte intérieur IA',
    paris: 'Déco Paris',
    lyon: 'Déco Lyon',
    geneve: 'Déco Genève',
    bruxelles: 'Déco Bruxelles',
    styleModerne: 'Style Moderne',
    styleScandinave: 'Style Scandinave',
    styleIndustriel: 'Style Industriel',
    styleJapandi: 'Style Japandi',
    styleBoheme: 'Style Bohème',
    solStaging: 'Home Staging Virtuel',
    solSimulator: 'Simulateur Déco',
    solSoftware: 'Logiciel Home Staging',
    solAvantApres: 'Avant / Après Déco',
    legalMentions: 'Mentions légales',
    legalPrivacy: 'Confidentialité',
    legalCgv: 'CGV',
    about: 'À propos',
    twitter: 'Twitter',
    instagram: 'Instagram',
    pinterest: 'Pinterest',
  },
};

const footerEn = {
  tagline: 'Transform your interiors with artificial intelligence.',
  productTitle: 'Product',
  cityTitle: 'By city',
  stylesTitle: 'Styles',
  solutionsTitle: 'Solutions',
  legalTitle: 'Legal',
  followTitle: 'Follow us',
  citySeoLine: 'AI interior design available in:',
  copyright: '© {year} InstaDeco AI. Made with',
  copyrightEnd: 'for your home.',
  hubAllStyles: 'All styles',
  hubAllRooms: 'All rooms',
  hubAllSolutions: 'All solutions',
  links: {
    generate: 'Generate an image',
    gallery: 'Before/After gallery',
    quiz: 'Quiz: my décor style',
    examples: 'Examples',
    pricing: 'Pricing',
    blog: 'Blog',
    pro: 'For professionals',
    architect: 'AI interior architect',
    paris: 'Paris décor',
    lyon: 'Lyon décor',
    geneve: 'Geneva décor',
    bruxelles: 'Brussels décor',
    styleModerne: 'Modern style',
    styleScandinave: 'Scandinavian style',
    styleIndustriel: 'Industrial style',
    styleJapandi: 'Japandi style',
    styleBoheme: 'Bohemian style',
    solStaging: 'Virtual home staging',
    solSimulator: 'Décor simulator',
    solSoftware: 'Home staging software',
    solAvantApres: 'Before / after décor',
    legalMentions: 'Legal notice',
    legalPrivacy: 'Privacy',
    legalCgv: 'Terms of sale',
    about: 'About',
    twitter: 'Twitter',
    instagram: 'Instagram',
    pinterest: 'Pinterest',
  },
};

const footerDe = {
  tagline: 'Verwandeln Sie Ihre Räume mit künstlicher Intelligenz.',
  productTitle: 'Produkt',
  cityTitle: 'Nach Stadt',
  stylesTitle: 'Stile',
  solutionsTitle: 'Lösungen',
  legalTitle: 'Rechtliches',
  followTitle: 'Folgen Sie uns',
  citySeoLine: 'KI-Innenarchitektur verfügbar in:',
  copyright: '© {year} InstaDeco AI. Gemacht mit',
  copyrightEnd: 'für Ihr Zuhause.',
  hubAllStyles: 'Alle Stile',
  hubAllRooms: 'Alle Räume',
  hubAllSolutions: 'Alle Lösungen',
  links: {
    generate: 'Bild generieren',
    gallery: 'Vorher/Nachher-Galerie',
    quiz: 'Quiz: Mein Deko-Stil',
    examples: 'Beispiele',
    pricing: 'Preise',
    blog: 'Blog',
    pro: 'Für Profis',
    architect: 'KI-Innenarchitekt',
    paris: 'Deko Paris',
    lyon: 'Deko Lyon',
    geneve: 'Deko Genf',
    bruxelles: 'Deko Brüssel',
    styleModerne: 'Moderner Stil',
    styleScandinave: 'Skandinavischer Stil',
    styleIndustriel: 'Industrial-Stil',
    styleJapandi: 'Japandi-Stil',
    styleBoheme: 'Boho-Stil',
    solStaging: 'Virtuelles Home Staging',
    solSimulator: 'Deko-Simulator',
    solSoftware: 'Home-Staging-Software',
    solAvantApres: 'Vorher / Nachher Deko',
    legalMentions: 'Impressum',
    legalPrivacy: 'Datenschutz',
    legalCgv: 'AGB / Kaufbedingungen',
    about: 'Über uns',
    twitter: 'Twitter',
    instagram: 'Instagram',
    pinterest: 'Pinterest',
  },
};

const homepageFAQFr = [
  { question: 'Comment fonctionne la décoration par IA d\'InstaDeco ?', answer: 'Prenez une photo de votre pièce, choisissez un style parmi plus de 20 options (Moderne, Scandinave, Japandi, Bohème…), et notre IA génère un rendu photoréaliste de votre pièce redécorée en ~30 secondes. Le résultat respecte la structure de votre espace (murs, fenêtres, volumes).' },
  { question: 'Combien coûte InstaDeco par rapport à un architecte d\'intérieur ?', answer: 'Un architecte d\'intérieur facture en moyenne 150€/h pour une consultation. Avec InstaDeco, chaque génération coûte à partir de 0,99€ et vous recevez un résultat comparable en 30 secondes au lieu de 2 semaines.' },
  { question: 'Quels styles de décoration sont disponibles ?', answer: 'InstaDeco propose 12 styles soigneusement sélectionnés : Moderne, Scandinave, Industriel, Bohème, Japandi, Minimaliste, Art Déco, Haussmannien, Mid-Century, Bord de mer, Luxe et une option « Garder mon style » pour améliorer votre pièce sans tout changer. Chaque style peut être appliqué à tous les types de pièces.' },
  { question: 'Puis-je utiliser InstaDeco pour du home staging virtuel ?', answer: 'Oui ! Le home staging virtuel est l\'un des cas d\'usage principaux. Agents immobiliers et propriétaires utilisent InstaDeco pour meubler virtuellement des biens vides et aider les acheteurs à se projeter, multipliant les visites et accélérant les ventes.' },
  { question: 'Les images générées sont-elles réalistes ?', answer: 'Nos rendus utilisent la technologie Flux.1 avec ControlNet, qui analyse la structure de votre pièce pour produire des résultats photoréalistes. Les images sont téléchargeables en HD et peuvent être partagées ou imprimées.' },
];

const homepageFAQEn = [
  { question: 'How does InstaDeco’s AI décor work?', answer: 'Take a photo of your room, pick one of 20+ styles (Modern, Scandinavian, Japandi, Bohemian…), and our AI returns a photorealistic redesign in ~30 seconds while preserving your layout (walls, windows, volumes).' },
  { question: 'How does pricing compare to an interior designer?', answer: 'Designers often charge around €150/hour for a consultation. With InstaDeco, generations start from €0.99 and you get a comparable visual in 30 seconds instead of two weeks.' },
  { question: 'Which décor styles are available?', answer: 'InstaDeco offers 12 curated styles: Modern, Scandinavian, Industrial, Bohemian, Japandi, Minimalist, Art Deco, Haussmannian, Mid‑century, Coastal, Luxury, plus “Keep my style” to refresh without a full overhaul. Every style works for any room type.' },
  { question: 'Can I use InstaDeco for virtual home staging?', answer: 'Yes! Virtual staging is a core use case. Agents and owners use InstaDeco to furnish empty listings so buyers can project themselves—boosting visits and speeding sales.' },
  { question: 'Are the generated images realistic?', answer: 'We use Flux.1 with ControlNet to respect your room’s structure and deliver photorealistic results. Images are downloadable in HD for sharing or print.' },
];

const homepageFAQDe = [
  { question: 'Wie funktioniert InstaDeco mit KI-Deko?', answer: 'Foto aufnehmen, einen von 20+ Stilen wählen (Modern, Skandinavisch, Japandi, Boho …) und unsere KI liefert in ~30 Sekunden ein fotorealistisches Redesign – Struktur (Wände, Fenster, Volumen) bleibt erhalten.' },
  { question: 'Was kostet InstaDeco im Vergleich zu einem Innenarchitekten?', answer: 'Innenarchitekten verrechnen oft ca. 150 €/h. Mit InstaDeco starten Generierungen ab 0,99 € – vergleichbares Ergebnis in 30 Sekunden statt zwei Wochen.' },
  { question: 'Welche Deko-Stile gibt es?', answer: '12 kuratierte Stile: Modern, Skandinavisch, Industrial, Boho, Japandi, Minimalistisch, Art déco, Haussmann, Mid-century, Küste, Luxus plus „Meinen Stil behalten“. Für jeden Raumtyp.' },
  { question: 'Virtuelles Home Staging?', answer: 'Ja! Makler und Eigentümer möblieren leere Objekte virtuell, damit Käufer sich besser vorstellen können – mehr Besuche, schnellere Verkäufe.' },
  { question: 'Sind die Bilder realistisch?', answer: 'Flux.1 mit ControlNet erfasst die Raumstruktur für fotorealistische Ergebnisse. HD-Download zum Teilen oder Drucken.' },
];

const homeFr = {
  metaTitle: "InstaDeco AI - Décoration d'Intérieur par IA | Résultat en 30 Secondes",
  metaDescription:
    "Transformez n'importe quelle pièce avec l'IA pour 0,99€. 20+ styles de décoration, résultat photoréaliste en ~30 secondes. Home staging virtuel, simulation déco avant/après. Essai gratuit.",
  faq: homepageFAQFr,
  stylesSectionTitle: 'Explorez nos styles de décoration',
  stylesSectionSubtitle: 'Chaque intérieur mérite un style qui lui correspond. Découvrez nos 20+ styles de décoration et trouvez celui qui vous ressemble.',
  viewAllStyles: 'Voir tous les styles',
  roomsSectionTitle: 'Décorez chaque pièce de votre intérieur',
  roomsSectionSubtitle: 'Salon, chambre, cuisine ou bureau : notre IA s\'adapte à chaque espace pour des résultats sur mesure.',
  allRooms: 'Tous les types de pièces',
  solutionsSectionTitle: 'Solutions de décoration par IA',
  solutionsSectionSubtitle: 'Que vous souhaitiez vendre votre bien, rénover ou simplement trouver l\'inspiration, InstaDeco a la solution.',
  solStagingTitle: 'Home Staging Virtuel',
  solStagingDesc: 'Meublez virtuellement vos biens pour accélérer la vente',
  solSimTitle: 'Simulateur Déco',
  solSimDesc: 'Testez votre déco avant d\'acheter le moindre meuble',
  solAvantTitle: 'Avant / Après',
  solAvantDesc: 'Visualisez la transformation instantanément',
  solSalonTitle: 'Décoration Salon',
  solSalonDesc: 'Idées et inspiration pour votre pièce à vivre',
  learnMore: 'En savoir plus',
  allSolutions: 'Toutes nos solutions',
  faqSectionTitle: 'Questions fréquentes',
  blogSectionTitle: 'Le blog décoration & IA',
  blogSectionSubtitle: 'Conseils déco, tendances, guides pratiques et actualités de l\'IA appliquée à la décoration intérieure.',
  readArticles: 'Lire nos articles',
  styleNames: {
    moderne: 'Moderne',
    scandinave: 'Scandinave',
    industriel: 'Industriel',
    boheme: 'Bohème',
    japandi: 'Japandi',
    minimaliste: 'Minimaliste',
  },
  styleDesc: {
    moderne: 'Lignes épurées, matériaux nobles et palette neutre',
    scandinave: 'Bois clair, blanc et tons chaleureux',
    industriel: 'Métal, brique et esprit loft',
    boheme: 'Textures riches, couleurs terracotta et plantes',
    japandi: 'Minimalisme japonais et design scandinave',
    minimaliste: "L'essentiel, rien de plus",
  },
  roomNames: {
    salon: 'Salon',
    chambre: 'Chambre',
    cuisine: 'Cuisine',
    'salle-de-bain': 'Salle de bain',
    bureau: 'Bureau',
    entree: 'Entrée',
  },
};

const homeEn = {
  metaTitle: 'InstaDeco AI – AI interior design in ~30 seconds',
  metaDescription:
    'Transform any room with AI from €0.99. 20+ styles, photorealistic results in ~30s. Virtual staging and before/after previews. Free trial.',
  faq: homepageFAQEn,
  stylesSectionTitle: 'Explore our décor styles',
  stylesSectionSubtitle: 'Every home deserves a style that fits. Browse 20+ curated looks and find yours.',
  viewAllStyles: 'See all styles',
  roomsSectionTitle: 'Design every room',
  roomsSectionSubtitle: 'Living room, bedroom, kitchen or office—our AI adapts to each space.',
  allRooms: 'All room types',
  solutionsSectionTitle: 'AI décor solutions',
  solutionsSectionSubtitle: 'Selling, renovating, or just exploring ideas—InstaDeco has you covered.',
  solStagingTitle: 'Virtual home staging',
  solStagingDesc: 'Virtually furnish listings to sell faster',
  solSimTitle: 'Décor simulator',
  solSimDesc: 'Try looks before buying a single piece',
  solAvantTitle: 'Before / after',
  solAvantDesc: 'See the transformation instantly',
  solSalonTitle: 'Living room décor',
  solSalonDesc: 'Ideas and inspiration for your main living space',
  learnMore: 'Learn more',
  allSolutions: 'All solutions',
  faqSectionTitle: 'Frequently asked questions',
  blogSectionTitle: 'Décor & AI blog',
  blogSectionSubtitle: 'Tips, trends, guides, and news on AI for interior design.',
  readArticles: 'Read articles',
  styleNames: {
    moderne: 'Modern',
    scandinave: 'Scandinavian',
    industriel: 'Industrial',
    boheme: 'Bohemian',
    japandi: 'Japandi',
    minimaliste: 'Minimalist',
  },
  styleDesc: {
    moderne: 'Clean lines, refined materials, neutral palette',
    scandinave: 'Light wood, white, warm tones',
    industriel: 'Metal, brick, loft vibe',
    boheme: 'Rich textures, terracotta, plants',
    japandi: 'Japanese calm meets Scandinavian simplicity',
    minimaliste: 'Only the essentials',
  },
  roomNames: {
    salon: 'Living room',
    chambre: 'Bedroom',
    cuisine: 'Kitchen',
    'salle-de-bain': 'Bathroom',
    bureau: 'Office',
    entree: 'Entryway',
  },
};

const homeDe = {
  metaTitle: 'InstaDeco AI – KI-Innenarchitektur in ~30 Sekunden',
  metaDescription:
    'Verwandeln Sie jeden Raum mit KI ab 0,99 €. 20+ Stile, fotorealistisch in ~30 s. Virtuelles Staging und Vorher/Nachher. Kostenlos testen.',
  faq: homepageFAQDe,
  stylesSectionTitle: 'Unsere Deko-Stile entdecken',
  stylesSectionSubtitle: 'Jedes Zuhause verdient den passenden Stil. Über 20 Looks – finden Sie Ihren.',
  viewAllStyles: 'Alle Stile',
  roomsSectionTitle: 'Jeden Raum gestalten',
  roomsSectionSubtitle: 'Wohnzimmer, Schlafzimmer, Küche oder Büro – unsere KI passt sich an.',
  allRooms: 'Alle Raumtypen',
  solutionsSectionTitle: 'KI-Deko-Lösungen',
  solutionsSectionSubtitle: 'Verkauf, Renovierung oder Inspiration – InstaDeco hilft.',
  solStagingTitle: 'Virtuelles Home Staging',
  solStagingDesc: 'Leere Objekte virtuell möblieren',
  solSimTitle: 'Deko-Simulator',
  solSimDesc: 'Looks testen, bevor Sie kaufen',
  solAvantTitle: 'Vorher / Nachher',
  solAvantDesc: 'Transformation sofort sehen',
  solSalonTitle: 'Wohnzimmer-Deko',
  solSalonDesc: 'Ideen für Ihren Hauptwohnraum',
  learnMore: 'Mehr erfahren',
  allSolutions: 'Alle Lösungen',
  faqSectionTitle: 'Häufige Fragen',
  blogSectionTitle: 'Blog Deko & KI',
  blogSectionSubtitle: 'Tipps, Trends und News zu KI und Innenarchitektur.',
  readArticles: 'Artikel lesen',
  styleNames: {
    moderne: 'Modern',
    scandinave: 'Skandinavisch',
    industriel: 'Industrial',
    boheme: 'Boho',
    japandi: 'Japandi',
    minimaliste: 'Minimalistisch',
  },
  styleDesc: {
    moderne: 'Klare Linien, edle Materialien, neutrale Palette',
    scandinave: 'Helles Holz, Weiß, warme Töne',
    industriel: 'Metall, Ziegel, Loft-Flair',
    boheme: 'Reiche Texturen, Terrakotta, Pflanzen',
    japandi: 'Japanische Ruhe trifft skandinavische Schlichtheit',
    minimaliste: 'Nur das Wesentliche',
  },
  roomNames: {
    salon: 'Wohnzimmer',
    chambre: 'Schlafzimmer',
    cuisine: 'Küche',
    'salle-de-bain': 'Bad',
    bureau: 'Büro',
    entree: 'Eingang',
  },
};

const homeLandingFr = {
  howItWorks: {
    badgeEmoji: '🚀',
    badgeText: 'Comment ça marche',
    title: '3 étapes simples',
    subtitle: "Transformez n'importe quelle pièce en quelques clics",
    stepPrefix: 'ÉTAPE {number}',
    steps: [
      {
        number: '01',
        title: 'Prenez une photo',
        description:
          "Photographiez votre pièce ou uploadez une image existante. L'IA fonctionne avec n'importe quelle pièce.",
        icon: '📸',
      },
      {
        number: '02',
        title: 'Choisissez un style',
        description:
          'Sélectionnez parmi 20+ styles déco : Moderne, Scandinave, Japandi, Bohème, Industriel...',
        icon: '🎨',
      },
      {
        number: '03',
        title: 'Lancez la magie',
        description:
          'Notre IA transforme votre pièce en moins de 30 secondes. Téléchargez le résultat en HD !',
        icon: '✨',
      },
    ],
  },
  gallery: {
    badgeEmoji: '🖼️',
    badgeText: 'Galerie',
    title: 'Avant / Après impressionnants',
    subtitle: 'Survolez les images pour voir la transformation',
    before: 'Avant',
    after: 'Après',
    styleLine: 'Style {style}',
    altBefore: '{room} — avant',
    altAfter: '{room} après — style {style}',
    items: [
      {
        id: 1,
        before: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop',
        after: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&h=400&fit=crop',
        styleSlug: 'moderne',
        roomSlug: 'salon',
      },
      {
        id: 2,
        before: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop',
        after: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&h=400&fit=crop',
        styleSlug: 'scandinave',
        roomSlug: 'chambre',
      },
      {
        id: 3,
        before: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&h=400&fit=crop',
        after: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop',
        styleSlug: 'minimaliste',
        roomSlug: 'cuisine',
      },
      {
        id: 4,
        before: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&h=400&fit=crop',
        after: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop',
        styleSlug: 'industriel',
        roomSlug: 'bureau',
      },
      {
        id: 5,
        before: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=600&h=400&fit=crop',
        after: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&h=400&fit=crop',
        styleSlug: 'boheme',
        roomSlug: 'salon',
      },
      {
        id: 6,
        before: 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=600&h=400&fit=crop',
        after: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&h=400&fit=crop',
        styleSlug: 'japandi',
        roomSlug: 'chambre',
      },
    ],
  },
  features: {
    badgeEmoji: '✨',
    badgeText: 'Pourquoi nous choisir',
    titleStart: 'Une expérience pensée pour ',
    titleHighlight: 'vous',
    subtitle: 'Une technologie de pointe au service de votre créativité.',
    items: [
      {
        title: '30 Secondes Chrono',
        description:
          'Un décorateur prend 2 semaines. Vous obtenez un rendu photoréaliste en 30 secondes — résultat comparable, 150x plus rapide.',
      },
      {
        title: 'Votre Pièce, Pas un Template',
        description:
          "L'IA analyse VOTRE espace (murs, fenêtres, volumes) pour un résultat sur mesure. Pas un catalogue générique.",
      },
      {
        title: '0,99 € au lieu de 150 €/h',
        description:
          "Un architecte d'intérieur coûte 150 €/h minimum. InstaDeco vous donne un résultat comparable pour moins d'un café.",
      },
      {
        title: '20+ Styles, 0 Limite',
        description:
          'Scandinave, Japandi, Haussmannien, Chalet Alpin... Testez tous les styles en un clic. Chez un déco, c\'est 3 propositions max.',
      },
      {
        title: 'Photo → Résultat. C\'est tout.',
        description:
          "Pas de logiciel 3D complexe. Prenez une photo, choisissez un style, et admirez. Votre grand-mère pourrait le faire.",
      },
      {
        title: 'HD Prêt à Imprimer',
        description:
          'Téléchargez en haute définition, partagez sur les réseaux, envoyez à vos artisans. Vos images, vos droits.',
      },
    ],
  },
  stats: {
    headline: "Le résultat d'un architecte d'intérieur • Le prix d'un café",
    deal: '→ 0,99 €',
    rows: [
      { target: 12, suffix: '+', label: 'styles de décoration', highlight: false },
      { target: 150, suffix: '', prefix: '', label: '€/h chez un déco', highlight: true },
      { target: 30, suffix: 's', label: 'secondes par design', highlight: false },
      { target: 8, suffix: '', label: 'types de pièces', highlight: false },
    ],
  },
  testimonials: {
    badgeEmoji: '💡',
    badgeText: "Cas d'usage",
    title: 'Pour qui est fait InstaDeco ?',
    subtitle: 'Découvrez comment chaque profil utilise la déco par IA',
    prevAria: 'Précédent',
    nextAria: 'Suivant',
    dotAria: "Aller au cas d'usage {n}",
    cases: [
      {
        icon: '🏠',
        profile: 'Propriétaires',
        role: 'Visualiser avant travaux',
        content:
          'Comparez plusieurs styles sur votre propre photo avant de vous lancer dans des travaux. Moderne, scandinave, japandi… le résultat s\'affiche en ~30 secondes.',
      },
      {
        icon: '🏢',
        profile: 'Agents immobiliers',
        role: 'Home staging virtuel',
        content:
          'Meublez virtuellement vos biens vides pour aider les acheteurs à se projeter. Un complément rapide et économique au home staging physique.',
      },
      {
        icon: '🎨',
        profile: "Architectes d'intérieur",
        role: 'Propositions rapides',
        content:
          'Montrez un avant/après instantané à vos clients pour valider une direction déco avant de réaliser le projet complet.',
      },
    ],
  },
  finalCta: {
    badge: 'Lancez-vous dès maintenant',
    title: "L'intérieur de vos rêves pour 0,99 €",
    line1: 'Un décorateur facture 150 €/h et prend 2 semaines.',
    line2: 'InstaDeco vous donne le même résultat en 30 secondes.',
    cta: 'Relooker ma pièce gratuitement',
    footnote:
      "✨ 3 crédits offerts à l'inscription • Pas de carte requise • Résultat en 30 secondes",
  },
  beforeAfter: {
    slides: [
      {
        id: 'chambre-boheme',
        before: '/images/before-chambre-1.jpg',
        after: '/images/after-chambre-1.jpg',
        title: 'Chambre → Style Bohème Moderne',
        description: 'Sol, meubles et décoration transformés par notre IA',
      },
    ],
    before: 'Avant',
    after: 'Après IA ✨',
    altBefore: 'Avant décoration',
    altAfter: 'Après décoration IA',
    prevAria: 'Précédent',
    nextAria: 'Suivant',
    dotAria: 'Voir transformation {n}',
  },
  toast: {
    caption: 'Activité récente',
    closeAria: 'Fermer',
    templates: [
      'Découvrez : {room} en style {style}',
      'Tendance : transformez votre {room} en {style}',
      'Le style {style} est populaire en ce moment',
      'Idée déco : {room} à redécouvrir',
    ],
  },
};

const homeLandingEn = {
  howItWorks: {
    badgeEmoji: '🚀',
    badgeText: 'How it works',
    title: '3 simple steps',
    subtitle: 'Transform any room in a few clicks',
    stepPrefix: 'STEP {number}',
    steps: [
      {
        number: '01',
        title: 'Take a photo',
        description:
          'Snap your room or upload an existing image. The AI works with any space.',
        icon: '📸',
      },
      {
        number: '02',
        title: 'Pick a style',
        description:
          'Choose from 20+ décor styles: Modern, Scandinavian, Japandi, Bohemian, Industrial…',
        icon: '🎨',
      },
      {
        number: '03',
        title: 'Let the magic run',
        description:
          'Our AI redesigns your room in under 30 seconds. Download the result in HD!',
        icon: '✨',
      },
    ],
  },
  gallery: {
    badgeEmoji: '🖼️',
    badgeText: 'Gallery',
    title: 'Stunning before / after',
    subtitle: 'Hover the images to see the transformation',
    before: 'Before',
    after: 'After',
    styleLine: '{style} style',
    altBefore: '{room} — before',
    altAfter: '{room} after — {style} style',
    items: homeLandingFr.gallery.items,
  },
  features: {
    badgeEmoji: '✨',
    badgeText: 'Why choose us',
    titleStart: 'An experience designed for ',
    titleHighlight: 'you',
    subtitle: 'Cutting-edge technology at the service of your creativity.',
    items: [
      {
        title: '30 seconds flat',
        description:
          'A decorator needs two weeks. You get a photorealistic render in 30 seconds—comparable quality, roughly 150× faster.',
      },
      {
        title: 'Your room, not a template',
        description:
          'The AI reads YOUR space (walls, windows, volumes) for a tailored result—not a generic catalogue look.',
      },
      {
        title: '€0.99 instead of €150/h',
        description:
          'Interior designers often start around €150/h. InstaDeco delivers a comparable visual for less than a coffee.',
      },
      {
        title: '20+ styles, zero limits',
        description:
          'Scandinavian, Japandi, Haussmann, Alpine chalet… try every look in one click. With a decorator, you get three moodboards max.',
      },
      {
        title: 'Photo → result. That’s it.',
        description:
          'No complex 3D software. Take a photo, pick a style, enjoy. Your grandmother could do it.',
      },
      {
        title: 'Print-ready HD',
        description:
          'Download in high definition, share on social, send to trades. Your images, your rights.',
      },
    ],
  },
  stats: {
    headline: 'Interior-designer results • coffee-shop pricing',
    deal: '→ €0.99',
    rows: [
      { target: 12, suffix: '+', label: 'décor styles', highlight: false },
      { target: 150, suffix: '', prefix: '', label: '€/h with a decorator', highlight: true },
      { target: 30, suffix: 's', label: 'per design', highlight: false },
      { target: 8, suffix: '', label: 'room types', highlight: false },
    ],
  },
  testimonials: {
    badgeEmoji: '💡',
    badgeText: 'Use cases',
    title: 'Who is InstaDeco for?',
    subtitle: 'See how every profile uses AI décor',
    prevAria: 'Previous',
    nextAria: 'Next',
    dotAria: 'Go to use case {n}',
    cases: [
      {
        icon: '🏠',
        profile: 'Homeowners',
        role: 'Visualise before renovating',
        content:
          'Compare several styles on your own photo before committing to work. Modern, Scandinavian, Japandi… see results in ~30 seconds.',
      },
      {
        icon: '🏢',
        profile: 'Real-estate agents',
        role: 'Virtual home staging',
        content:
          'Virtually furnish empty listings so buyers can project themselves—a fast, affordable complement to physical staging.',
      },
      {
        icon: '🎨',
        profile: 'Interior designers',
        role: 'Quick proposals',
        content:
          'Show clients an instant before/after to validate the creative direction before you execute the full project.',
      },
    ],
  },
  finalCta: {
    badge: 'Start now',
    title: 'The home of your dreams for €0.99',
    line1: 'A decorator bills ~€150/h and needs two weeks.',
    line2: 'InstaDeco gives you a comparable result in 30 seconds.',
    cta: 'Redesign my room for free',
    footnote: '✨ 3 free credits on signup • No card required • Results in ~30 seconds',
  },
  beforeAfter: {
    slides: [
      {
        id: 'chambre-boheme',
        before: '/images/before-chambre-1.jpg',
        after: '/images/after-chambre-1.jpg',
        title: 'Bedroom → modern Bohemian style',
        description: 'Floor, furniture and décor transformed by our AI',
      },
    ],
    before: 'Before',
    after: 'After AI ✨',
    altBefore: 'Before décor',
    altAfter: 'After AI décor',
    prevAria: 'Previous',
    nextAria: 'Next',
    dotAria: 'View transformation {n}',
  },
  toast: {
    caption: 'Recent activity',
    closeAria: 'Close',
    templates: [
      'Discover: {room} in {style} style',
      'Trending: turn your {room} into {style}',
      '{style} is trending right now',
      'Interior idea: rethink your {room}',
    ],
  },
};

const homeLandingDe = {
  howItWorks: {
    badgeEmoji: '🚀',
    badgeText: 'So funktioniert’s',
    title: '3 einfache Schritte',
    subtitle: 'Verwandeln Sie jeden Raum mit wenigen Klicks',
    stepPrefix: 'SCHRITT {number}',
    steps: [
      {
        number: '01',
        title: 'Foto aufnehmen',
        description:
          'Fotografieren Sie Ihren Raum oder laden Sie ein vorhandenes Bild hoch. Die KI funktioniert mit jedem Raum.',
        icon: '📸',
      },
      {
        number: '02',
        title: 'Stil wählen',
        description:
          'Wählen Sie aus 20+ Deko-Stilen: Modern, Skandinavisch, Japandi, Boho, Industrial …',
        icon: '🎨',
      },
      {
        number: '03',
        title: 'Magie starten',
        description:
          'Unsere KI gestaltet Ihren Raum in unter 30 Sekunden um. Laden Sie das Ergebnis in HD herunter!',
        icon: '✨',
      },
    ],
  },
  gallery: {
    badgeEmoji: '🖼️',
    badgeText: 'Galerie',
    title: 'Beeindruckendes Vorher / Nachher',
    subtitle: 'Mit der Maus über die Bilder fahren, um die Transformation zu sehen',
    before: 'Vorher',
    after: 'Nachher',
    styleLine: 'Stil {style}',
    altBefore: '{room} — vorher',
    altAfter: '{room} nachher — Stil {style}',
    items: homeLandingFr.gallery.items,
  },
  features: {
    badgeEmoji: '✨',
    badgeText: 'Warum wir',
    titleStart: 'Ein Erlebnis, das für ',
    titleHighlight: 'Sie',
    subtitle: 'Spitzentechnologie für Ihre Kreativität.',
    items: [
      {
        title: '30 Sekunden',
        description:
          'Ein Dekorateur braucht zwei Wochen. Sie erhalten ein fotorealistisches Rendering in 30 Sekunden – vergleichbare Qualität, viel schneller.',
      },
      {
        title: 'Ihr Raum, keine Vorlage',
        description:
          'Die KI liest IHREN Raum (Wände, Fenster, Volumen) für ein massgeschneidertes Ergebnis – kein generischer Kataloglook.',
      },
      {
        title: '0,99 € statt 150 €/h',
        description:
          'Innenarchitekten verrechnen oft ab 150 €/h. InstaDeco liefert ein vergleichbares Bild für weniger als einen Kaffee.',
      },
      {
        title: '20+ Stile, keine Grenzen',
        description:
          'Skandinavisch, Japandi, Haussmann, Chalet … probieren Sie jeden Look mit einem Klick. Beim Dekorateur gibt es höchstens drei Varianten.',
      },
      {
        title: 'Foto → Ergebnis. Fertig.',
        description:
          'Keine komplexe 3D-Software. Foto machen, Stil wählen, fertig. Ihre Grossmutter könnte es bedienen.',
      },
      {
        title: 'HD, druckbereit',
        description:
          'In hoher Auflösung herunterladen, in sozialen Netzwerken teilen, an Handwerker senden. Ihre Bilder, Ihre Rechte.',
      },
    ],
  },
  stats: {
    headline: 'Ergebnis wie vom Innenarchitekten • Preis wie beim Kaffee',
    deal: '→ 0,99 €',
    rows: [
      { target: 12, suffix: '+', label: 'Deko-Stile', highlight: false },
      { target: 150, suffix: '', prefix: '', label: '€/h beim Dekorateur', highlight: true },
      { target: 30, suffix: 's', label: 'pro Design', highlight: false },
      { target: 8, suffix: '', label: 'Raumtypen', highlight: false },
    ],
  },
  testimonials: {
    badgeEmoji: '💡',
    badgeText: 'Anwendungsfälle',
    title: 'Für wen ist InstaDeco?',
    subtitle: 'So nutzen verschiedene Profile KI-Deko',
    prevAria: 'Zurück',
    nextAria: 'Weiter',
    dotAria: 'Zu Anwendungsfall {n}',
    cases: [
      {
        icon: '🏠',
        profile: 'Eigentümer',
        role: 'Vor dem Umbau visualisieren',
        content:
          'Vergleichen Sie mehrere Stile auf Ihrem eigenen Foto, bevor Sie investieren. Modern, skandinavisch, Japandi … Ergebnis in ~30 Sekunden.',
      },
      {
        icon: '🏢',
        profile: 'Immobilienmakler',
        role: 'Virtuelles Home Staging',
        content:
          'Leere Objekte virtuell möblieren, damit Käufer sich besser vorstellen können – schnell und günstig ergänzend zum physischen Staging.',
      },
      {
        icon: '🎨',
        profile: 'Innenarchitekten',
        role: 'Schnelle Varianten',
        content:
          'Zeigen Sie Kunden sofort Vorher/Nachher, um die Richtung vor der kompletten Umsetzung abzustimmen.',
      },
    ],
  },
  finalCta: {
    badge: 'Jetzt starten',
    title: 'Ihr Trauminterieur für 0,99 €',
    line1: 'Ein Dekorateur verrechnet ca. 150 €/h und braucht zwei Wochen.',
    line2: 'InstaDeco liefert ein vergleichbares Ergebnis in 30 Sekunden.',
    cta: 'Meinen Raum kostenlos neu gestalten',
    footnote: '✨ 3 Gratis-Credits bei Registrierung • Keine Karte nötig • Ergebnis in ~30 Sekunden',
  },
  beforeAfter: {
    slides: [
      {
        id: 'chambre-boheme',
        before: '/images/before-chambre-1.jpg',
        after: '/images/after-chambre-1.jpg',
        title: 'Schlafzimmer → moderner Boho-Stil',
        description: 'Boden, Möbel und Deko von unserer KI transformiert',
      },
    ],
    before: 'Vorher',
    after: 'Nachher KI ✨',
    altBefore: 'Vorher Deko',
    altAfter: 'Nachher KI-Deko',
    prevAria: 'Zurück',
    nextAria: 'Weiter',
    dotAria: 'Transformation {n} anzeigen',
  },
  toast: {
    caption: 'Aktuelle Highlights',
    closeAria: 'Schliessen',
    templates: [
      'Entdecken: {room} im Stil {style}',
      'Trend: verwandeln Sie Ihr {room} in {style}',
      'Der Stil {style} ist gerade gefragt',
      'Deko-Idee: {room} neu entdecken',
    ],
  },
};

const legalFr = {
  frenchBodyNotice:
    'Les textes juridiques ci-dessous sont fournis en français (version faisant foi). Une traduction complète sera publiée prochainement.',
};
const legalEn = {
  frenchBodyNotice:
    'The legal texts below are provided in French (authoritative version). A full translation will be published soon.',
};
const legalDe = {
  frenchBodyNotice:
    'Die folgenden Rechtstexte sind auf Französisch (maßgebende Fassung). Eine vollständige Übersetzung folgt in Kürze.',
};

const pricingMetaFr = {
  title: 'Tarifs & Crédits - Décoration IA sans Abonnement | InstaDeco AI',
  description:
    'Achetez des crédits sans abonnement pour transformer vos pièces par IA. À partir de 9,90€ pour 10 générations HD. Crédits sans expiration. Paiement sécurisé Stripe.',
  ogTitle: 'Tarifs InstaDeco AI - Décoration IA à partir de 9,90€',
  ogDescription: "Pas d'abonnement, pas de surprise. Achetez des crédits et transformez vos pièces par IA quand vous voulez.",
  twitterTitle: 'Tarifs InstaDeco AI - À partir de 9,90€',
  twitterDescription: 'Crédits sans abonnement pour décorer par IA. Paiement sécurisé.',
  breadcrumb: 'Tarifs',
  breadcrumbHome: 'Accueil',
};

const pricingMetaEn = {
  title: 'Pricing & credits – AI décor without a subscription | InstaDeco AI',
  description:
    'Buy credits with no subscription to transform rooms with AI. From €9.90 for 10 HD generations. Credits never expire. Secure Stripe payments.',
  ogTitle: 'InstaDeco AI pricing – AI décor from €9.90',
  ogDescription: 'No subscription surprises—buy credits and generate whenever you want.',
  twitterTitle: 'InstaDeco AI pricing – from €9.90',
  twitterDescription: 'Credits without a subscription. Secure payments.',
  breadcrumb: 'Pricing',
  breadcrumbHome: 'Home',
};

const pricingMetaDe = {
  title: 'Preise & Credits – KI-Deko ohne Abo | InstaDeco AI',
  description:
    'Credits ohne Abo kaufen und Räume per KI gestalten. Ab 9,90 € für 10 HD-Generierungen. Credits verfallen nicht. Sichere Stripe-Zahlung.',
  ogTitle: 'InstaDeco AI Preise – KI-Deko ab 9,90 €',
  ogDescription: 'Kein Abo-Zwang – Credits kaufen und jederzeit generieren.',
  twitterTitle: 'InstaDeco AI Preise – ab 9,90 €',
  twitterDescription: 'Credits ohne Abo. Sichere Zahlung.',
  breadcrumb: 'Preise',
  breadcrumbHome: 'Start',
};

const heroFr = {
  badge: 'Votre architecte d\'intérieur à 0,99 €',
  titleLine1: 'Redécorez votre intérieur en style',
  description:
    'Un décorateur coûte 150 €/h. InstaDeco : 0,99 € en 30 secondes. Résultat de designer, sans travaux, sans rendez-vous.',
  cta: 'Relooker ma pièce gratuitement',
  photosCount: '10 000+ photos',
  photosSub: 'déjà transformées',
  ratingLabel: 'Top qualité',
  floatTitle: 'IA Générative',
  floatSubtitle: 'Résultat en 30s',
  avatarAlt: 'Utilisateur {n}',
  styleKeys: ['moderne', 'scandinave', 'boheme', 'japandi', 'industriel'],
};

const heroEn = {
  badge: 'Your interior stylist from €0.99',
  titleLine1: 'Redesign your space in style',
  description:
    'A decorator costs €150/h. InstaDeco: €0.99 in 30 seconds. Designer‑level looks—no renovation, no appointment.',
  cta: 'Redesign my room for free',
  photosCount: '10,000+ photos',
  photosSub: 'already transformed',
  ratingLabel: 'Top quality',
  floatTitle: 'Generative AI',
  floatSubtitle: 'Results in ~30s',
  avatarAlt: 'User {n}',
  styleKeys: ['moderne', 'scandinave', 'boheme', 'japandi', 'industriel'],
};

const legalMetaFr = {
  mentionsTitle: 'Mentions Légales | InstaDeco AI',
  mentionsDescription:
    "Informations légales sur InstaDeco AI — éditeur, hébergeur et conditions d'utilisation du service.",
  privacyTitle: 'Politique de Confidentialité | InstaDeco AI',
  privacyDescription:
    'Protection de vos données personnelles sur InstaDeco AI — conforme à la nLPD suisse et au RGPD.',
  cgvTitle: 'Conditions Générales de Vente (CGV) | InstaDeco AI',
  cgvDescription:
    'Conditions générales de vente du service InstaDeco AI — crédits, paiements, droit de rétractation et utilisation du service.',
};

const legalMetaEn = {
  mentionsTitle: 'Legal notice | InstaDeco AI',
  mentionsDescription: 'Legal information about InstaDeco AI — publisher, hosting and terms of use.',
  privacyTitle: 'Privacy policy | InstaDeco AI',
  privacyDescription: 'How InstaDeco AI protects your personal data — aligned with Swiss nFADP and EU GDPR.',
  cgvTitle: 'Terms of sale (GTC) | InstaDeco AI',
  cgvDescription: 'General terms of sale for InstaDeco AI — credits, payments, withdrawal and use of the service.',
};

const legalMetaDe = {
  mentionsTitle: 'Impressum | InstaDeco AI',
  mentionsDescription: 'Rechtliche Informationen zu InstaDeco AI — Anbieter, Hosting und Nutzungsbedingungen.',
  privacyTitle: 'Datenschutzerklärung | InstaDeco AI',
  privacyDescription: 'Schutz Ihrer personenbezogenen Daten bei InstaDeco AI — Schweizer revDSG und EU-DSGVO.',
  cgvTitle: 'Allgemeine Geschäftsbedingungen (AGB) | InstaDeco AI',
  cgvDescription: 'AGB für InstaDeco AI — Credits, Zahlungen, Widerruf und Nutzung des Dienstes.',
};

const heroDe = {
  badge: 'Ihr Interior-Stylist ab 0,99 €',
  titleLine1: 'Gestalten Sie Ihren Raum im passenden Stil',
  description:
    'Ein Dekorateur: 150 €/h. InstaDeco: 0,99 € in 30 Sekunden. Designer-Look ohne Umbau und ohne Termin.',
  cta: 'Meinen Raum kostenlos neu gestalten',
  photosCount: '10.000+ Fotos',
  photosSub: 'bereits transformiert',
  ratingLabel: 'Top-Qualität',
  floatTitle: 'Generative KI',
  floatSubtitle: 'Ergebnis in ~30 s',
  avatarAlt: 'Nutzer {n}',
  styleKeys: ['moderne', 'scandinave', 'boheme', 'japandi', 'industriel'],
};

function pack(locale) {
  const overrides = {
    Meta: locale === 'fr' ? metaFr : locale === 'en' ? metaEn : metaDe,
    Common: locale === 'fr' ? commonFr : locale === 'en' ? commonEn : commonDe,
    LanguageSwitcher: locale === 'fr' ? langSwitcherFr : locale === 'en' ? langSwitcherEn : langSwitcherDe,
    Nav: locale === 'fr' ? navFr : locale === 'en' ? navEn : navDe,
    Footer: locale === 'fr' ? footerFr : locale === 'en' ? footerEn : footerDe,
    Home: locale === 'fr' ? homeFr : locale === 'en' ? homeEn : homeDe,
    Legal: locale === 'fr' ? legalFr : locale === 'en' ? legalEn : legalDe,
    PricingMeta: locale === 'fr' ? pricingMetaFr : locale === 'en' ? pricingMetaEn : pricingMetaDe,
    PricingUI: locale === 'fr' ? pricingUIFr : locale === 'en' ? pricingUIEn : pricingUIDe,
  };
  const packs = locale === 'fr' ? creditPacksFr : locale === 'en' ? creditPacksEn : creditPacksDe;
  const subs = locale === 'fr' ? subscriptionsFr : locale === 'en' ? subscriptionsEn : subscriptionsDe;
  const faq = locale === 'fr' ? faqFr : locale === 'en' ? faqEn : faqDe;
  const base = buildMessages(locale, packs, subs, faq, overrides);
  base.Hero = locale === 'fr' ? heroFr : locale === 'en' ? heroEn : heroDe;
  base.LegalMeta = locale === 'fr' ? legalMetaFr : locale === 'en' ? legalMetaEn : legalMetaDe;
  base.HomeLanding =
    locale === 'fr' ? homeLandingFr : locale === 'en' ? homeLandingEn : homeLandingDe;
  return base;
}

fs.mkdirSync(messagesDir, { recursive: true });
for (const loc of ['fr', 'en', 'de']) {
  const out = path.join(messagesDir, `${loc}.json`);
  fs.writeFileSync(out, JSON.stringify(pack(loc), null, 2), 'utf8');
}
console.log('Wrote messages/fr.json, en.json, de.json');
