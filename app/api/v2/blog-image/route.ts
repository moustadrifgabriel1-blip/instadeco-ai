/**
 * API Route: /api/v2/blog-image
 * 
 * Génère des images pour les articles de blog en utilisant plusieurs sources
 * avec système de fallback robuste.
 * 
 * Usage: /api/v2/blog-image?query=interior+design&w=800&h=600
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const revalidate = 86400; // Cache 24h

// Liste d'images de décoration intérieure statiques en fallback
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop', // Salon moderne
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&h=600&fit=crop', // Chambre design
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&h=600&fit=crop', // Cuisine contemporaine
  'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&h=600&fit=crop', // Salle de bain luxe
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop', // Architecture intérieure
  'https://images.unsplash.com/photo-1615529328331-f8917597711f?w=800&h=600&fit=crop', // Bureau moderne
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop', // Décoration scandinave
  'https://images.unsplash.com/photo-1615873968403-89e068629265?w=800&h=600&fit=crop', // Minimalisme
  'https://images.unsplash.com/photo-1616137466211-f939a420be84?w=800&h=600&fit=crop', // Art déco
  'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=800&h=600&fit=crop', // Home staging
];

// Mapping des mots-clés vers des images spécifiques
const KEYWORD_IMAGES: Record<string, string[]> = {
  'salon': [
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&h=600&fit=crop',
  ],
  'chambre': [
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&h=600&fit=crop',
  ],
  'cuisine': [
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop',
  ],
  'salle de bain': [
    'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&h=600&fit=crop',
  ],
  'bureau': [
    'https://images.unsplash.com/photo-1615529328331-f8917597711f?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&h=600&fit=crop',
  ],
  'minimaliste': [
    'https://images.unsplash.com/photo-1615873968403-89e068629265?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop',
  ],
  'scandinave': [
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop',
  ],
  'home staging': [
    'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
  ],
  'rénovation': [
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600566753376-12c8ab7a06fd?w=800&h=600&fit=crop',
  ],
  'murs': [
    'https://images.unsplash.com/photo-1615873968403-89e068629265?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1616137466211-f939a420be84?w=800&h=600&fit=crop',
  ],
  'sol': [
    'https://images.unsplash.com/photo-1600566753376-12c8ab7a06fd?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&h=600&fit=crop',
  ],
  'tableaux': [
    'https://images.unsplash.com/photo-1616137466211-f939a420be84?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=800&h=600&fit=crop',
  ],
  'décoration': [
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&h=600&fit=crop',
  ],
};

/**
 * Trouve l'image la plus appropriée basée sur les mots-clés
 */
function findBestImage(query: string): string {
  const normalizedQuery = query.toLowerCase();
  
  // Chercher un match dans les mots-clés
  for (const [keyword, images] of Object.entries(KEYWORD_IMAGES)) {
    if (normalizedQuery.includes(keyword)) {
      // Retourner une image aléatoire du groupe
      return images[Math.floor(Math.random() * images.length)];
    }
  }
  
  // Si pas de match, utiliser le hash de la query pour sélectionner une image constante
  const hash = query.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const index = Math.abs(hash) % FALLBACK_IMAGES.length;
  return FALLBACK_IMAGES[index];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || 'interior design';
    const width = parseInt(searchParams.get('w') || '800', 10);
    const height = parseInt(searchParams.get('h') || '600', 10);
    
    // Trouver la meilleure image
    const imageUrl = findBestImage(query);
    
    // Modifier les dimensions si nécessaire
    const finalUrl = imageUrl
      .replace(/w=\d+/, `w=${width}`)
      .replace(/h=\d+/, `h=${height}`);
    
    // Rediriger vers l'image
    return NextResponse.redirect(finalUrl, {
      status: 302,
      headers: {
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
    
  } catch (error) {
    console.error('[blog-image] Error:', error);
    
    // Fallback absolu
    return NextResponse.redirect(FALLBACK_IMAGES[0], {
      status: 302,
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
}
