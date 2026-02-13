import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v2/download?id=xxx
 * 
 * Télécharge l'image de la génération
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const generationId = searchParams.get('id');
    
    if (!generationId) {
      return NextResponse.json({ error: 'ID de génération requis' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { data: generation, error } = await supabase
      .from('generations')
      .select('*')
      .eq('id', generationId)
      .eq('user_id', user.id)
      .single();

    if (error || !generation) {
      return NextResponse.json({ error: 'Génération non trouvée' }, { status: 404 });
    }

    if (!generation.output_image_url) {
      return NextResponse.json({ error: 'Image non disponible' }, { status: 404 });
    }

    // Retourner l'image originale
    const imageResponse = await fetch(generation.output_image_url);
    const imageBuffer = await imageResponse.arrayBuffer();
    
    return new NextResponse(new Uint8Array(imageBuffer), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="instadeco-${generationId}.jpg"`,
      },
    });
    
  } catch (error) {
    console.error('[Download] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
