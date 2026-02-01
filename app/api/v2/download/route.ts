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
      
      // Créer le SVG du filigrane - TRÈS VISIBLE pour encourager l'achat HD
      const mainFontSize = Math.max(width / 5, 100); // Plus grand
      const subFontSize = Math.max(width / 12, 40);
      const ctaFontSize = Math.max(width / 18, 28);
      
      const watermarkSvg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="3" dy="3" stdDeviation="4" flood-color="rgba(0,0,0,0.5)"/>
            </filter>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <!-- Bande semi-transparente en diagonale -->
          <g transform="translate(${width/2}, ${height/2}) rotate(-25)">
            <rect x="${-width}" y="-60" width="${width * 2}" height="120" fill="rgba(0,0,0,0.35)"/>
          </g>
          
          <!-- Logo principal InstaDeco - GROS et VISIBLE -->
          <g transform="translate(${width/2}, ${height/2}) rotate(-25)">
            <text 
              x="0" y="0" 
              font-family="Arial, Helvetica, sans-serif" 
              font-size="${mainFontSize}" 
              font-weight="900" 
              fill="rgba(255,255,255,0.85)" 
              text-anchor="middle" 
              dominant-baseline="middle"
              filter="url(#shadow)"
            >InstaDeco</text>
          </g>
          
          <!-- Filigrane répété en haut à gauche -->
          <g transform="translate(${width * 0.2}, ${height * 0.15}) rotate(-25)">
            <text 
              x="0" y="0" 
              font-family="Arial, sans-serif" 
              font-size="${subFontSize}" 
              font-weight="bold" 
              fill="rgba(255,255,255,0.5)" 
              text-anchor="middle" 
              dominant-baseline="middle"
              filter="url(#shadow)"
            >InstaDeco</text>
          </g>
          
          <!-- Filigrane répété en bas à droite -->
          <g transform="translate(${width * 0.8}, ${height * 0.85}) rotate(-25)">
            <text 
              x="0" y="0" 
              font-family="Arial, sans-serif" 
              font-size="${subFontSize}" 
              font-weight="bold" 
              fill="rgba(255,255,255,0.5)" 
              text-anchor="middle" 
              dominant-baseline="middle"
              filter="url(#shadow)"
            >InstaDeco</text>
          </g>
          
          <!-- Badge CTA en bas -->
          <rect 
            x="${width/2 - 180}" y="${height - 55}" 
            width="360" height="45" 
            rx="22" ry="22" 
            fill="rgba(224,123,84,0.9)"
            filter="url(#shadow)"
          />
          <text 
            x="${width/2}" y="${height - 25}" 
            font-family="Arial, sans-serif" 
            font-size="${ctaFontSize}" 
            font-weight="bold" 
            fill="white" 
            text-anchor="middle"
            filter="url(#glow)"
          >🔓 Débloquer en HD sans filigrane</text>
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
      console.error('[Download] Sharp not available, using canvas fallback:', sharpError);
      
      // SÉCURITÉ: Ne jamais retourner l'image originale sans filigrane
      // Fallback: Créer une image dégradée avec filigrane via Canvas
      // Si sharp n'est pas disponible, on refuse le téléchargement pour des raisons de sécurité
      return NextResponse.json(
        { 
          error: 'Téléchargement temporairement indisponible', 
          message: 'Veuillez réessayer dans quelques instants ou débloquer la version HD.' 
        }, 
        { status: 503 }
      );
    }
    
  } catch (error) {
    console.error('[Download] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
