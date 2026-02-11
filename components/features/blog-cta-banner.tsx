import Link from 'next/link';
import { Sparkles, ArrowRight, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BlogCtaBannerProps {
  /** Tags de l'article pour contextualiser le CTA */
  tags: string[];
  /** Variante d'affichage */
  variant?: 'inline' | 'sticky';
}

// Mapping des tags vers des CTA contextuels
const TAG_CTA_MAP: Record<string, { title: string; description: string; style?: string }> = {
  'salon': {
    title: 'Transformez votre salon avec l\'IA',
    description: 'Uploadez une photo de votre salon et découvrez-le transformé en 30 secondes.',
    style: 'moderne',
  },
  'chambre': {
    title: 'Repensez votre chambre en un clic',
    description: 'Photo → IA → Votre chambre transformée dans le style de vos rêves.',
    style: 'scandinave',
  },
  'cuisine': {
    title: 'Votre cuisine mérite un relooking',
    description: 'Voyez votre cuisine transformée par notre IA en seulement 30 secondes.',
    style: 'contemporain',
  },
  'salle de bain': {
    title: 'Modernisez votre salle de bain',
    description: 'Testez différents styles pour votre salle de bain grâce à l\'IA.',
    style: 'minimaliste',
  },
  'bureau': {
    title: 'Un bureau qui booste la productivité',
    description: 'Transformez votre espace de travail avec l\'IA en 30 secondes.',
    style: 'industriel',
  },
  'moderne': {
    title: 'Passez au style moderne chez vous',
    description: 'Lignes épurées, tons neutres — visualisez votre pièce en style moderne.',
    style: 'moderne',
  },
  'scandinave': {
    title: 'Le style scandinave chez vous, maintenant',
    description: 'Bois clair, simplicité, hygge — testez le scandinave sur vos photos.',
    style: 'scandinave',
  },
  'industriel': {
    title: 'Adoptez le style industriel',
    description: 'Briques, métal, bois brut — voyez votre pièce en mode loft.',
    style: 'industriel',
  },
  'bohème': {
    title: 'Libérez le bohème en vous',
    description: 'Couleurs chaudes, textures, plantes — le bohème transforme tout.',
    style: 'boheme',
  },
  'japandi': {
    title: 'Découvrez le Japandi chez vous',
    description: 'Le parfait mélange zen japonais et cocooning scandinave.',
    style: 'japandi',
  },
  'minimaliste': {
    title: 'Moins c\'est plus : le minimalisme',
    description: 'Épurez votre intérieur avec le style minimaliste par IA.',
    style: 'minimaliste',
  },
  'art déco': {
    title: 'L\'élégance Art Déco dans votre intérieur',
    description: 'Géométrie, dorures, luxe — voyez votre pièce en Art Déco.',
    style: 'art-deco',
  },
  'home staging': {
    title: 'Home staging virtuel par IA',
    description: 'Valorisez votre bien immobilier avec notre IA de home staging.',
  },
  'rénovation': {
    title: 'Visualisez avant de rénover',
    description: 'Testez les styles avant de vous lancer dans les travaux.',
  },
  'décoration': {
    title: 'Votre décoration idéale en 30 secondes',
    description: 'Photo → IA → Votre pièce complètement transformée.',
  },
  'tendance': {
    title: 'Adoptez les tendances déco 2025',
    description: 'Testez les dernières tendances sur vos propres photos.',
  },
  'couleur': {
    title: 'Trouvez les bonnes couleurs pour chez vous',
    description: 'Notre IA vous propose des palettes de couleurs adaptées à votre espace.',
  },
  'petit espace': {
    title: 'Optimisez votre petit espace',
    description: 'L\'IA repense votre petit espace pour le rendre plus grand et fonctionnel.',
  },
};

// CTA par défaut
const DEFAULT_CTA = {
  title: 'Testez ces idées sur vos propres photos',
  description: 'Uploadez une photo de votre pièce et découvrez-la transformée par l\'IA en 30 secondes.',
};

function findBestCta(tags: string[]) {
  for (const tag of tags) {
    const normalized = tag.toLowerCase().trim();
    // Correspondance exacte
    if (TAG_CTA_MAP[normalized]) return TAG_CTA_MAP[normalized];
    // Correspondance partielle
    for (const [key, value] of Object.entries(TAG_CTA_MAP)) {
      if (normalized.includes(key) || key.includes(normalized)) return value;
    }
  }
  return DEFAULT_CTA;
}

export function BlogCtaBanner({ tags, variant = 'inline' }: BlogCtaBannerProps) {
  const cta = findBestCta(tags);
  const href = cta && 'style' in cta && cta.style 
    ? `/essai?style=${cta.style}` 
    : '/essai';

  if (variant === 'sticky') {
    return (
      <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-y border-primary/10 py-4 px-4">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Camera className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{cta.title}</p>
              <p className="text-xs text-muted-foreground">{cta.description}</p>
            </div>
          </div>
          <Link href={href}>
            <Button size="sm" className="rounded-full px-6 whitespace-nowrap shadow-md shadow-primary/20">
              Essayer gratuitement
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="my-10 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FFF8F5] via-[#FFF0EB] to-[#FFE4D9] border border-primary/15 p-8 sm:p-10">
      {/* Decorative elements */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
      
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-[#D4603C] flex items-center justify-center shadow-lg shadow-primary/25">
          <Sparkles className="h-7 w-7 text-white" />
        </div>
        
        <div className="flex-1 space-y-2">
          <h3 className="text-xl font-bold text-foreground">
            {cta.title}
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            {cta.description}
          </p>
        </div>

        <Link href={href} className="flex-shrink-0 w-full sm:w-auto">
          <Button 
            size="lg" 
            className="rounded-full px-8 w-full sm:w-auto shadow-lg shadow-primary/25 hover:scale-105 transition-transform"
          >
            Essayer gratuitement
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
      
      <p className="relative z-10 mt-4 text-xs text-muted-foreground/80 text-center sm:text-left">
        ✨ Gratuit • Sans inscription • Résultat en 30 secondes
      </p>
    </div>
  );
}
