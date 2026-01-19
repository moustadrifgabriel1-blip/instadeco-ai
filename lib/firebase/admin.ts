import * as admin from 'firebase-admin';

// Initialiser Firebase Admin (côté serveur uniquement)
if (!admin.apps.length) {
  let serviceAccount;
  
  // En production (Vercel), utiliser la variable d'environnement JSON
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch (e) {
      console.error('[Firebase Admin] Erreur parsing FIREBASE_SERVICE_ACCOUNT_JSON:', e);
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON');
    }
  } else {
    // En local, utiliser le fichier
    try {
      serviceAccount = require('../../firebase-service-account.json');
    } catch (e) {
      console.error('[Firebase Admin] Fichier firebase-service-account.json introuvable');
      throw new Error('Firebase service account not configured');
    }
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();

// Helper: Vérifier l'authentification dans les API Routes
export async function verifyAuth(token: string | undefined) {
  if (!token) {
    throw new Error('No token provided');
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Helper: Déduire des crédits (transaction atomique)
export async function deductCredits(userId: string, amount: number): Promise<boolean> {
  const userRef = adminDb.collection('users').doc(userId);

  try {
    const result = await adminDb.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const currentCredits = userDoc.data()?.credits || 0;

      if (currentCredits < amount) {
        return false; // Solde insuffisant
      }

      // Déduire les crédits
      transaction.update(userRef, {
        credits: currentCredits - amount,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Enregistrer la transaction
      const transactionRef = adminDb.collection('creditTransactions').doc();
      transaction.set(transactionRef, {
        userId,
        amount: -amount,
        type: 'usage',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return true;
    });

    return result;
  } catch (error) {
    console.error('Error deducting credits:', error);
    throw error;
  }
}

// Helper: Ajouter des crédits (achat)
export async function addCredits(
  userId: string,
  amount: number,
  stripePaymentIntentId?: string
): Promise<void> {
  const userRef = adminDb.collection('users').doc(userId);

  await adminDb.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);

    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const currentCredits = userDoc.data()?.credits || 0;

    // Ajouter les crédits
    transaction.update(userRef, {
      credits: currentCredits + amount,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Enregistrer la transaction
    const transactionRef = adminDb.collection('creditTransactions').doc();
    transaction.set(transactionRef, {
      userId,
      amount,
      type: 'purchase',
      stripePaymentIntentId: stripePaymentIntentId || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
}
/**
 * Seed initial data: Styles et Room Types
 * À exécuter une seule fois lors de l'initialisation du projet
 */
export async function seedFirestoreData() {
  console.log('[Firestore Seed] Début de l\'initialisation...');

  // Styles de décoration
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

  // Types de pièces
  const roomTypes = [
    { slug: 'salon', name: 'Salon', icon: '🛋️', isActive: true },
    { slug: 'chambre', name: 'Chambre', icon: '🛏️', isActive: true },
    { slug: 'cuisine', name: 'Cuisine', icon: '🍳', isActive: true },
    { slug: 'salle-de-bain', name: 'Salle de Bain', icon: '🚿', isActive: true },
    { slug: 'bureau', name: 'Bureau', icon: '💼', isActive: true },
    { slug: 'salle-a-manger', name: 'Salle à Manger', icon: '🍽️', isActive: true },
  ];

  try {
    // Importer les styles
    const batch = adminDb.batch();
    
    styles.forEach((style) => {
      const docRef = adminDb.collection('styles').doc(style.slug);
      batch.set(docRef, {
        ...style,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    roomTypes.forEach((roomType) => {
      const docRef = adminDb.collection('roomTypes').doc(roomType.slug);
      batch.set(docRef, {
        ...roomType,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    
    console.log('[Firestore Seed] ✅ Données importées avec succès');
    console.log(`- ${styles.length} styles de décoration`);
    console.log(`- ${roomTypes.length} types de pièces`);
    
    return { success: true, stylesCount: styles.length, roomTypesCount: roomTypes.length };
  } catch (error) {
    console.error('[Firestore Seed] Erreur:', error);
    throw error;
  }
}