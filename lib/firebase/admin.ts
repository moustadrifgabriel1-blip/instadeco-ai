import * as admin from 'firebase-admin';

// Initialiser Firebase Admin (côté serveur uniquement)
if (!admin.apps.length) {
  const serviceAccount = require(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '../../firebase-service-account.json'
  );

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
