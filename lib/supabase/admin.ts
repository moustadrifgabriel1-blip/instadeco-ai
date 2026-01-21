import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Export du client admin Supabase (bypass RLS)
export const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Re-export des fonctions de crédits pour compatibilité
export { deductCredits, addCredits, getUserCredits } from './credits';

// Re-export des fonctions de storage pour compatibilité
export { uploadImageFromBase64, uploadImageFromUrl } from './storage';

/**
 * Seed initial data: Styles et Room Types
 * À exécuter une seule fois lors de l'initialisation du projet
 */
export async function seedSupabaseData() {
  console.log('[Supabase Seed] Début de l\'initialisation...');

  // Styles de décoration
  const styles = [
    {
      slug: 'boheme',
      name: 'Bohème Chic',
      description: 'Style hippie moderne avec textiles naturels, couleurs chaudes, macramé et plantes',
      prompt_template: 'bohemian interior design, natural textures, warm colors, macramé, plants',
      thumbnail_url: '/images/styles/boheme.jpg',
      is_active: true,
      sort_order: 1,
    },
    {
      slug: 'minimaliste',
      name: 'Minimaliste Scandinave',
      description: 'Lignes épurées, tons neutres, bois clair, fonctionnalité avant tout',
      prompt_template: 'minimalist scandinavian interior, clean lines, neutral colors, light wood',
      thumbnail_url: '/images/styles/minimaliste.jpg',
      is_active: true,
      sort_order: 2,
    },
    {
      slug: 'industriel',
      name: 'Industriel Moderne',
      description: 'Briques apparentes, métal, béton, esprit loft new-yorkais',
      prompt_template: 'industrial loft interior, exposed brick, metal fixtures, concrete',
      thumbnail_url: '/images/styles/industriel.jpg',
      is_active: true,
      sort_order: 3,
    },
    {
      slug: 'moderne',
      name: 'Moderne Contemporain',
      description: 'Design actuel, fonctionnel, élégant, couleurs neutres avec touches de couleur',
      prompt_template: 'modern contemporary interior, sleek design, elegant, functional',
      thumbnail_url: '/images/styles/moderne.jpg',
      is_active: true,
      sort_order: 4,
    },
    {
      slug: 'classique',
      name: 'Classique Élégant',
      description: 'Moulures, mobilier traditionnel, raffinement, élégance intemporelle',
      prompt_template: 'classic elegant interior, traditional furniture, refined details',
      thumbnail_url: '/images/styles/classique.jpg',
      is_active: true,
      sort_order: 5,
    },
    {
      slug: 'japandi',
      name: 'Japandi',
      description: 'Fusion japonais-scandinave, minimalisme zen, matériaux naturels',
      prompt_template: 'japandi interior design, japanese scandinavian fusion, minimalist zen, natural materials',
      thumbnail_url: '/images/styles/japandi.jpg',
      is_active: true,
      sort_order: 6,
    },
    {
      slug: 'midcentury',
      name: 'Mid-Century Modern',
      description: 'Design années 50-60, lignes organiques, mobilier iconique',
      prompt_template: 'mid-century modern interior, 1950s design, organic lines, iconic furniture',
      thumbnail_url: '/images/styles/midcentury.jpg',
      is_active: true,
      sort_order: 7,
    },
    {
      slug: 'coastal',
      name: 'Coastal',
      description: 'Inspiration bord de mer, tons bleus et blancs, matériaux naturels',
      prompt_template: 'coastal interior design, beach house style, blue and white tones, natural materials',
      thumbnail_url: '/images/styles/coastal.jpg',
      is_active: true,
      sort_order: 8,
    },
  ];

  // Types de pièces
  const roomTypes = [
    { slug: 'salon', name: 'Salon', icon: '🛋️', is_active: true },
    { slug: 'chambre', name: 'Chambre', icon: '🛏️', is_active: true },
    { slug: 'cuisine', name: 'Cuisine', icon: '🍳', is_active: true },
    { slug: 'salle-de-bain', name: 'Salle de Bain', icon: '🚿', is_active: true },
    { slug: 'bureau', name: 'Bureau', icon: '💼', is_active: true },
    { slug: 'salle-a-manger', name: 'Salle à Manger', icon: '🍽️', is_active: true },
  ];

  try {
    // Importer les styles
    const { error: stylesError } = await supabaseAdmin
      .from('styles')
      .upsert(styles, { onConflict: 'slug' });

    if (stylesError) {
      console.error('[Supabase Seed] Erreur styles:', stylesError);
      throw stylesError;
    }

    // Importer les types de pièces
    const { error: roomTypesError } = await supabaseAdmin
      .from('room_types')
      .upsert(roomTypes, { onConflict: 'slug' });

    if (roomTypesError) {
      console.error('[Supabase Seed] Erreur roomTypes:', roomTypesError);
      throw roomTypesError;
    }

    console.log('[Supabase Seed] ✅ Données importées avec succès');
    console.log(`- ${styles.length} styles de décoration`);
    console.log(`- ${roomTypes.length} types de pièces`);

    return { success: true, stylesCount: styles.length, roomTypesCount: roomTypes.length };
  } catch (error) {
    console.error('[Supabase Seed] Erreur:', error);
    throw error;
  }
}
