import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles, Home, Building2, Palette, Sofa, BedDouble, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Exemples & Cas d\'Usage - Transformations IA',
  description: 'Découvrez des exemples concrets de transformations de décoration d\'intérieur réalisées par InstaDeco AI. Salon, chambre, cuisine, bureau et plus.',
  keywords: ['exemples décoration IA', 'avant après déco', 'transformation intérieur', 'use cases home staging'],
};

// Types de pièces avec exemples
const useCases = [
  {
    id: 'salon',
    icon: Sofa,
    title: 'Salon & Séjour',
    description: 'Transformez votre salon en espace de vie moderne et accueillant.',
    examples: [
      {
        before: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        after: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800',
        style: 'Moderne Minimaliste',
        caption: 'Salon vide → Design épuré scandinave',
      },
      {
        before: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
        after: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
        style: 'Bohème Chic',
        caption: 'Salon classique → Ambiance bohème',
      },
    ],
  },
  {
    id: 'chambre',
    icon: BedDouble,
    title: 'Chambre à Coucher',
    description: 'Créez un espace de repos apaisant et personnalisé.',
    examples: [
      {
        before: 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800',
        after: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800',
        style: 'Scandinave Cosy',
        caption: 'Chambre basique → Cocon douillet',
      },
      {
        before: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800',
        after: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800',
        style: 'Luxe Moderne',
        caption: 'Chambre simple → Suite hôtel de luxe',
      },
    ],
  },
  {
    id: 'cuisine',
    icon: UtensilsCrossed,
    title: 'Cuisine',
    description: 'Réinventez votre cuisine en espace fonctionnel et esthétique.',
    examples: [
      {
        before: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
        after: 'https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=800',
        style: 'Contemporain',
        caption: 'Cuisine ancienne → Îlot central moderne',
      },
      {
        before: 'https://images.unsplash.com/photo-1570739574068-61ebac9f0a3d?w=800',
        after: 'https://images.unsplash.com/photo-1556909114-b1ab6a3f3b28?w=800',
        style: 'Campagne Chic',
        caption: 'Cuisine standard → Style ferme rénovée',
      },
    ],
  },
  {
    id: 'bureau',
    icon: Building2,
    title: 'Bureau & Espace de Travail',
    description: 'Optimisez votre productivité avec un bureau bien aménagé.',
    examples: [
      {
        before: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
        after: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800',
        style: 'Home Office Pro',
        caption: 'Coin bureau → Espace de travail optimisé',
      },
      {
        before: 'https://images.unsplash.com/photo-1486946255434-2466348c2166?w=800',
        after: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800',
        style: 'Créatif Inspirant',
        caption: 'Bureau standard → Studio créatif',
      },
    ],
  },
  {
    id: 'home-staging',
    icon: Home,
    title: 'Home Staging Immobilier',
    description: 'Valorisez vos biens pour une vente plus rapide.',
    examples: [
      {
        before: 'https://images.unsplash.com/photo-1489171078254-c3365d6e359f?w=800',
        after: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
        style: 'Staging Premium',
        caption: 'Pièce vide → Mise en valeur immobilière',
      },
      {
        before: 'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800',
        after: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800',
        style: 'Moderne Épuré',
        caption: 'Espace brut → Appartement de standing',
      },
    ],
  },
  {
    id: 'styles',
    icon: Palette,
    title: 'Exploration de Styles',
    description: 'Testez différents styles sur la même pièce.',
    examples: [
      {
        before: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        after: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800',
        style: 'Industriel',
        caption: 'Même pièce → Style industriel',
      },
      {
        before: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        after: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800',
        style: 'Japandi',
        caption: 'Même pièce → Style Japandi',
      },
    ],
  },
];

// Statistiques
const stats = [
  { value: '50+', label: 'Styles disponibles' },
  { value: '15s', label: 'Par génération' },
  { value: '4K', label: 'Qualité HD' },
  { value: '100%', label: 'Personnalisable' },
];

export default function ExemplesPage() {
  return (
    <div className="min-h-screen bg-[--white]">
      {/* Hero Section */}
      <section className="relative py-20 gradient-hero overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[--terracotta-light] rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[--terracotta-light] rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="badge-primary inline-flex mb-6">
              <Sparkles className="h-4 w-4" />
              <span>Galerie d&apos;exemples</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[--text-dark] mb-6">
              Découvrez ce que l&apos;IA peut
              <span className="text-gradient"> transformer</span>
            </h1>
            
            <p className="text-lg md:text-xl text-[--text-muted] mb-8 max-w-2xl mx-auto">
              Des exemples concrets pour chaque type de pièce et chaque style. 
              Inspirez-vous et imaginez votre propre transformation.
            </p>
            
            <Link href="/generate">
              <Button className="btn-primary h-12 px-8 text-lg rounded-xl">
                Essayer maintenant
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-8 bg-[--cream] border-y border-[--border-color]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="text-3xl font-bold text-[--terracotta]">{stat.value}</div>
                <div className="text-sm text-[--text-muted]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          {useCases.map((useCase, index) => (
            <div 
              key={useCase.id} 
              className={`mb-24 last:mb-0 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
            >
              {/* Header */}
              <div className="flex items-center gap-4 mb-8">
                <div className="h-14 w-14 rounded-2xl bg-[--terracotta-light] flex items-center justify-center">
                  <useCase.icon className="h-7 w-7 text-[--terracotta]" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-[--text-dark]">
                    {useCase.title}
                  </h2>
                  <p className="text-[--text-muted]">{useCase.description}</p>
                </div>
              </div>

              {/* Examples Grid */}
              <div className="grid md:grid-cols-2 gap-8">
                {useCase.examples.map((example, exIndex) => (
                  <div 
                    key={exIndex} 
                    className="card-interactive p-4 group"
                  >
                    {/* Before/After Images */}
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-4">
                      {/* Before Image */}
                      <Image
                        src={example.before}
                        alt={`Avant: ${example.caption}`}
                        fill
                        className="object-cover transition-opacity duration-500 group-hover:opacity-0"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      {/* After Image */}
                      <Image
                        src={example.after}
                        alt={`Après: ${example.caption}`}
                        fill
                        className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      
                      {/* Labels */}
                      <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-full transition-opacity group-hover:opacity-0">
                        Avant
                      </div>
                      <div className="absolute top-3 left-3 px-3 py-1 bg-[--terracotta] text-white text-xs font-medium rounded-full opacity-0 transition-opacity group-hover:opacity-100">
                        Après
                      </div>
                      
                      {/* Hover Instruction */}
                      <div className="absolute bottom-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-sm text-[--text-dark] text-xs font-medium rounded-full">
                        Survolez pour voir le résultat
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="inline-block px-2 py-1 bg-[--terracotta-light] text-[--terracotta-dark] text-xs font-medium rounded-md mb-1">
                          {example.style}
                        </span>
                        <p className="text-sm text-[--text-muted]">{example.caption}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[--cream]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-[--text-dark] mb-4">
              Prêt à transformer votre intérieur ?
            </h2>
            <p className="text-lg text-[--text-muted] mb-8">
              Commencez gratuitement avec 3 crédits offerts. 
              Aucune carte bancaire requise.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/generate">
                <Button className="btn-primary h-12 px-8 text-lg rounded-xl">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Essayer gratuitement
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" className="h-12 px-8 text-lg rounded-xl border-[--border-color] text-[--text-dark] hover:bg-[--terracotta-light]">
                  Voir les tarifs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
