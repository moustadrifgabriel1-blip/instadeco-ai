/**
 * Metadata SEO pour la page Pricing
 * 
 * Les pages 'use client' ne peuvent pas exporter metadata,
 * donc on utilise un layout server component pour les injecter.
 */

import { Metadata } from 'next';
import { JsonLd } from '@/lib/seo/json-ld';
import { generateProductSchema, generateFAQSchema, generateBreadcrumbList } from '@/lib/seo/schemas';
import { getCanonicalUrl } from '@/lib/seo/config';

export const metadata: Metadata = {
  title: 'Tarifs & Crédits - Décoration IA sans Abonnement | InstaDeco AI',
  description: 'Achetez des crédits sans abonnement pour transformer vos pièces par IA. À partir de 9,99€ pour 10 générations HD. Crédits sans expiration. Paiement sécurisé Stripe.',
  keywords: [
    'tarifs décoration IA',
    'prix home staging virtuel',
    'crédits InstaDeco',
    'décoration intérieur prix',
    'home staging virtuel tarif',
    'générer décoration IA coût',
    'décoration sans abonnement',
  ],
  openGraph: {
    title: 'Tarifs InstaDeco AI - Décoration IA à partir de 9,99€',
    description: 'Pas d\'abonnement, pas de surprise. Achetez des crédits et transformez vos pièces par IA quand vous voulez.',
    type: 'website',
    url: getCanonicalUrl('/pricing'),
    images: [getCanonicalUrl('/og-image.png')],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tarifs InstaDeco AI - À partir de 9,99€',
    description: 'Crédits sans abonnement pour décorer par IA. Paiement sécurisé.',
  },
  alternates: {
    canonical: getCanonicalUrl('/pricing'),
  },
};

// FAQ data for structured data
const pricingFAQ = [
  {
    question: "Combien coûte une génération d'image ?",
    answer: "1 crédit = 1 génération. Chaque génération vous donne une image en haute qualité (1024×1024 pixels) que vous pouvez télécharger immédiatement."
  },
  {
    question: "Mes crédits expirent-ils ?",
    answer: "Non, jamais ! Vos crédits restent sur votre compte indéfiniment. Utilisez-les quand vous voulez, à votre rythme."
  },
  {
    question: "Quelle est la qualité des images générées ?",
    answer: "Toutes les images sont en haute définition (1024×1024 pixels). Vous pouvez aussi débloquer la version HD+ (2048×2048) pour seulement 4,99€ par image."
  },
  {
    question: "Puis-je utiliser les images pour mon activité pro ?",
    answer: "Absolument ! Toutes les images que vous générez vous appartiennent. Vous pouvez les utiliser pour vos projets personnels, votre portfolio, vos clients, vos réseaux sociaux. Aucune restriction d'usage commercial."
  },
  {
    question: "Comment choisir le bon style pour ma pièce ?",
    answer: "On propose 12 styles différents (Moderne, Scandinave, Japandi, Bohème...). Choisissez le style qui correspond à l'ambiance que vous voulez créer, et ajustez l'intensité de transformation selon vos goûts."
  },
  {
    question: "Quels moyens de paiement acceptez-vous ?",
    answer: "On accepte toutes les cartes bancaires (Visa, Mastercard, American Express), ainsi qu'Apple Pay et Google Pay. Paiement 100% sécurisé via Stripe."
  },
  {
    question: "Puis-je obtenir un remboursement ?",
    answer: "Oui ! Si vous n'avez pas utilisé vos crédits, vous pouvez demander un remboursement intégral sous 14 jours après l'achat. Les crédits déjà utilisés ne sont pas remboursables."
  },
  {
    question: "Que faire si le résultat ne me plaît pas ?",
    answer: "L'IA est créative ! Si un résultat ne vous convient pas, relancez simplement une génération avec les mêmes paramètres pour obtenir une nouvelle proposition. Vous pouvez aussi ajuster l'intensité de transformation ou changer de style."
  },
  {
    question: "Quels types de photos fonctionnent le mieux ?",
    answer: "Pour de meilleurs résultats : prenez une photo bien éclairée, de face (pas d'angle extrême), et qui montre bien l'espace. Les pièces vides ou peu meublées donnent plus de liberté à l'IA."
  },
];

const pricingPlans = [
  { name: 'Découverte', price: 9.99, credits: 10, description: 'Parfait pour tester' },
  { name: 'Créatif', price: 19.99, credits: 25, description: 'Le plus choisi' },
  { name: 'Pro', price: 34.99, credits: 50, description: 'Pour les passionnés' },
];

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={[
        generateProductSchema(pricingPlans),
        generateFAQSchema(pricingFAQ),
        generateBreadcrumbList([
          { label: 'Tarifs', path: '/pricing' },
        ]),
      ]} />
      {children}
    </>
  );
}
