import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v2/download?id=xxx
 * 
 * Télécharge une image avec filigrane appliqué côté serveur
 * Utilise uniquement des formes SVG (pas de texte/polices)
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

    // Si HD débloqué, retourner l'image originale SANS filigrane
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

    // Ajouter le filigrane côté serveur
    const imageResponse = await fetch(generation.output_image_url);
    const imageBuffer = await imageResponse.arrayBuffer();
    
    try {
      const sharp = (await import('sharp')).default;
      
      const image = sharp(Buffer.from(imageBuffer));
      const metadata = await image.metadata();
      const width = metadata.width || 1024;
      const height = metadata.height || 768;
      
      // Échelle basée sur la largeur
      const scale = width / 1000;
      const bandHeight = Math.max(Math.floor(height / 5), 100);
      
      // Générer les lignes diagonales répétées pour le pattern
      let diagonalLines = '';
      const lineSpacing = Math.round(50 * scale);
      for (let i = -height; i < width + height; i += lineSpacing) {
        diagonalLines += `<line x1="${i}" y1="0" x2="${i + height}" y2="${height}" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>`;
      }
      
      // Créer les lettres INSTADECO avec des formes géométriques pures (paths et rects)
      // Pas besoin de polices - tout est dessiné en SVG
      const ls = Math.round(55 * scale); // letter scale
      const lh = Math.round(80 * scale); // letter height
      const gap = Math.round(12 * scale); // gap between letters
      const totalWidth = ls * 9 + gap * 8;
      const sx = (width - totalWidth) / 2; // start X centré
      const sy = (height - lh) / 2; // start Y centré
      
      // Chaque lettre est définie comme une série de rectangles/paths
      // I
      const letterI = `<rect x="${sx}" y="${sy}" width="${ls * 0.35}" height="${lh}" fill="white" rx="3"/>`;
      
      // N
      const nX = sx + ls * 0.5 + gap;
      const letterN = `
        <rect x="${nX}" y="${sy}" width="${ls * 0.2}" height="${lh}" fill="white" rx="2"/>
        <rect x="${nX + ls * 0.65}" y="${sy}" width="${ls * 0.2}" height="${lh}" fill="white" rx="2"/>
        <polygon points="${nX + ls * 0.15},${sy} ${nX + ls * 0.35},${sy} ${nX + ls * 0.7},${sy + lh} ${nX + ls * 0.5},${sy + lh}" fill="white"/>
      `;
      
      // S
      const sX = nX + ls + gap;
      const letterS = `
        <path d="M${sX + ls * 0.75} ${sy + lh * 0.12} 
                 C${sX + ls * 0.75} ${sy} ${sX + ls * 0.1} ${sy} ${sX + ls * 0.1} ${sy + lh * 0.22}
                 C${sX + ls * 0.1} ${sy + lh * 0.4} ${sX + ls * 0.75} ${sy + lh * 0.4} ${sX + ls * 0.75} ${sy + lh * 0.58}
                 C${sX + ls * 0.75} ${sy + lh * 0.85} ${sX + ls * 0.1} ${sy + lh * 0.85} ${sX + ls * 0.1} ${sy + lh * 0.88}"
              stroke="white" stroke-width="${ls * 0.18}" fill="none" stroke-linecap="round"/>
      `;
      
      // T
      const tX = sX + ls + gap;
      const letterT = `
        <rect x="${tX}" y="${sy}" width="${ls * 0.85}" height="${lh * 0.18}" fill="white" rx="2"/>
        <rect x="${tX + ls * 0.32}" y="${sy}" width="${ls * 0.22}" height="${lh}" fill="white" rx="2"/>
      `;
      
      // A
      const aX = tX + ls + gap;
      const letterA = `
        <polygon points="${aX + ls * 0.42},${sy} ${aX + ls * 0.58},${sy} ${aX + ls * 0.95},${sy + lh} ${aX + ls * 0.72},${sy + lh}" fill="white"/>
        <polygon points="${aX + ls * 0.42},${sy} ${aX + ls * 0.28},${sy} ${aX - ls * 0.05},${sy + lh} ${aX + ls * 0.18},${sy + lh}" fill="white"/>
        <rect x="${aX + ls * 0.08}" y="${sy + lh * 0.55}" width="${ls * 0.74}" height="${lh * 0.15}" fill="white"/>
      `;
      
      // D
      const dX = aX + ls + gap;
      const letterD = `
        <rect x="${dX}" y="${sy}" width="${ls * 0.2}" height="${lh}" fill="white" rx="2"/>
        <path d="M${dX + ls * 0.15} ${sy + lh * 0.08} 
                 C${dX + ls * 0.9} ${sy + lh * 0.08} ${dX + ls * 0.9} ${sy + lh * 0.92} ${dX + ls * 0.15} ${sy + lh * 0.92}"
              stroke="white" stroke-width="${ls * 0.18}" fill="none"/>
      `;
      
      // E
      const eX = dX + ls + gap;
      const letterE = `
        <rect x="${eX}" y="${sy}" width="${ls * 0.2}" height="${lh}" fill="white" rx="2"/>
        <rect x="${eX}" y="${sy}" width="${ls * 0.75}" height="${lh * 0.16}" fill="white" rx="2"/>
        <rect x="${eX}" y="${sy + lh * 0.42}" width="${ls * 0.6}" height="${lh * 0.16}" fill="white" rx="2"/>
        <rect x="${eX}" y="${sy + lh * 0.84}" width="${ls * 0.75}" height="${lh * 0.16}" fill="white" rx="2"/>
      `;
      
      // C
      const cX = eX + ls + gap;
      const letterC = `
        <path d="M${cX + ls * 0.8} ${sy + lh * 0.18} 
                 C${cX + ls * 0.4} ${sy - lh * 0.05} ${cX - ls * 0.1} ${sy + lh * 0.3} ${cX + ls * 0.08} ${sy + lh * 0.5}
                 C${cX - ls * 0.1} ${sy + lh * 0.7} ${cX + ls * 0.4} ${sy + lh * 1.05} ${cX + ls * 0.8} ${sy + lh * 0.82}"
              stroke="white" stroke-width="${ls * 0.2}" fill="none" stroke-linecap="round"/>
      `;
      
      // O
      const oX = cX + ls + gap;
      const letterO = `
        <ellipse cx="${oX + ls * 0.42}" cy="${sy + lh * 0.5}" rx="${ls * 0.35}" ry="${lh * 0.42}" 
                 stroke="white" stroke-width="${ls * 0.18}" fill="none"/>
      `;
      
      // Assembler toutes les lettres
      const allLetters = letterI + letterN + letterS + letterT + letterA + letterD + letterE + letterC + letterO;
      
      // Badge en bas
      const badgeWidth = Math.round(280 * scale);
      const badgeHeight = Math.round(45 * scale);
      const badgeX = (width - badgeWidth) / 2;
      const badgeY = height - badgeHeight - 15;
      
      const watermarkSvg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <!-- Pattern de lignes diagonales -->
        ${diagonalLines}
        
        <!-- Bande centrale semi-transparente en diagonale -->
        <g transform="translate(${width/2}, ${height/2}) rotate(-20)">
          <rect x="${-width}" y="${-bandHeight/2}" width="${width * 2}" height="${bandHeight}" fill="rgba(0,0,0,0.5)"/>
        </g>
        
        <!-- Logo INSTADECO en formes géométriques (rotation -20deg) -->
        <g transform="translate(${width/2}, ${height/2}) rotate(-20) translate(${-width/2}, ${-height/2})" opacity="0.92">
          ${allLetters}
        </g>
        
        <!-- Petit watermark en haut à gauche -->
        <g transform="translate(${width * 0.12}, ${height * 0.08}) rotate(-20) scale(0.35)" opacity="0.5">
          ${allLetters}
        </g>
        
        <!-- Petit watermark en bas à droite -->
        <g transform="translate(${width * 0.65}, ${height * 0.75}) rotate(-20) scale(0.35)" opacity="0.5">
          ${allLetters}
        </g>
        
        <!-- Badge CTA en bas -->
        <rect x="${badgeX}" y="${badgeY}" width="${badgeWidth}" height="${badgeHeight}" rx="${badgeHeight/2}" fill="rgba(224,123,84,0.95)"/>
        <rect x="${badgeX + badgeWidth * 0.08}" y="${badgeY + badgeHeight * 0.25}" width="${badgeWidth * 0.84}" height="${badgeHeight * 0.5}" rx="${badgeHeight * 0.2}" fill="rgba(255,255,255,0.25)"/>
      </svg>`;
      
      const watermarkedImage = await image
        .composite([{
          input: Buffer.from(watermarkSvg),
          top: 0,
          left: 0,
        }])
        .jpeg({ quality: 90 })
        .toBuffer();
      
      return new NextResponse(new Uint8Array(watermarkedImage), {
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Disposition': `attachment; filename="instadeco-${generationId}.jpg"`,
        },
      });
      
    } catch (sharpError) {
      console.error('[Download] Sharp error:', sharpError);
      
      return NextResponse.json(
        { 
          error: 'Téléchargement temporairement indisponible', 
          message: 'Veuillez réessayer ou débloquer la version HD.',
        }, 
        { status: 503 }
      );
    }
    
  } catch (error) {
    console.error('[Download] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
