import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/v2/download?id=xxx
 * 
 * Télécharge une image avec filigrane appliqué côté serveur
 * Résout les problèmes CORS avec les images Fal.ai
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const generationId = searchParams.get('id');
    
    if (!generationId) {
      return NextResponse.json({ error: 'ID de génération requis' }, { status: 400 });
    }

    // Vérifier l'authentification
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer la génération
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

    // Si HD débloqué, retourner l'image originale
    if (generation.hd_unlocked) {
      const imageResponse = await fetch(generation.output_image_url);
      const imageBuffer = await imageResponse.arrayBuffer();
      
      return new NextResponse(new Uint8Array(imageBuffer), {
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Disposition': `attachment; filename="instadeco-hd-${generationId}.jpg"`,
        },
      });
    }

    // Sinon, ajouter le filigrane côté serveur
    const imageResponse = await fetch(generation.output_image_url);
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Utiliser sharp pour ajouter le filigrane (si disponible)
    // Sinon, retourner l'image avec un SVG overlay
    try {
      const sharp = (await import('sharp')).default;
      
      // Récupérer les métadonnées de l'image
      const image = sharp(Buffer.from(imageBuffer));
      const metadata = await image.metadata();
      const width = metadata.width || 1024;
      const height = metadata.height || 768;
      
      // Créer le SVG du filigrane
      const fontSize = Math.max(width / 8, 60);
      const aiFontSize = Math.max(width / 50, 12);
      
      const watermarkSvg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/>
            </filter>
          </defs>
          <g transform="translate(${width/2}, ${height/2}) rotate(-15)">
            <text 
              x="0" y="0" 
              font-family="Arial, sans-serif" 
              font-size="${fontSize}" 
              font-weight="bold" 
              fill="rgba(255,255,255,0.45)" 
              text-anchor="middle" 
              dominant-baseline="middle"
              filter="url(#shadow)"
            >InstaDeco</text>
          </g>
          <text 
            x="${width - 15}" y="${height - 10}" 
            font-family="Arial, sans-serif" 
            font-size="${aiFontSize}" 
            fill="rgba(255,255,255,0.6)" 
            text-anchor="end"
            filter="url(#shadow)"
          >Généré par IA</text>
        </svg>
      `;
      
      // Composer l'image avec le filigrane
      const watermarkedImage = await image
        .composite([{
          input: Buffer.from(watermarkSvg),
          top: 0,
          left: 0,
        }])
        .jpeg({ quality: 92 })
        .toBuffer();
      
      return new NextResponse(new Uint8Array(watermarkedImage), {
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Disposition': `attachment; filename="instadeco-${generationId}.jpg"`,
        },
      });
    } catch (sharpError) {
      console.error('[Download] Sharp not available, returning original:', sharpError);
      
      // Fallback: retourner l'image originale
      return new NextResponse(new Uint8Array(Buffer.from(imageBuffer)), {
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Disposition': `attachment; filename="instadeco-${generationId}.jpg"`,
        },
      });
    }
    
  } catch (error) {
    console.error('[Download] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
