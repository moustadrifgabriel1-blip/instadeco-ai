#!/usr/bin/env node

const admin = require('firebase-admin');

// Initialiser Firebase Admin avec les credentials du projet
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'instantdecor-ai',
  });
}

const db = admin.firestore();

const styles = [
  {
    slug: 'boheme',
    name: 'Bohème Chic',
    description: 'Style hippie moderne avec textiles naturels, couleurs chaudes, macramé et plantes',
    promptTemplate: 'bohemian interior design, natural textures, warm colors, macramé, plants',
    thumbnailUrl: '/images/styles/boheme.jpg',
    isActive: true,
    sortOrder: 1,
  },
  {
    slug: 'minimaliste',
    name: 'Minimaliste Scandinave',
    description: 'Lignes épurées, tons neutres, bois clair, fonctionnalité avant tout',
    promptTemplate: 'minimalist scandinavian interior, clean lines, neutral colors, light wood',
    thumbnailUrl: '/images/styles/minimaliste.jpg',
    isActive: true,
    sortOrder: 2,
  },
  {
    slug: 'industriel',
    name: 'Industriel Moderne',
    description: 'Briques apparentes, métal, béton, esprit loft new-yorkais',
    promptTemplate: 'industrial loft interior, exposed brick, metal fixtures, concrete',
    thumbnailUrl: '/images/styles/industriel.jpg',
    isActive: true,
    sortOrder: 3,
  },
  {
    slug: 'moderne',
    name: 'Moderne Contemporain',
    description: 'Design actuel, fonctionnel, élégant, couleurs neutres avec touches de couleur',
    promptTemplate: 'modern contemporary interior, sleek design, elegant, functional',
    thumbnailUrl: '/images/styles/moderne.jpg',
    isActive: true,
    sortOrder: 4,
  },
  {
    slug: 'classique',
    name: 'Classique Élégant',
    description: 'Moulures, mobilier traditionnel, raffinement, élégance intemporelle',
    promptTemplate: 'classic elegant interior, traditional furniture, refined details',
    thumbnailUrl: '/images/styles/classique.jpg',
    isActive: true,
    sortOrder: 5,
  },
  {
    slug: 'japandi',
    name: 'Japandi',
    description: 'Fusion japonais-scandinave, minimalisme zen, matériaux naturels',
    promptTemplate: 'japandi interior design, japanese scandinavian fusion, minimalist zen, natural materials',
    thumbnailUrl: '/images/styles/japandi.jpg',
    isActive: true,
    sortOrder: 6,
  },
  {
    slug: 'midcentury',
    name: 'Mid-Century Modern',
    description: 'Design années 50-60, lignes organiques, mobilier iconique',
    promptTemplate: 'mid-century modern interior, 1950s design, organic lines, iconic furniture',
    thumbnailUrl: '/images/styles/midcentury.jpg',
    isActive: true,
    sortOrder: 7,
  },
  {
    slug: 'coastal',
    name: 'Coastal',
    description: 'Inspiration bord de mer, tons bleus et blancs, matériaux naturels',
    promptTemplate: 'coastal interior design, beach house style, blue and white tones, natural materials',
    thumbnailUrl: '/images/styles/coastal.jpg',
    isActive: true,
    sortOrder: 8,
  },
];

const roomTypes = [
  { slug: 'salon', name: 'Salon', icon: '🛋️', isActive: true },
  { slug: 'chambre', name: 'Chambre', icon: '🛏️', isActive: true },
  { slug: 'cuisine', name: 'Cuisine', icon: '🍳', isActive: true },
  { slug: 'salle-de-bain', name: 'Salle de Bain', icon: '🚿', isActive: true },
  { slug: 'bureau', name: 'Bureau', icon: '💼', isActive: true },
  { slug: 'salle-a-manger', name: 'Salle à Manger', icon: '🍽️', isActive: true },
];

async function seedFirestore() {
  console.log('🌱 [Seed] Début de l\'initialisation Firestore...');
  
  try {
    const batch = db.batch();
    
    // Ajouter les styles
    styles.forEach((style) => {
      const docRef = db.collection('styles').doc(style.slug);
      batch.set(docRef, {
        ...style,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    
    // Ajouter les roomTypes
    roomTypes.forEach((roomType) => {
      const docRef = db.collection('roomTypes').doc(roomType.slug);
      batch.set(docRef, {
        ...roomType,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    
    await batch.commit();
    
    console.log('✅ [Seed] Données importées avec succès !');
    console.log(`   - ${styles.length} styles de décoration`);
    console.log(`   - ${roomTypes.length} types de pièces`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ [Seed] Erreur:', error);
    process.exit(1);
  }
}

seedFirestore();
