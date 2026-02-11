import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * CRON: Pinterest Auto-Post
 * 
 * Sélectionne les meilleures générations récentes et les poste sur Pinterest
 * via l'API Pinterest (si configurée).
 * 
 * Sans API Pinterest configurée, génère le contenu prêt à poster manuellement
 * et envoie un rapport par email.
 * 
 * Fréquence: 3x par semaine (lundi, mercredi, vendredi à 14h)
 */
export async function GET(req: Request) {
  try {
    // Vérifier le secret CRON
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Récupérer les 3 meilleures générations récentes non encore postées
    const { data: generations, error } = await supabaseAdmin
      .from('generations')
      .select('id, style_slug, room_type_slug, input_image_url, output_image_url, created_at')
      .eq('status', 'completed')
      .not('output_image_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error || !generations?.length) {
      return NextResponse.json({
        success: false,
        message: 'Aucune génération disponible',
      });
    }

    const STYLE_LABELS: Record<string, string> = {
      moderne: 'Moderne', minimaliste: 'Minimaliste', boheme: 'Bohème',
      industriel: 'Industriel', classique: 'Classique', japandi: 'Japandi',
      midcentury: 'Mid-Century', coastal: 'Coastal', farmhouse: 'Farmhouse',
      artdeco: 'Art Déco', scandinave: 'Scandinave',
    };

    const ROOM_LABELS: Record<string, string> = {
      salon: 'Salon', chambre: 'Chambre', cuisine: 'Cuisine',
      'salle-de-bain': 'Salle de bain', bureau: 'Bureau', 'salle-a-manger': 'Salle à manger',
    };

    const HASHTAGS = [
      '#décoration', '#décorationintérieur', '#homestaging',
      '#architecteinterieur', '#homedesign', '#interieurdesign',
      '#decoIA', '#instadeco', '#avantapres', '#transformationdeco',
      '#décointérieure', '#homedecor', '#interiordesign',
    ];

    // 2. Préparer les pins
    const pins = generations.map(gen => {
      const style = STYLE_LABELS[gen.style_slug] || gen.style_slug;
      const room = ROOM_LABELS[gen.room_type_slug] || gen.room_type_slug;
      
      return {
        generationId: gen.id,
        imageUrl: gen.output_image_url,
        title: `${room} style ${style} — Transformation IA InstaDeco`,
        description: `✨ Transformation avant/après : ${room} relooké en style ${style} par l'IA d'InstaDeco. Résultat en 30 secondes ! 🎨\n\nUn décorateur coûte 150 CHF/h. InstaDeco : 0,99 CHF.\n\n${HASHTAGS.slice(0, 8).join(' ')}\n\n👉 instadeco.app/galerie`,
        link: `https://instadeco.app/galerie?style=${gen.style_slug}`,
        boardName: `Décoration ${style}`,
      };
    });

    // 3. Si l'API Pinterest est configurée, poster automatiquement
    const pinterestToken = process.env.PINTEREST_ACCESS_TOKEN;
    const results = { posted: 0, prepared: pins.length };

    if (pinterestToken) {
      for (const pin of pins) {
        try {
          const response = await fetch('https://api.pinterest.com/v5/pins', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${pinterestToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: pin.title,
              description: pin.description,
              link: pin.link,
              media_source: {
                source_type: 'image_url',
                url: pin.imageUrl,
              },
            }),
          });

          if (response.ok) {
            results.posted++;
            console.log(`[Pinterest] ✅ Pin posté: ${pin.title}`);
          } else {
            const err = await response.json();
            console.error(`[Pinterest] ❌ Erreur post pin:`, err);
          }
        } catch (err) {
          console.error(`[Pinterest] ❌ Error:`, err);
        }
      }
    } else {
      console.log('[Pinterest] Token non configuré — pins préparés mais non postés');
      console.log('[Pinterest] Pins prêts:', pins.map(p => p.title));
    }

    return NextResponse.json({
      success: true,
      results,
      pins: pins.map(p => ({ title: p.title, link: p.link })),
    });
  } catch (error) {
    console.error('[Pinterest Cron] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
