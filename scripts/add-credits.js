const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '..', 'firebase-service-account.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function addCredits() {
  // Trouver l'utilisateur par email
  const usersSnapshot = await db.collection('users').where('email', '==', 'moustadrifgabriel1@gmail.com').get();
  
  if (usersSnapshot.empty) {
    console.log('Utilisateur non trouvé');
    return;
  }
  
  const userDoc = usersSnapshot.docs[0];
  console.log('User ID:', userDoc.id);
  console.log('Crédits actuels:', userDoc.data().credits);
  
  // Ajouter 10 crédits
  await db.collection('users').doc(userDoc.id).update({
    credits: 10
  });
  
  console.log('✅ Crédits mis à jour: 10');
}

addCredits().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
