import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quiz : Quel est votre style de décoration ? | InstaDeco',
  description: 'Découvrez votre style de décoration idéal en 8 questions visuelles. Quiz gratuit et personnalisé. Moderne, scandinave, bohème, japandi... Quel style vous correspond ?',
  keywords: ['quiz déco', 'quel est mon style de décoration', 'test style déco', 'quiz décoration intérieur', 'trouver son style déco'],
  openGraph: {
    title: 'Quiz : Quel est votre style de décoration ? 🏠',
    description: 'Répondez à 8 questions visuelles et découvrez le style de décoration qui vous correspond le mieux.',
    type: 'website',
    locale: 'fr_FR',
    url: 'https://instadeco.app/quiz',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quiz : Quel est votre style de décoration ? 🏠',
    description: 'Découvrez votre style déco idéal en 8 questions.',
  },
  alternates: {
    canonical: 'https://instadeco.app/quiz',
  },
};

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return children;
}
