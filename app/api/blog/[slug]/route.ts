/**
 * API Route: /api/blog/[slug]
 * 
 * Récupère un article par son slug.
 * Endpoint public pour le frontend.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SupabaseBlogArticleRepository } from '@/src/infrastructure/repositories/SupabaseBlogArticleRepository';
import { GetBlogArticleBySlugUseCase } from '@/src/application/use-cases/blog/GetBlogArticleBySlugUseCase';

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

    // Initialiser le repository et use case
    const repository = new SupabaseBlogArticleRepository();
    const useCase = new GetBlogArticleBySlugUseCase(repository);

    // Récupérer l'article avec les articles liés
    const result = await useCase.execute({
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
