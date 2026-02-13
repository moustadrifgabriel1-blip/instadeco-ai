'use client';

import { useState, useCallback } from 'react';
import { OptimizedRemoteImage } from '@/components/ui/optimized-image';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, Sparkles, Check, Gift, Star, Share2, ChevronRight, Home } from 'lucide-react';
import { ShareButtons } from '@/components/features/share-buttons';

// ============================================
// TYPES
// ============================================

interface QuizOption {
  id: string;
  label: string;
  image: string;
  /** Points attribués par style */
  scores: Record<string, number>;
}

interface QuizQuestion {
  id: number;
  question: string;
  subtitle: string;
  options: QuizOption[];
}

interface StyleResult {
  slug: string;
  name: string;
  emoji: string;
  headline: string;
  description: string;
  colors: string[];
  traits: string[];
  compatibility: string[];
  tip: string;
}

// ============================================
// DONNÉES DU QUIZ
// ============================================

const STYLE_RESULTS: Record<string, StyleResult> = {
  moderne: {
    slug: 'moderne',
    name: 'Moderne',
    emoji: '✨',
    headline: 'Vous êtes Style Moderne',
    description: 'Vous aimez les lignes épurées, les espaces lumineux et l\'élégance fonctionnelle. Pour vous, chaque objet a sa place et chaque détail compte. Vous privilégiez la qualité sur la quantité.',
    colors: ['#FFFFFF', '#E5E5E5', '#333333', '#C9A87C'],
    traits: ['Épuré', 'Fonctionnel', 'Lumineux', 'Élégant'],
    compatibility: ['Minimaliste', 'Contemporain', 'Scandinave'],
    tip: 'Misez sur un ou deux meubles statement et gardez le reste sobre.',
  },
  scandinave: {
    slug: 'scandinave',
    name: 'Scandinave',
    emoji: '🪵',
    headline: 'Vous êtes Style Scandinave',
    description: 'Le hygge est votre philosophie de vie. Vous recherchez le confort, la chaleur du bois naturel et la lumière. Votre intérieur est un cocon douillet qui respire la sérénité.',
    colors: ['#FAF5F0', '#D4B89C', '#87CEEB', '#F5CEC7'],
    traits: ['Cocooning', 'Naturel', 'Chaleureux', 'Lumineux'],
    compatibility: ['Japandi', 'Moderne', 'Minimaliste'],
    tip: 'Ajoutez des textiles douillets (plaids, coussins en laine) et privilégiez le bois clair.',
  },
  industriel: {
    slug: 'industriel',
    name: 'Industriel',
    emoji: '🏭',
    headline: 'Vous êtes Style Industriel',
    description: 'Vous aimez le caractère brut et authentique. Les matériaux bruts vous parlent : métal, briques, béton. Vous préférez un intérieur avec du vécu et de la personnalité.',
    colors: ['#8B8680', '#333333', '#B7410E', '#6B4423'],
    traits: ['Brut', 'Authentique', 'Caractère', 'Urbain'],
    compatibility: ['Contemporain', 'Mid-Century', 'Moderne'],
    tip: 'Équilibrez les matériaux bruts (métal, béton) avec des textiles chaleureux pour éviter l\'effet froid.',
  },
  boheme: {
    slug: 'boheme',
    name: 'Bohème',
    emoji: '🌿',
    headline: 'Vous êtes Style Bohème',
    description: 'Créatif et libre, vous aimez mélanger les cultures, les textures et les couleurs. Votre intérieur raconte une histoire et chaque objet a sa signification.',
    colors: ['#CC5B3B', '#C89832', '#6B8E6B', '#FFFFF0'],
    traits: ['Créatif', 'Chaleureux', 'Éclectique', 'Libre'],
    compatibility: ['Rustique', 'Coastal', 'Contemporain'],
    tip: 'Limitez-vous à 3-4 couleurs chaudes et variez les textures plutôt que les motifs.',
  },
  japandi: {
    slug: 'japandi',
    name: 'Japandi',
    emoji: '🎋',
    headline: 'Vous êtes Style Japandi',
    description: 'La fusion parfaite entre zen japonais et confort nordique. Vous appréciez l\'imperfection du wabi-sabi et la sérénité des espaces épurés.',
    colors: ['#C2B280', '#8B8378', '#2F4F4F', '#6B8E6B'],
    traits: ['Zen', 'Raffiné', 'Naturel', 'Apaisant'],
    compatibility: ['Scandinave', 'Minimaliste', 'Moderne'],
    tip: 'Choisissez des matériaux naturels (bambou, céramique) et laissez de l\'espace vide — il fait partie du décor.',
  },
  minimaliste: {
    slug: 'minimaliste',
    name: 'Minimaliste',
    emoji: '⬜',
    headline: 'Vous êtes Style Minimaliste',
    description: 'Less is more. Vous trouvez la beauté dans la simplicité et chaque objet dans votre espace a une raison d\'être. L\'ordre et la clarté vous apaisent.',
    colors: ['#FFFFFF', '#000000', '#D3D3D3', '#DEB887'],
    traits: ['Essentiel', 'Ordonné', 'Aéré', 'Intentionnel'],
    compatibility: ['Moderne', 'Japandi', 'Contemporain'],
    tip: 'Investissez dans quelques pièces de grande qualité plutôt que beaucoup d\'objets moyens.',
  },
  'art-deco': {
    slug: 'art-deco',
    name: 'Art Déco',
    emoji: '🏛️',
    headline: 'Vous êtes Style Art Déco',
    description: 'Le glamour des années folles vous inspire. Vous aimez les matériaux nobles, les formes géométriques audacieuses et une certaine opulence maîtrisée.',
    colors: ['#191970', '#FFD700', '#50C878', '#000000'],
    traits: ['Glamour', 'Audacieux', 'Luxueux', 'Raffiné'],
    compatibility: ['Luxe', 'Contemporain', 'Moderne'],
    tip: 'Quelques touches suffisent : un miroir doré, un luminaire géométrique et du velours.',
  },
  contemporain: {
    slug: 'contemporain',
    name: 'Contemporain',
    emoji: '🎨',
    headline: 'Vous êtes Style Contemporain',
    description: 'Toujours à l\'affût des tendances, vous aimez un intérieur frais et actuel. Vous n\'avez pas peur de mixer les influences et d\'expérimenter.',
    colors: ['#F5F5DC', '#808000', '#CC5B3B', '#002FA7'],
    traits: ['Tendance', 'Audacieux', 'Adaptable', 'Frais'],
    compatibility: ['Moderne', 'Industriel', 'Art Déco'],
    tip: 'Changez vos accessoires (coussins, art) chaque saison pour suivre les tendances sans tout refaire.',
  },
  rustique: {
    slug: 'rustique',
    name: 'Rustique',
    emoji: '🏡',
    headline: 'Vous êtes Style Rustique',
    description: 'La campagne vous appelle. Vous aimez l\'authenticité, le bois massif et la chaleur d\'un intérieur accueillant aux matériaux naturels.',
    colors: ['#8B4513', '#FFFDD0', '#228B22', '#A52A2A'],
    traits: ['Authentique', 'Chaleureux', 'Naturel', 'Accueillant'],
    compatibility: ['Coastal', 'Bohème', 'Scandinave'],
    tip: 'Gardez les éléments de caractère (poutres, pierre) et modernisez avec un éclairage contemporain.',
  },
  coastal: {
    slug: 'coastal',
    name: 'Coastal',
    emoji: '🏖️',
    headline: 'Vous êtes Style Coastal',
    description: 'L\'esprit vacances toute l\'année ! Vous aimez les bleus apaisants, le blanc lumineux et les matières naturelles qui évoquent la plage.',
    colors: ['#000080', '#FFFFFF', '#C2B280', '#FF7F50'],
    traits: ['Apaisant', 'Lumineux', 'Frais', 'Détendu'],
    compatibility: ['Scandinave', 'Bohème', 'Rustique'],
    tip: 'Évitez le total look marin — préférez des touches subtiles de bleu et des matières naturelles.',
  },
  'mid-century': {
    slug: 'mid-century',
    name: 'Mid-Century Modern',
    emoji: '🪑',
    headline: 'Vous êtes Style Mid-Century',
    description: 'Fan de design iconique, vous appréciez les lignes organiques des années 50-60, les pieds compas et les couleurs audacieuses.',
    colors: ['#FFDB58', '#008080', '#CC5500', '#654321'],
    traits: ['Iconique', 'Vintage', 'Audacieux', 'Design'],
    compatibility: ['Contemporain', 'Industriel', 'Moderne'],
    tip: 'Une ou deux pièces iconiques (chaise Eames, lampe Arco) suffisent à donner le ton.',
  },
  luxe: {
    slug: 'luxe',
    name: 'Luxe',
    emoji: '💎',
    headline: 'Vous êtes Style Luxe',
    description: 'Vous avez un goût prononcé pour le raffinement et les matériaux nobles. Marbre, soie, cristal : votre intérieur est une expérience sensorielle.',
    colors: ['#FFD700', '#1A1A2E', '#FFFDD0', '#800020'],
    traits: ['Raffiné', 'Somptueux', 'Prestigieux', 'Exclusif'],
    compatibility: ['Art Déco', 'Contemporain', 'Moderne'],
    tip: 'Le luxe est dans les finitions : robinetterie, poignées, coussins et éclairage font toute la différence.',
  },
};

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: 'Quel salon vous attire le plus ?',
    subtitle: 'Fiez-vous à votre première impression',
    options: [
      { id: 'a', label: 'Lumineux & épuré', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop', scores: { moderne: 3, minimaliste: 2, scandinave: 1 } },
      { id: 'b', label: 'Chaleureux & texturé', image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=400&h=300&fit=crop', scores: { boheme: 3, rustique: 2, coastal: 1 } },
      { id: 'c', label: 'Brut & caractère', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop', scores: { industriel: 3, contemporain: 2, 'mid-century': 1 } },
      { id: 'd', label: 'Élégant & raffiné', image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop', scores: { luxe: 3, 'art-deco': 2, japandi: 1 } },
    ],
  },
  {
    id: 2,
    question: 'Quelle palette vous inspire ?',
    subtitle: 'Choisissez les couleurs qui vous parlent',
    options: [
      { id: 'a', label: 'Blanc, gris, bois clair', image: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=400&h=300&fit=crop', scores: { scandinave: 3, minimaliste: 2, japandi: 1 } },
      { id: 'b', label: 'Terracotta, ocre, vert', image: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=400&h=300&fit=crop', scores: { boheme: 3, contemporain: 2, rustique: 1 } },
      { id: 'c', label: 'Noir, métal, brique', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop', scores: { industriel: 3, moderne: 1, 'mid-century': 2 } },
      { id: 'd', label: 'Or, marine, émeraude', image: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=400&h=300&fit=crop', scores: { luxe: 3, 'art-deco': 2, contemporain: 1 } },
    ],
  },
  {
    id: 3,
    question: 'Quel matériau vous attire le plus ?',
    subtitle: 'Touchez du doigt votre style',
    options: [
      { id: 'a', label: 'Bois naturel & lin', image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=400&h=300&fit=crop', scores: { scandinave: 3, japandi: 2, rustique: 1 } },
      { id: 'b', label: 'Velours & marbre', image: 'https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?w=400&h=300&fit=crop', scores: { luxe: 3, 'art-deco': 2, moderne: 1 } },
      { id: 'c', label: 'Métal & béton', image: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=400&h=300&fit=crop', scores: { industriel: 3, moderne: 2, contemporain: 1 } },
      { id: 'd', label: 'Rotin & macramé', image: 'https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?w=400&h=300&fit=crop', scores: { boheme: 3, coastal: 2, rustique: 1 } },
    ],
  },
  {
    id: 4,
    question: 'Votre week-end idéal ?',
    subtitle: 'Votre personnalité révèle votre style',
    options: [
      { id: 'a', label: 'Brunch design & galerie d\'art', image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop', scores: { contemporain: 3, 'mid-century': 2, 'art-deco': 1 } },
      { id: 'b', label: 'Randonnée et chalet', image: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=400&h=300&fit=crop', scores: { rustique: 3, scandinave: 2, coastal: 1 } },
      { id: 'c', label: 'Marché aux puces & brocante', image: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=400&h=300&fit=crop', scores: { boheme: 3, 'mid-century': 2, industriel: 1 } },
      { id: 'd', label: 'Spa & hôtel de charme', image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop', scores: { luxe: 3, japandi: 2, minimaliste: 1 } },
    ],
  },
  {
    id: 5,
    question: 'Comment organisez-vous votre espace ?',
    subtitle: 'L\'ordre en dit long sur votre style',
    options: [
      { id: 'a', label: 'Tout est rangé, rien ne traîne', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop', scores: { minimaliste: 3, moderne: 2, japandi: 1 } },
      { id: 'b', label: 'Désordre organisé et créatif', image: 'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=400&h=300&fit=crop', scores: { boheme: 3, contemporain: 1, 'mid-century': 2 } },
      { id: 'c', label: 'Pratique avant tout', image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&h=300&fit=crop', scores: { scandinave: 2, industriel: 3, moderne: 1 } },
      { id: 'd', label: 'Chaque objet est une pièce choisie', image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400&h=300&fit=crop', scores: { luxe: 2, 'art-deco': 3, japandi: 1 } },
    ],
  },
  {
    id: 6,
    question: 'Quelle ambiance pour votre chambre ?',
    subtitle: 'Votre sanctuaire personnel',
    options: [
      { id: 'a', label: 'Cocon douillet et lumineux', image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=400&h=300&fit=crop', scores: { scandinave: 3, minimaliste: 1, japandi: 2 } },
      { id: 'b', label: 'Romantique et texturé', image: 'https://images.unsplash.com/photo-1618219740975-d40978bb7378?w=400&h=300&fit=crop', scores: { boheme: 3, rustique: 1, coastal: 2 } },
      { id: 'c', label: 'Épuré et design', image: 'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=400&h=300&fit=crop', scores: { moderne: 3, contemporain: 2, 'mid-century': 1 } },
      { id: 'd', label: 'Somptueux et enveloppant', image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&h=300&fit=crop', scores: { luxe: 3, 'art-deco': 2, contemporain: 1 } },
    ],
  },
  {
    id: 7,
    question: 'Quel voyage vous fait rêver ?',
    subtitle: 'Vos destinations révèlent votre esthétique',
    options: [
      { id: 'a', label: 'Kyoto, Japon', image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=300&fit=crop', scores: { japandi: 3, minimaliste: 2, scandinave: 1 } },
      { id: 'b', label: 'Marrakech, Maroc', image: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=400&h=300&fit=crop', scores: { boheme: 3, 'art-deco': 1, rustique: 2 } },
      { id: 'c', label: 'New York, USA', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=300&fit=crop', scores: { industriel: 3, contemporain: 2, moderne: 1 } },
      { id: 'd', label: 'Santorin, Grèce', image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&h=300&fit=crop', scores: { coastal: 3, minimaliste: 1, luxe: 2 } },
    ],
  },
  {
    id: 8,
    question: 'Le détail déco qui vous fait craquer ?',
    subtitle: 'La touche finale qui dit tout',
    options: [
      { id: 'a', label: 'Un beau luminaire design', image: 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=400&h=300&fit=crop', scores: { moderne: 2, contemporain: 3, 'mid-century': 1 } },
      { id: 'b', label: 'Des plantes vertes partout', image: 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=400&h=300&fit=crop', scores: { boheme: 2, scandinave: 3, japandi: 1 } },
      { id: 'c', label: 'Un tapis berbère unique', image: 'https://images.unsplash.com/photo-1600166898405-da9535204843?w=400&h=300&fit=crop', scores: { boheme: 3, rustique: 2, coastal: 1 } },
      { id: 'd', label: 'Un miroir doré sculptural', image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=400&h=300&fit=crop', scores: { 'art-deco': 3, luxe: 2, contemporain: 1 } },
    ],
  },
];

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function QuizPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [step, setStep] = useState<'intro' | 'quiz' | 'email' | 'result'>('intro');
  const [email, setEmail] = useState('');
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [resultStyle, setResultStyle] = useState<StyleResult | null>(null);

  const totalQuestions = QUIZ_QUESTIONS.length;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  // Calcul du résultat
  const calculateResult = useCallback((allScores: Record<string, number>) => {
    const sorted = Object.entries(allScores).sort((a, b) => b[1] - a[1]);
    const topStyle = sorted[0]?.[0] || 'moderne';
    return STYLE_RESULTS[topStyle] || STYLE_RESULTS.moderne;
  }, []);

  // Sélection d'une réponse
  const handleAnswer = (questionId: number, optionId: string, optionScores: Record<string, number>) => {
    // Sauvegarder la réponse
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));

    // Mettre à jour les scores
    const newScores = { ...scores };
    Object.entries(optionScores).forEach(([style, points]) => {
      newScores[style] = (newScores[style] || 0) + points;
    });
    setScores(newScores);

    // Passer à la question suivante ou à l'email
    setTimeout(() => {
      if (currentQuestion < totalQuestions - 1) {
        setCurrentQuestion((prev) => prev + 1);
      } else {
        // Quiz terminé → capture email
        const result = calculateResult(newScores);
        setResultStyle(result);
        setStep('email');
      }
    }, 300);
  };

  // Retour à la question précédente
  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  // Soumission de l'email (optionnel)
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setStep('result');
      return;
    }

    setEmailSubmitting(true);
    try {
      await fetch('/api/v2/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          source: 'quiz_style_deco',
          metadata: { style: resultStyle?.name || 'Moderne' },
        }),
      });
    } catch {
      // Silently continue even if lead capture fails
    }
    setEmailSubmitting(false);
    setStep('result');
  };

  const handleSkipEmail = () => {
    setStep('result');
  };

  // ── INTRO ──
  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-[#fbfbfd]">
        <section className="pt-6 pb-12 px-4 sm:pt-8 sm:pb-20 sm:px-6">
          <div className="max-w-[600px] mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#FFF3ED] text-[#E07B54] rounded-full text-sm font-medium mb-6">
              <Star className="w-4 h-4" />
              Quiz gratuit — 2 min
            </div>

            <h1 className="text-[28px] sm:text-[36px] md:text-[52px] font-semibold tracking-[-0.03em] text-[#1d1d1f] leading-[1.06] mb-4">
              Quel est votre style
              <br />
              <span className="bg-gradient-to-r from-[#E07B54] to-[#D4603C] bg-clip-text text-transparent">
                de décoration ?
              </span>
            </h1>

            <p className="text-[15px] sm:text-[17px] md:text-[19px] text-[#636366] leading-[1.5] mb-8 max-w-md mx-auto">
              Répondez à {totalQuestions} questions visuelles et découvrez le style qui vous correspond le mieux.
            </p>

            <button
              onClick={() => setStep('quiz')}
              className="group inline-flex items-center gap-2 bg-[#E07B54] text-white px-6 py-3.5 sm:px-8 sm:py-4 rounded-full text-[15px] sm:text-[17px] font-semibold hover:bg-[#d06a45] transition-all duration-200 shadow-lg shadow-[#E07B54]/20 active:scale-95"
            >
              <Sparkles className="w-5 h-5" />
              Découvrir mon style
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[12px] sm:text-[13px] text-[#636366]">
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-500" /> 100% gratuit</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-500" /> 8 questions</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-500" /> Résultat immédiat</span>
            </div>

            {/* Social proof */}
            <div className="mt-10 pt-8 border-t border-black/5">
              <p className="text-[13px] text-[#636366] mb-3">Découvrez votre style en 2 minutes</p>
              <div className="flex items-center justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-[#E07B54] text-[#E07B54]" />
                ))}
                <span className="ml-2 text-[14px] font-semibold text-[#1d1d1f]">12 styles</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ── QUIZ (questions) ──
  if (step === 'quiz') {
    const question = QUIZ_QUESTIONS[currentQuestion];

    return (
      <div className="min-h-screen bg-[#fbfbfd]">
        {/* Header avec progression */}
        <nav className="sticky top-16 z-40 bg-[#fbfbfd]/80 backdrop-blur-xl border-b border-black/5">
          <div className="max-w-[980px] mx-auto px-6">
            <div className="h-12 flex items-center justify-between">
              <button
                onClick={handleBack}
                disabled={currentQuestion === 0}
                className="text-[#636366] hover:text-[#1d1d1f] disabled:opacity-30 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="text-[13px] font-medium text-[#636366]">
                {currentQuestion + 1} / {totalQuestions}
              </span>
              <Link href="/" className="text-[13px] text-[#636366] hover:text-[#1d1d1f] transition-colors">
                Quitter
              </Link>
            </div>
            {/* Barre de progression */}
            <div className="h-[3px] bg-[#f5f5f7] -mx-6">
              <div
                className="h-full bg-gradient-to-r from-[#E07B54] to-[#e8956e] transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </nav>

        <section className="pt-6 pb-12 px-4 sm:pt-8 sm:pb-16 sm:px-6">
          <div className="max-w-[720px] mx-auto">
            {/* Question */}
            <div className="text-center mb-8">
              <h2 className="text-[22px] sm:text-[28px] md:text-[34px] font-semibold tracking-[-0.02em] text-[#1d1d1f] leading-tight">
                {question.question}
              </h2>
              <p className="mt-2 text-[15px] text-[#636366]">{question.subtitle}</p>
            </div>

            {/* Options (grille 2x2) */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {question.options.map((option) => {
                const isSelected = answers[question.id] === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer(question.id, option.id, option.scores)}
                    className={`group relative rounded-[20px] overflow-hidden border-2 transition-all duration-300 hover:shadow-lg active:scale-[0.98] aspect-[4/3] ${
                      isSelected
                        ? 'border-[#E07B54] shadow-lg shadow-[#E07B54]/20'
                        : 'border-transparent hover:border-[#E07B54]/30'
                    }`}
                  >
                    <OptimizedRemoteImage
                      src={option.image}
                      alt={option.label}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 50vw, 350px"
                      priority={currentQuestion === 0}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                      <p className="text-white font-semibold text-[14px] sm:text-[16px] text-left leading-tight">
                        {option.label}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-7 h-7 bg-[#E07B54] rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ── EMAIL CAPTURE ──
  if (step === 'email') {
    return (
      <div className="min-h-screen bg-[#fbfbfd] flex items-center justify-center px-6">
        <div className="max-w-[440px] w-full text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-gradient-to-br from-[#E07B54] to-[#D4603C] flex items-center justify-center shadow-lg shadow-[#E07B54]/20">
            <Sparkles className="w-7 h-7 text-white" />
          </div>

          <h2 className="text-[28px] sm:text-[34px] font-bold text-[#1d1d1f] tracking-[-0.02em] mb-2">
            Votre résultat est prêt !
          </h2>
          <p className="text-[15px] text-[#636366] mb-8 max-w-sm mx-auto leading-relaxed">
            Entrez votre email pour recevoir votre profil déco complet et des recommandations personnalisées.
          </p>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full px-5 py-3.5 rounded-2xl border border-[#d2d2d7] bg-white text-[15px] text-[#1d1d1f] placeholder:text-[#aeaeb2] focus:outline-none focus:border-[#E07B54] focus:ring-2 focus:ring-[#E07B54]/20 transition-all"
            />
            <button
              type="submit"
              disabled={emailSubmitting}
              className="group w-full inline-flex items-center justify-center gap-2 bg-[#E07B54] text-white px-8 py-3.5 rounded-full text-[16px] font-semibold hover:bg-[#d06a45] transition-all duration-200 shadow-lg shadow-[#E07B54]/20 active:scale-95 disabled:opacity-60"
            >
              {emailSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Chargement...
                </span>
              ) : (
                <>
                  Découvrir mon style
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <button
            onClick={handleSkipEmail}
            className="mt-4 text-[13px] text-[#636366] hover:text-[#1d1d1f] transition-colors underline"
          >
            Passer cette étape
          </button>

          <p className="mt-6 text-[11px] text-[#aeaeb2] max-w-xs mx-auto">
            En continuant, vous acceptez de recevoir des emails de la part d&apos;InstaDeco. Vous pouvez vous désabonner à tout moment.
          </p>
        </div>
      </div>
    );
  }

  // ── RÉSULTAT ──
  if (step === 'result' && resultStyle) {
    return (
      <div className="min-h-screen bg-[#fbfbfd]">
        <section className="pt-8 pb-20 px-6">
          <div className="max-w-[640px] mx-auto">
            {/* Résultat principal */}
            <div className="text-center mb-8">
              <div className="text-[56px] mb-3">{resultStyle.emoji}</div>
              <h1 className="text-[32px] sm:text-[40px] font-bold tracking-[-0.03em] text-[#1d1d1f] leading-[1.1] mb-3">
                {resultStyle.headline}
              </h1>
              <p className="text-[16px] text-[#636366] leading-relaxed max-w-lg mx-auto">
                {resultStyle.description}
              </p>
            </div>

            {/* Palette de couleurs */}
            <div className="bg-white rounded-[24px] border border-black/5 p-6 mb-4 shadow-sm">
              <h3 className="text-[13px] font-semibold text-[#636366] uppercase tracking-wider mb-4">
                Votre palette
              </h3>
              <div className="flex gap-3">
                {resultStyle.colors.map((color, i) => (
                  <div key={i} className="flex-1">
                    <div
                      className="aspect-square rounded-2xl shadow-inner border border-black/5"
                      style={{ backgroundColor: color }}
                    />
                    <p className="text-[11px] text-[#636366] text-center mt-2 font-mono">{color}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Traits */}
            <div className="bg-white rounded-[24px] border border-black/5 p-6 mb-4 shadow-sm">
              <h3 className="text-[13px] font-semibold text-[#636366] uppercase tracking-wider mb-4">
                Vos traits déco
              </h3>
              <div className="flex flex-wrap gap-2">
                {resultStyle.traits.map((trait) => (
                  <span key={trait} className="px-4 py-2 bg-[#FFF3ED] text-[#E07B54] rounded-full text-[14px] font-medium">
                    {trait}
                  </span>
                ))}
              </div>
            </div>

            {/* Styles compatibles */}
            <div className="bg-white rounded-[24px] border border-black/5 p-6 mb-4 shadow-sm">
              <h3 className="text-[13px] font-semibold text-[#636366] uppercase tracking-wider mb-4">
                Styles compatibles
              </h3>
              <div className="flex flex-wrap gap-2">
                {resultStyle.compatibility.map((style) => (
                  <Link
                    key={style}
                    href={`/style/${style.toLowerCase().replace(/\s+/g, '-')}`}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-[#f5f5f7] text-[#1d1d1f] rounded-full text-[14px] font-medium hover:bg-[#e8e8ed] transition-colors"
                  >
                    {style}
                    <ChevronRight className="w-3.5 h-3.5 text-[#636366]" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Conseil pro */}
            <div className="bg-gradient-to-br from-[#FFF8F5] to-[#FFF0E8] rounded-[24px] border border-[#F0E6E0] p-6 mb-6">
              <h3 className="text-[13px] font-semibold text-[#E07B54] uppercase tracking-wider mb-2">
                💡 Conseil de pro
              </h3>
              <p className="text-[15px] text-[#1d1d1f] leading-relaxed">
                {resultStyle.tip}
              </p>
            </div>

            {/* Partage */}
            <div className="bg-white rounded-[24px] border border-black/5 p-6 mb-6 shadow-sm text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Share2 className="w-4 h-4 text-[#E07B54]" />
                <span className="text-[14px] font-semibold text-[#1d1d1f]">Partagez votre résultat</span>
              </div>
              <ShareButtons
                url="https://instadeco.app/quiz"
                title={`Je suis style ${resultStyle.name} ${resultStyle.emoji} ! Et vous, quel est votre style de décoration ? Faites le quiz :`}
                description={`J'ai découvert que mon style déco est ${resultStyle.name}. Faites le quiz pour découvrir le vôtre !`}
                variant="inline"
              />
            </div>

            {/* CTA : Essayer ce style */}
            <div className="bg-gradient-to-br from-[#E07B54] to-[#D4603C] rounded-[24px] p-5 sm:p-8 text-center shadow-xl shadow-[#E07B54]/20">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                <Home className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-[20px] sm:text-[24px] md:text-[28px] font-bold text-white tracking-[-0.02em] mb-2">
                Voyez votre pièce en style {resultStyle.name}
              </h2>
              <p className="text-[14px] sm:text-[15px] text-white/80 max-w-md mx-auto mb-6 leading-relaxed">
                Uploadez une photo et notre IA transforme votre pièce en style {resultStyle.name} en 30 secondes. Gratuit, sans inscription.
              </p>
              <Link
                href="/essai"
                className="group inline-flex items-center gap-2 bg-white text-[#E07B54] px-6 py-3 sm:px-8 sm:py-4 rounded-full text-[15px] sm:text-[17px] font-bold hover:bg-white/90 transition-all duration-200 shadow-lg active:scale-95"
              >
                <Sparkles className="w-5 h-5" />
                Essayer gratuitement
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <p className="mt-4 text-[12px] text-white/60">
                <span className="flex items-center justify-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Gratuit — Sans inscription — Résultat en 30s
                </span>
              </p>
            </div>

            {/* Refaire le quiz */}
            <div className="text-center mt-8">
              <button
                onClick={() => {
                  setStep('intro');
                  setCurrentQuestion(0);
                  setAnswers({});
                  setScores({});
                  setResultStyle(null);
                  setEmail('');
                }}
                className="text-[14px] text-[#636366] hover:text-[#1d1d1f] transition-colors underline"
              >
                Refaire le quiz
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return null;
}
