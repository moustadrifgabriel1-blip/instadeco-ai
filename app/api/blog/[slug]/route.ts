/**
 * API Route: /api/blog/[slug]
 * 
 * Récupère un article par son slug.
 * Endpoint public pour le frontend.
 */

import { NextRequest, NextResponse } from 'next/server';
import { useCases } from '@/src/infrastructure/config/di-container';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Slug requis' },
        { status: 400 }
      );
    }

    // Récupérer l'article via le use case (DI container)
    const result = await useCases.getBlogArticleBySlug.execute({
      slug,
      includeRelated: true,
      relatedLimit: 3,
    });

    if (!result.article) {
      return NextResponse.json(
        { success: false, error: 'Article non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        article: result.article,
        related: result.relatedArticles || [],
      },
    });

  } catch (error) {
    console.error('API blog/[slug] error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
