/**
 * API Route: /api/blog/articles
 * 
 * Liste paginée des articles de blog publiés.
 * Endpoint public pour le frontend.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SupabaseBlogArticleRepository } from '@/src/infrastructure/repositories/SupabaseBlogArticleRepository';
import { ListBlogArticlesUseCase } from '@/src/application/use-cases/blog/ListBlogArticlesUseCase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // Force dynamic rendering

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Paramètres de pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);
    
    // Paramètres de filtrage
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');

    // Initialiser le repository et use case
    const repository = new SupabaseBlogArticleRepository();
    const useCase = new ListBlogArticlesUseCase(repository);

    // Exécuter la requête
    const result = await useCase.execute({
      page,
      limit,
      tags: tag ? [tag] : undefined,
      search: search || undefined,
      status: 'published',
    });

    return NextResponse.json({
      success: true,
      data: result.articles,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNext: result.page < result.totalPages,
        hasPrev: result.page > 1,
      },
    });

  } catch (error) {
    console.error('API blog/articles error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
