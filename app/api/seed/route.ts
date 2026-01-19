import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';

/**
 * POST /api/seed
 * 
 * Initialise les collections Firestore avec les données de base:
 * - styles (8 styles de décoration)
 * - roomTypes (6 types de pièces)
 * 
 * ⚠️ À exécuter une seule fois lors de l'initialisation du projet
 * ⚠️ Uniquement disponible en développement
 */
export async function POST(req: Request) {
  try {
    // Sécurité: Uniquement en développement
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Endpoint disponible uniquement en développement' },
        { status: 403 }
      );
    }

    console.log('[Seed] Début de l\'initialisation Firestore...');

    // ====================================
    // STYLES DE DÉCORATION
    // ====================================
    const styles = [
      {
        id: 'boheme',
        slug: 'boheme',
        name: 'Bohème Chic',
        description: 'Style hippie moderne avec textiles naturels, couleurs chaudes',
        thumbnailUrl: '/images/styles/boheme.jpg',
        promptTemplate: 'bohemian interior design, natural textures, warm colors, macramé, plants',
        isActive: true,
        sortOrder: 1,
      },
      {
        id: 'minimaliste',
        slug: 'minimaliste',
        name: 'Minimaliste Scandinave',
        description: 'Lignes épurées, tons neutres, bois clair',
        thumbnailUrl: '/images/styles/minimaliste.jpg',
        promptTemplate: 'minimalist scandinavian interior, clean lines, neutral colors, light wood',
        isActive: true,
        sortOrder: 2,
      },
      {
        id: 'industriel',
        slug: 'industriel',
        name: 'Industriel Moderne',
        description: 'Briques apparentes, métal, esprit loft',
        thumbnailUrl: '/images/styles/industriel.jpg',
        promptTemplate: 'industrial loft interior, exposed brick, metal fixtures, concrete',
        isActive: true,
        sortOrder: 3,
      },
      {
        id: 'moderne',
        slug: 'moderne',
        name: 'Moderne Contemporain',
        description: 'Design actuel, fonctionnel, élégant',
        thumbnailUrl: '/images/styles/moderne.jpg',
        promptTemplate: 'modern contemporary interior, sleek design, elegant, functional',
        isActive: true,
        sortOrder: 4,
      },
      {
        id: 'classique',
        slug: 'classique',
        name: 'Classique Élégant',
        description: 'Moulures, mobilier traditionnel, raffinement',
        thumbnailUrl: '/images/styles/classique.jpg',
        promptTemplate: 'classic elegant interior, traditional furniture, refined details',
        isActive: true,
        sortOrder: 5,
      },
      {
        id: 'japonais',
        slug: 'japonais',
        name: 'Japonais Zen',
        description: 'Simplicité, nature, harmonie',
        thumbnailUrl: '/images/styles/japonais.jpg',
        promptTemplate: 'japanese zen interior, minimalist, natural materials, peaceful atmosphere',
        isActive: true,
        sortOrder: 6,
      },
      {
        id: 'mediterraneen',
        slug: 'mediterraneen',
        name: 'Méditerranéen',
        description: 'Couleurs vives, carreaux, ambiance estivale',
        thumbnailUrl: '/images/styles/mediterraneen.jpg',
        promptTemplate: 'mediterranean interior, bright colors, tiles, summer vibes',
        isActive: true,
        sortOrder: 7,
      },
      {
        id: 'art-deco',
        slug: 'art-deco',
        name: 'Art Déco',
        description: 'Géométrie, luxe, années 20',
        thumbnailUrl: '/images/styles/art-deco.jpg',
        promptTemplate: 'art deco interior, geometric patterns, luxury, 1920s style',
        isActive: true,
        sortOrder: 8,
      },
    ];

    // Vérifier si les styles existent déjà
    const stylesSnapshot = await getDocs(collection(db, 'styles'));
    
    if (stylesSnapshot.empty) {
      console.log('[Seed] Insertion de 8 styles...');
      
      for (const style of styles) {
        await setDoc(doc(db, 'styles', style.id), {
          ...style,
          createdAt: new Date(),
        });
      }
      
      console.log('[Seed] ✅ 8 styles insérés');
    } else {
      console.log('[Seed] ⚠️ Styles déjà existants, skip');
    }

    // ====================================
    // TYPES DE PIÈCES
    // ====================================
    const roomTypes = [
      {
        id: 'salon',
        slug: 'salon',
        name: 'Salon',
        icon: '🛋️',
        isActive: true,
      },
      {
        id: 'chambre',
        slug: 'chambre',
        name: 'Chambre',
        icon: '🛏️',
        isActive: true,
      },
      {
        id: 'cuisine',
        slug: 'cuisine',
        name: 'Cuisine',
        icon: '🍳',
        isActive: true,
      },
      {
        id: 'salle-de-bain',
        slug: 'salle-de-bain',
        name: 'Salle de Bain',
        icon: '🚿',
        isActive: true,
      },
      {
        id: 'bureau',
        slug: 'bureau',
        name: 'Bureau',
        icon: '💼',
        isActive: true,
      },
      {
        id: 'salle-a-manger',
        slug: 'salle-a-manger',
        name: 'Salle à Manger',
        icon: '🍽️',
        isActive: true,
      },
    ];

    // Vérifier si les roomTypes existent déjà
    const roomTypesSnapshot = await getDocs(collection(db, 'roomTypes'));
    
    if (roomTypesSnapshot.empty) {
      console.log('[Seed] Insertion de 6 types de pièces...');
      
      for (const roomType of roomTypes) {
        await setDoc(doc(db, 'roomTypes', roomType.id), {
          ...roomType,
          createdAt: new Date(),
        });
      }
      
      console.log('[Seed] ✅ 6 types de pièces insérés');
    } else {
      console.log('[Seed] ⚠️ RoomTypes déjà existants, skip');
    }

    console.log('[Seed] ✅ Initialisation Firestore terminée');

    return NextResponse.json({
      success: true,
      message: 'Firestore initialisé avec succès',
      data: {
        styles: styles.length,
        roomTypes: roomTypes.length,
      },
    });

  } catch (error) {
    console.error('[Seed] ❌ Erreur:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de l\'initialisation',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
